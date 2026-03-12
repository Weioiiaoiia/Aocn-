/**
 * Vercel Serverless Function: /api/cards
 * Fetches card data from Renaiss tRPC API and returns parsed results
 * Supports pagination, sorting, filtering, and search
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const RENAISS_API = "https://www.renaiss.xyz/api/trpc/collectible.list";

interface RawCard {
  id: string;
  tokenId: string;
  itemId: string;
  name: string;
  setName: string;
  ownerAddress: string;
  askPriceInUSDT: string;
  fmvPriceInUSD: number | string;
  offerPriceInUSDT: string;
  frontImageUrl: string;
  attributes: { trait: string; value: string }[];
  owner: { id: string; username: string } | null;
  vaultLocation: string;
  grade: string;
  gradingCompany: string;
  year: number;
  buybackBaseValueInUSD: number | string;
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

// ─── Global in-memory cache (persists across warm invocations) ───
let cachedCards: ParsedCard[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function parsePrice(raw: string | number): number {
  if (!raw || raw === "NO-OFFER-PRICE") return 0;
  const str = String(raw);
  try {
    if (str.includes('e')) {
      return Number(str) / 1e18;
    }
    const val = BigInt(str);
    if (val === 0n) return 0;
    return Number(val / BigInt(1e14)) / 10000;
  } catch {
    return 0;
  }
}

function parseFmv(raw: number | string): number {
  if (!raw) return 0;
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

  const spread = fmv > 0 && price > 0 ? Math.round((fmv - price) * 100) / 100 : 0;
  const spreadPct = fmv > 0 && price > 0 ? Math.round(((fmv - price) / fmv) * 1000) / 10 : 0;

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

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 20000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchAllFromRenaiss(): Promise<ParsedCard[]> {
  const allCards: ParsedCard[] = [];
  const seenIds = new Set<string>();
  let offset = 0;
  const limit = 50;
  let hasMore = true;
  let consecutivePageErrors = 0;
  const MAX_PAGE_ERRORS = 3;

  while (hasMore) {
    try {
      const input = buildTrpcInput(offset, limit);
      const url = `${RENAISS_API}?batch=1&input=${encodeURIComponent(input)}`;

      const resp = await fetchWithTimeout(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "*/*",
          Referer: "https://www.renaiss.xyz/marketplace",
        },
      }, 20000);

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }

      const data = await resp.json();
      const result = data[0]?.result?.data?.json;
      if (!result) {
        break;
      }

      const collection = result.collection || [];
      const pagination = result.pagination || {};

      for (const raw of collection) {
        try {
          const card = parseCard(raw);
          if (!seenIds.has(card.id)) {
            seenIds.add(card.id);
            allCards.push(card);
          }
        } catch (parseErr) {
          // Skip unparseable cards
        }
      }

      hasMore = pagination.hasMore === true && collection.length > 0 && allCards.length < 10000;
      offset += limit;
      consecutivePageErrors = 0;

      // Small delay to be nice to the API
      await new Promise((r) => setTimeout(r, 80));
    } catch (err) {
      consecutivePageErrors++;
      if (consecutivePageErrors >= MAX_PAGE_ERRORS) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return allCards;
}

async function getCards(): Promise<ParsedCard[]> {
  const now = Date.now();
  if (cachedCards.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return cachedCards;
  }

  try {
    const cards = await fetchAllFromRenaiss();
    if (cards.length > 0) {
      cachedCards = cards;
      lastFetchTime = Date.now();
    }
    return cachedCards;
  } catch (err) {
    if (cachedCards.length > 0) {
      return cachedCards;
    }
    throw err;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    let filtered = [...allCards];

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
    const arbitrageCount = listedCards.filter((c) => c.spreadPct > 0).length;
    const overpricedCount = listedCards.filter((c) => c.spreadPct < 0).length;

    const normalCards = listedCards.filter((c) => Math.abs(c.spreadPct) <= 200);
    const avgSpread =
      normalCards.length > 0
        ? Math.round(
            (normalCards.reduce((sum, c) => sum + c.spreadPct, 0) / normalCards.length) * 10
          ) / 10
        : 0;

    // Cache response for 2 minutes at CDN level
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');

    return res.status(200).json({
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
    return res.status(200).json({
      cards: [],
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
      stats: { totalCards: 0, listedCards: 0, arbitrageCount: 0, overpricedCount: 0, avgSpread: 0 },
      meta: { error: "Failed to fetch cards, will retry automatically" },
    });
  }
}
