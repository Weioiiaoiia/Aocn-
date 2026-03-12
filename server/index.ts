import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Renaiss tRPC API proxy ───
const RENAISS_API = "https://www.renaiss.xyz/api/trpc/collectible.list";

interface RawCard {
  id: string;
  tokenId: string;
  itemId: string;
  name: string;
  setName: string;
  ownerAddress: string;
  askPriceInUSDT: string;
  fmvPriceInUSD: number;
  offerPriceInUSDT: string;
  frontImageUrl: string;
  attributes: { trait: string; value: string }[];
  owner: { id: string; username: string } | null;
  vaultLocation: string;
  grade: string;
  gradingCompany: string;
  year: number;
  buybackBaseValueInUSD: number;
}

interface ParsedCard {
  id: string;
  itemId: string;
  tokenId: string;
  name: string;
  setName: string;
  set: string;
  price: number;
  fmv: number;
  buyback: number;
  spread: number;
  spreadPct: number;
  imgUrl: string;
  grade: string;
  gradingCompany: string;
  year: number;
  language: string;
  cardNumber: string;
  serial: string;
  vaultLocation: string;
  ownerUsername: string;
  ebaySearchUrl: string;
}

// ─── Price History Storage ───
interface PriceSnapshot {
  timestamp: string; // ISO date string
  price: number;
  fmv: number;
  spreadPct: number;
}

// Store price history per card: { cardId: PriceSnapshot[] }
const HISTORY_DIR = path.resolve(__dirname, "..", "data");
const HISTORY_FILE = path.join(HISTORY_DIR, "price_history.json");
const MAX_HISTORY_DAYS = 30; // Keep 30 days of history
const HISTORY_SNAPSHOT_INTERVAL = 30 * 60 * 1000; // Snapshot every 30 minutes

let priceHistory: Record<string, PriceSnapshot[]> = {};
let lastSnapshotTime = 0;

function ensureHistoryDir() {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function loadPriceHistory() {
  try {
    ensureHistoryDir();
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, "utf-8");
      priceHistory = JSON.parse(raw);
      console.log(
        `[History] Loaded price history for ${Object.keys(priceHistory).length} cards`
      );
    } else {
      priceHistory = {};
      console.log("[History] No existing history file, starting fresh");
    }
  } catch (err) {
    console.error("[History] Failed to load price history:", err);
    priceHistory = {};
  }
}

function savePriceHistory() {
  try {
    ensureHistoryDir();
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(priceHistory), "utf-8");
    console.log(
      `[History] Saved price history for ${Object.keys(priceHistory).length} cards`
    );
  } catch (err) {
    console.error("[History] Failed to save price history:", err);
  }
}

function recordPriceSnapshot(cards: ParsedCard[]) {
  const now = Date.now();
  if (now - lastSnapshotTime < HISTORY_SNAPSHOT_INTERVAL && lastSnapshotTime > 0) {
    return; // Not time for a snapshot yet
  }

  const timestamp = new Date().toISOString();
  const cutoffDate = new Date(
    Date.now() - MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  let recorded = 0;
  for (const card of cards) {
    if (card.price <= 0 && card.fmv <= 0) continue; // Skip cards with no price data

    if (!priceHistory[card.id]) {
      priceHistory[card.id] = [];
    }

    // Add new snapshot
    priceHistory[card.id].push({
      timestamp,
      price: card.price,
      fmv: card.fmv,
      spreadPct: card.spreadPct,
    });

    // Prune old entries beyond MAX_HISTORY_DAYS
    priceHistory[card.id] = priceHistory[card.id].filter(
      (s) => s.timestamp >= cutoffDate
    );

    recorded++;
  }

  lastSnapshotTime = now;
  console.log(
    `[History] Recorded price snapshot for ${recorded} cards at ${timestamp}`
  );

  // Save to disk
  savePriceHistory();
}

// In-memory cache
let cachedCards: ParsedCard[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function parsePrice(raw: string | number): number {
  if (!raw || raw === "NO-OFFER-PRICE") return 0;
  const str = String(raw);
  try {
    const val = BigInt(str);
    return Number(val / BigInt(1e14)) / 10000; // More precise conversion
  } catch {
    return 0;
  }
}

function parseFmv(raw: number | string): number {
  if (!raw) return 0;
  const num = typeof raw === "string" ? parseInt(raw) : raw;
  return Math.round(num) / 100;
}

function parseCard(raw: RawCard): ParsedCard {
  const price = parsePrice(raw.askPriceInUSDT);
  const fmv = parseFmv(raw.fmvPriceInUSD);
  const buyback = parseFmv(raw.buybackBaseValueInUSD);

  const attrs: Record<string, string> = {};
  for (const attr of raw.attributes || []) {
    attrs[attr.trait] = attr.value;
  }

  const spread =
    fmv > 0 && price > 0 ? Math.round((fmv - price) * 100) / 100 : 0;
  const spreadPct =
    fmv > 0 && price > 0
      ? Math.round(((fmv - price) / fmv) * 1000) / 10
      : 0;

  const cleanName = raw.name
    .replace(/^PSA\s+/, "")
    .replace(/Gem Mint\s+/, "")
    .replace(/NM-MT\s+/, "")
    .replace(/Mint\s+/, "");

  return {
    id: raw.id,
    itemId: raw.itemId,
    tokenId: String(raw.tokenId),
    name: raw.name,
    setName: raw.setName,
    set: raw.setName,
    price,
    fmv,
    buyback,
    spread,
    spreadPct,
    imgUrl: raw.frontImageUrl,
    grade: raw.grade,
    gradingCompany: raw.gradingCompany,
    year: raw.year,
    language: attrs["Language"] || "",
    cardNumber: attrs["Card Number"] || "",
    serial: attrs["Serial"] || "",
    vaultLocation: raw.vaultLocation,
    ownerUsername: raw.owner?.username || "",
    ebaySearchUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(cleanName)}`,
  };
}

function buildTrpcInput(offset: number, limit: number) {
  return JSON.stringify({
    "0": {
      json: {
        limit,
        offset,
        search: null,
        sortBy: "listDate",
        sortOrder: "desc",
        categoryFilter: null,
        listedOnly: null,
        characterFilter: "",
        languageFilter: "",
        gradingCompanyFilter: "",
        gradeFilter: "",
        yearRange: "",
        priceRangeFilter: "",
      },
      meta: {
        values: {
          search: ["undefined"],
          categoryFilter: ["undefined"],
          listedOnly: ["undefined"],
        },
      },
    },
  });
}

async function fetchAllFromRenaiss(): Promise<ParsedCard[]> {
  const allCards: ParsedCard[] = [];
  const seenIds = new Set<string>();
  let offset = 0;
  const limit = 25;
  let total = 0;
  let hasMore = true;

  console.log("[API] Starting fetch from Renaiss marketplace...");

  while (hasMore) {
    try {
      const input = buildTrpcInput(offset, limit);
      const url = `${RENAISS_API}?batch=1&input=${encodeURIComponent(input)}`;

      const resp = await fetch(url, {
        headers: {
          "User-Agent": "AOCN-Bot/1.0",
          Accept: "*/*",
          Referer: "https://www.renaiss.xyz/marketplace",
        },
      });

      if (!resp.ok) {
        console.error(`[API] Error at offset ${offset}: ${resp.status}`);
        break;
      }

      const data = await resp.json();
      const result = data[0]?.result?.data?.json;
      if (!result) break;

      const collection = result.collection || [];
      const pagination = result.pagination || {};

      if (offset === 0) {
        total = pagination.total || 0;
        console.log(`[API] Total cards in Renaiss: ${total}`);
      }

      for (const raw of collection) {
        const card = parseCard(raw);
        if (!seenIds.has(card.id)) {
          seenIds.add(card.id);
          allCards.push(card);
        }
      }

      hasMore = pagination.hasMore === true && collection.length > 0;
      offset += limit;

      if (offset % 500 === 0) {
        console.log(`[API] Fetched ${allCards.length}/${total} cards...`);
      }

      // Rate limiting
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`[API] Error at offset ${offset}:`, err);
      await new Promise((r) => setTimeout(r, 1000));
      offset += limit; // Skip this page
    }
  }

  // Sort by spreadPct descending
  allCards.sort((a, b) => b.spreadPct - a.spreadPct);

  console.log(`[API] Fetch complete: ${allCards.length} unique cards`);
  return allCards;
}

async function getCards(): Promise<ParsedCard[]> {
  const now = Date.now();
  if (cachedCards.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return cachedCards;
  }

  try {
    cachedCards = await fetchAllFromRenaiss();
    lastFetchTime = now;

    // Record price snapshot for history
    recordPriceSnapshot(cachedCards);
  } catch (err) {
    console.error("[API] Failed to fetch cards:", err);
    // Return cached data even if stale
  }

  return cachedCards;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // Load price history from disk on startup
  loadPriceHistory();

  // ─── API Routes ───

  // Get cards with pagination, filtering, sorting
  app.get("/api/cards", async (req, res) => {
    try {
      const allCards = await getCards();
      const {
        offset = "0",
        limit = "50",
        sortBy = "spreadPct",
        sortOrder = "desc",
        search = "",
        category = "",
        listedOnly = "",
      } = req.query as Record<string, string>;

      let filtered = [...allCards];

      // Filter listed only
      if (listedOnly === "true") {
        filtered = filtered.filter((c) => c.price > 0);
      }

      // Search
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.setName.toLowerCase().includes(q) ||
            c.grade.toLowerCase().includes(q)
        );
      }

      // Category filter
      if (category) {
        filtered = filtered.filter((c) =>
          c.setName.toLowerCase().includes(category.toLowerCase())
        );
      }

      // Sort
      const sortFn = (a: ParsedCard, b: ParsedCard) => {
        let diff = 0;
        switch (sortBy) {
          case "spreadPct":
            diff = a.spreadPct - b.spreadPct;
            break;
          case "price":
            diff = a.price - b.price;
            break;
          case "fmv":
            diff = a.fmv - b.fmv;
            break;
          case "listDate":
            diff = 0;
            break; // Already sorted by list date from API
          default:
            diff = a.spreadPct - b.spreadPct;
        }
        return sortOrder === "desc" ? -diff : diff;
      };
      filtered.sort(sortFn);

      const off = parseInt(offset);
      const lim = parseInt(limit);
      const paged = filtered.slice(off, off + lim);

      const listedCards = allCards.filter((c) => c.price > 0);
      const arbitrageCount = listedCards.filter(
        (c) => c.spreadPct > 0
      ).length;
      const overpricedCount = listedCards.filter(
        (c) => c.spreadPct < 0
      ).length;
      // Calculate avg spread excluding extreme outliers (>200% deviation)
      const normalCards = listedCards.filter(
        (c) => Math.abs(c.spreadPct) <= 200
      );
      const avgSpread =
        normalCards.length > 0
          ? Math.round(
              (normalCards.reduce((sum, c) => sum + c.spreadPct, 0) /
                normalCards.length) *
                10
            ) / 10
          : 0;

      res.json({
        cards: paged,
        pagination: {
          total: filtered.length,
          limit: lim,
          offset: off,
          hasMore: off + lim < filtered.length,
        },
        stats: {
          totalCards: allCards.length,
          listedCards: listedCards.length,
          arbitrageCount,
          overpricedCount,
          avgSpread,
        },
      });
    } catch (err) {
      console.error("[API] Error:", err);
      res.status(500).json({ error: "Failed to fetch cards" });
    }
  });

  // Get all cards (for client-side processing)
  app.get("/api/cards/all", async (_req, res) => {
    try {
      const allCards = await getCards();
      res.json({ cards: allCards, total: allCards.length });
    } catch (err) {
      console.error("[API] Error:", err);
      res.status(500).json({ error: "Failed to fetch cards" });
    }
  });

  // ─── Price History API ───

  // Get price history for a specific card
  app.get("/api/cards/:cardId/history", (req, res) => {
    try {
      const { cardId } = req.params;
      const { days = "30" } = req.query as Record<string, string>;
      const daysNum = Math.min(parseInt(days) || 30, MAX_HISTORY_DAYS);
      const cutoff = new Date(
        Date.now() - daysNum * 24 * 60 * 60 * 1000
      ).toISOString();

      const history = (priceHistory[cardId] || []).filter(
        (s) => s.timestamp >= cutoff
      );

      res.json({
        cardId,
        days: daysNum,
        dataPoints: history.length,
        history,
      });
    } catch (err) {
      console.error("[API] History error:", err);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // Get price history for multiple cards (batch)
  app.post("/api/cards/history/batch", (req, res) => {
    try {
      const { cardIds, days = 30 } = req.body as {
        cardIds: string[];
        days?: number;
      };
      if (!cardIds || !Array.isArray(cardIds)) {
        return res.status(400).json({ error: "cardIds array required" });
      }

      const daysNum = Math.min(days || 30, MAX_HISTORY_DAYS);
      const cutoff = new Date(
        Date.now() - daysNum * 24 * 60 * 60 * 1000
      ).toISOString();

      const result: Record<string, PriceSnapshot[]> = {};
      for (const id of cardIds.slice(0, 50)) {
        // Max 50 cards per batch
        result[id] = (priceHistory[id] || []).filter(
          (s) => s.timestamp >= cutoff
        );
      }

      res.json({
        days: daysNum,
        cards: result,
      });
    } catch (err) {
      console.error("[API] Batch history error:", err);
      res.status(500).json({ error: "Failed to fetch batch history" });
    }
  });

  // Get history stats (how many cards tracked, total data points)
  app.get("/api/history/stats", (_req, res) => {
    const cardCount = Object.keys(priceHistory).length;
    let totalPoints = 0;
    let oldestTimestamp = "";
    let newestTimestamp = "";

    for (const snapshots of Object.values(priceHistory)) {
      totalPoints += snapshots.length;
      for (const s of snapshots) {
        if (!oldestTimestamp || s.timestamp < oldestTimestamp)
          oldestTimestamp = s.timestamp;
        if (!newestTimestamp || s.timestamp > newestTimestamp)
          newestTimestamp = s.timestamp;
      }
    }

    res.json({
      trackedCards: cardCount,
      totalDataPoints: totalPoints,
      oldestRecord: oldestTimestamp || null,
      newestRecord: newestTimestamp || null,
      maxHistoryDays: MAX_HISTORY_DAYS,
      snapshotIntervalMinutes: HISTORY_SNAPSHOT_INTERVAL / 60000,
    });
  });

  // Force refresh
  app.post("/api/cards/refresh", async (_req, res) => {
    try {
      lastFetchTime = 0;
      const cards = await getCards();
      res.json({ success: true, count: cards.length });
    } catch (err) {
      console.error("[API] Error:", err);
      res.status(500).json({ error: "Failed to refresh" });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3001;

  // Pre-fetch cards on startup (also records first snapshot)
  console.log("[Server] Pre-fetching card data...");
  getCards().then((cards) => {
    console.log(`[Server] Pre-fetched ${cards.length} cards`);
  });

  // Periodic history snapshots (every 30 min)
  setInterval(() => {
    if (cachedCards.length > 0) {
      recordPriceSnapshot(cachedCards);
    }
  }, HISTORY_SNAPSHOT_INTERVAL);

  server.listen(port, () => {
    console.log(`[Server] Running on http://localhost:${port}/`);
    console.log(`[Server] Price history: ${HISTORY_FILE}`);
  });
}

startServer().catch(console.error);
