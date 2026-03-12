import express from "express";
import { createServer } from "http";
import path from "path";
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

  const spread = fmv > 0 && price > 0 ? Math.round((fmv - price) * 100) / 100 : 0;
  const spreadPct = fmv > 0 && price > 0 ? Math.round((fmv - price) / fmv * 1000) / 10 : 0;

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
      const arbitrageCount = listedCards.filter((c) => c.spreadPct > 0).length;
      const overpricedCount = listedCards.filter(
        (c) => c.spreadPct < 0
      ).length;
      // Calculate avg spread excluding extreme outliers (>200% deviation)
      const normalCards = listedCards.filter((c) => Math.abs(c.spreadPct) <= 200);
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

  // Pre-fetch cards on startup
  console.log("[Server] Pre-fetching card data...");
  getCards().then((cards) => {
    console.log(`[Server] Pre-fetched ${cards.length} cards`);
  });

  server.listen(port, () => {
    console.log(`[Server] Running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
