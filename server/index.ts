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
let fetchInProgress = false; // Prevent concurrent fetches
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5;

function parsePrice(raw: string | number): number {
  if (!raw || raw === "NO-OFFER-PRICE") return 0;
  const str = String(raw);
  try {
    // Handling scientific notation if any
    if (str.includes('e')) {
        return Number(str) / 1e18;
    }
    const val = BigInt(str);
    if (val === 0n) return 0;
    
    // Renaiss uses 18 decimals for USDT prices.
    // E.g., 40800000000000000000 = 40.8 USDT
    return Number(val / BigInt(1e14)) / 10000; 
  } catch {
    return 0;
  }
}

function parseFmv(raw: number | string): number {
  if (!raw) return 0;
  // FMV in Renaiss API is in USD. 
  // Observed: 4300 means $43.00.
  const num = typeof raw === "string" ? parseFloat(raw) : raw;
  return num / 100;
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

// ─── Robust fetch with retry and timeout ───
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, timeout = 15000): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }
      return resp;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        const delay = 1000 * Math.pow(2, attempt) + Math.random() * 500;
        console.warn(`[API] Fetch attempt ${attempt + 1} failed: ${lastError.message}, retrying in ${Math.round(delay)}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError || new Error("Fetch failed after retries");
}

async function fetchAllFromRenaiss(): Promise<ParsedCard[]> {
  const allCards: ParsedCard[] = [];
  const seenIds = new Set<string>();
  let offset = 0;
  const limit = 50; 
  let total = 0;
  let hasMore = true;
  let consecutivePageErrors = 0;
  const MAX_PAGE_ERRORS = 3;

  console.log("[API] Starting fetch from Renaiss marketplace...");

  while (hasMore) {
    try {
      const input = buildTrpcInput(offset, limit);
      const url = `${RENAISS_API}?batch=1&input=${encodeURIComponent(input)}`;

      const resp = await fetchWithRetry(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "*/*",
          Referer: "https://www.renaiss.xyz/marketplace",
        },
      }, 2, 20000);

      const data = await resp.json();
      const result = data[0]?.result?.data?.json;
      if (!result) {
        console.warn(`[API] No result data at offset ${offset}, stopping.`);
        break;
      }

      const collection = result.collection || [];
      const pagination = result.pagination || {};

      if (offset === 0) {
        total = pagination.total || 0;
        console.log(`[API] Total cards reported by Renaiss: ${total}`);
      }

      for (const raw of collection) {
        try {
          const card = parseCard(raw);
          if (!seenIds.has(card.id)) {
            seenIds.add(card.id);
            allCards.push(card);
          }
        } catch (parseErr) {
          console.warn(`[API] Failed to parse card at offset ${offset}:`, parseErr);
        }
      }

      hasMore = pagination.hasMore === true && collection.length > 0 && allCards.length < 10000; 
      offset += limit;
      consecutivePageErrors = 0; 

      if (offset % 500 === 0 || !hasMore) {
        console.log(`[API] Progress: ${allCards.length}/${total || 'unknown'} cards fetched`);
      }

      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      consecutivePageErrors++;
      console.error(`[API] Error at offset ${offset} (${consecutivePageErrors}/${MAX_PAGE_ERRORS}):`, err);
      if (consecutivePageErrors >= MAX_PAGE_ERRORS) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`[API] Fetch complete. Total unique cards: ${allCards.length}`);
  return allCards;
}

async function getCards(): Promise<ParsedCard[]> {
  if (fetchInProgress) {
    while (fetchInProgress) {
      await new Promise((r) => setTimeout(r, 500));
    }
    return cachedCards;
  }

  const now = Date.now();
  if (cachedCards.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return cachedCards;
  }

  fetchInProgress = true;
  try {
    const cards = await fetchAllFromRenaiss();
    if (cards.length > 0) {
      cachedCards = cards;
      lastFetchTime = Date.now();
      consecutiveFailures = 0;
      recordPriceSnapshot(cards);
    } else if (cachedCards.length === 0) {
        throw new Error("Fetched 0 cards from Renaiss");
    }
    return cachedCards;
  } catch (err) {
    consecutiveFailures++;
    console.error(`[API] Global fetch error (${consecutiveFailures}):`, err);
    if (cachedCards.length > 0) {
      console.log("[API] Returning stale cache due to fetch error");
      return cachedCards;
    }
    throw err;
  } finally {
    fetchInProgress = false;
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  loadPriceHistory();

  app.get("/api/cards", async (req, res) => {
    try {
      const {
        offset = "0",
        limit = "50",
        sortBy = "spreadPct",
        sortOrder = "desc",
        search = "",
        category = "",
        listedOnly = "false",
      } = req.query as Record<string, string>;

      const allCards = await getCards();
      
      let filtered = allCards;

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.setName.toLowerCase().includes(q) ||
            c.tokenId.includes(q)
        );
      }

      if (category && category !== "all") {
        filtered = filtered.filter((c) => c.setName === category);
      }

      if (listedOnly === "true") {
        filtered = filtered.filter((c) => c.price > 0);
      }

      const sortFn = (a: any, b: any) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        const modifier = sortOrder === "desc" ? -1 : 1;

        if (typeof valA === "string") {
          return valA.localeCompare(valB) * modifier;
        }
        return (valA - valB) * modifier;
      };
      filtered.sort(sortFn);

      const off = parseInt(offset) || 0;
      const lim = Math.min(parseInt(limit) || 50, 10000);
      const paged = filtered.slice(off, off + lim);

      const listedCards = allCards.filter((c) => c.price > 0);
      const arbitrageCount = listedCards.filter(
        (c) => c.spreadPct > 0
      ).length;
      const overpricedCount = listedCards.filter(
        (c) => c.spreadPct < 0
      ).length;
      
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
        meta: {
          cacheAge: lastFetchTime ? Date.now() - lastFetchTime : null,
          isStale: lastFetchTime ? Date.now() - lastFetchTime > CACHE_TTL : true,
        },
      });
    } catch (err) {
      console.error("[API] Error:", err);
      res.json({
        cards: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
        stats: { totalCards: 0, listedCards: 0, arbitrageCount: 0, overpricedCount: 0, avgSpread: 0 },
        meta: { error: "Failed to fetch cards, will retry automatically" },
      });
    }
  });

  app.get("/api/cards/all", async (_req, res) => {
    try {
      const allCards = await getCards();
      res.json({ cards: allCards, total: allCards.length });
    } catch (err) {
      console.error("[API] Error:", err);
      res.json({ cards: [], total: 0, meta: { error: "Failed to fetch cards" } });
    }
  });

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
      res.json({ cardId: req.params.cardId, days: 30, dataPoints: 0, history: [] });
    }
  });

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
      res.json({ days: 30, cards: {} });
    }
  });

  app.get("/api/history/stats", (_req, res) => {
    try {
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
    } catch (err) {
      console.error("[API] Stats error:", err);
      res.json({ trackedCards: 0, totalDataPoints: 0, oldestRecord: null, newestRecord: null, maxHistoryDays: 30, snapshotIntervalMinutes: 30 });
    }
  });

  app.post("/api/cards/refresh", async (_req, res) => {
    try {
      lastFetchTime = 0;
      const cards = await getCards();
      res.json({ success: true, count: cards.length });
    } catch (err) {
      console.error("[API] Error:", err);
      res.json({ success: false, count: cachedCards.length, error: "Refresh failed, using cached data" });
    }
  });

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3001;

  console.log("[Server] Pre-fetching card data...");
  getCards().then((cards) => {
    console.log(`[Server] Pre-fetched ${cards.length} cards`);
  }).catch(err => {
    console.error("[Server] Pre-fetch failed:", err);
  });

  setInterval(() => {
    if (cachedCards.length > 0) {
      recordPriceSnapshot(cachedCards);
    }
  }, HISTORY_SNAPSHOT_INTERVAL);

  setInterval(async () => {
    if (!fetchInProgress && cachedCards.length > 0) {
      const age = Date.now() - lastFetchTime;
      if (age > CACHE_TTL * 0.8) {
        console.log("[Server] Background cache refresh...");
        try {
          await getCards();
        } catch (err) {
          console.error("[Server] Background refresh failed:", err);
        }
      }
    }
  }, 3 * 60 * 1000);

  server.listen(port, () => {
    console.log(`[Server] Running on http://localhost:${port}/`);
    console.log(`[Server] Price history: ${HISTORY_FILE}`);
  });
}

startServer().catch(console.error);
