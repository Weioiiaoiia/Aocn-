/**
 * Vercel Serverless Function: /api/cards
 * Fetches card data from Renaiss tRPC API and returns parsed results
 * Supports pagination, sorting, filtering, and search
 * 
 * OPTIMIZED: Cache TTL reduced to 15s for real-time monitoring
 * Uses stale-while-revalidate pattern for instant responses
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
const CACHE_TTL = 15_000; // 15 seconds for real-time monitoring
let fetchInProgress = false;

function parsePrice(raw: string | number): number {
  if (!raw || raw === "NO-OFFER-PRICE") return 0;
  const str = String(raw);
  try {
    if (str.includes('e')) return Number(str) / 1e18;
    const val = BigInt(str);
    if (val === 0n) return 0;
    return Number(val / BigInt(1e14)) / 10000;
  } catch { return 0; }
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
        limit, offset,
        search: null, sortBy: "listDate", sortOrder: "desc",
        categoryFilter: null, listedOnly: null,
        characterFilter: "", languageFilter: "",
        gradingCompanyFilter: "", gradeFilter: "",
        yearRange: "", priceRangeFilter: "",
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

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 12000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Parallel batch fetching for speed
async function fetchBatch(offset: number, limit: number): Promise<RawCard[]> {
  const input = buildTrpcInput(offset, limit);
  const url = `${RENAISS_API}?batch=1&input=${encodeURIComponent(input)}`;

  const resp = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
      Referer: "https://www.renaiss.xyz/marketplace",
    },
  }, 12000);

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  const result = data[0]?.result?.data?.json;
  if (!result) return [];
  return { collection: result.collection || [], pagination: result.pagination || {} } as any;
}

async function fetchAllFromRenaiss(): Promise<ParsedCard[]> {
  const allCards: ParsedCard[] = [];
  const seenIds = new Set<string>();
  let offset = 0;
  const limit = 50;
  let hasMore = true;
  let consecutivePageErrors = 0;

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
      }, 12000);

      if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      const data = await resp.json();
      const result = data[0]?.result?.data?.json;
      if (!result) break;

      const collection = result.collection || [];
      const pagination = result.pagination || {};

      for (const raw of collection) {
        try {
          const card = parseCard(raw);
          if (!seenIds.has(card.id)) {
            seenIds.add(card.id);
            allCards.push(card);
          }
        } catch { /* skip */ }
      }

      hasMore = pagination.hasMore === true && collection.length > 0 && allCards.length < 10000;
      offset += limit;
      consecutivePageErrors = 0;
      await new Promise((r) => setTimeout(r, 50)); // Reduced delay for speed
    } catch (err) {
      consecutivePageErrors++;
      if (consecutivePageErrors >= 3) break;
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return allCards;
}

async function getCards(): Promise<ParsedCard[]> {
  const now = Date.now();

  // Return cache if fresh
  if (cachedCards.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return cachedCards;
  }

  // Prevent concurrent fetches - return stale cache while refreshing
  if (fetchInProgress) {
    return cachedCards;
  }

  fetchInProgress = true;
  try {
    const cards = await fetchAllFromRenaiss();
    if (cards.length > 0) {
      cachedCards = cards;
      lastFetchTime = Date.now();
    }
    return cachedCards;
  } catch (err) {
    if (cachedCards.length > 0) return cachedCards;
    throw err;
  } finally {
    fetchInProgress = false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      // Advanced filters
      gradingCompany = "",
      gradeFilter = "",
      languageFilter = "",
      yearMin = "",
      yearMax = "",
      priceMin = "",
      priceMax = "",
    } = req.query as Record<string, string>;

    const allCards = await getCards();
    let filtered = [...allCards];

    // Text search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.setName.toLowerCase().includes(q) ||
          c.tokenId.includes(q)
      );
    }

    // Category filter
    if (category && category !== "all") {
      filtered = filtered.filter((c) => c.setName === category);
    }

    // Listed only
    if (listedOnly === "true") {
      filtered = filtered.filter((c) => c.price > 0);
    }

    // Advanced filters
    if (gradingCompany) {
      filtered = filtered.filter((c) => c.gradingCompany === gradingCompany);
    }
    if (gradeFilter) {
      filtered = filtered.filter((c) => c.grade === gradeFilter);
    }
    if (languageFilter) {
      filtered = filtered.filter((c) => c.language === languageFilter);
    }
    if (yearMin) {
      const min = parseInt(yearMin);
      if (!isNaN(min)) filtered = filtered.filter((c) => c.year >= min);
    }
    if (yearMax) {
      const max = parseInt(yearMax);
      if (!isNaN(max)) filtered = filtered.filter((c) => c.year <= max);
    }
    if (priceMin) {
      const min = parseFloat(priceMin);
      if (!isNaN(min)) filtered = filtered.filter((c) => c.price >= min);
    }
    if (priceMax) {
      const max = parseFloat(priceMax);
      if (!isNaN(max)) filtered = filtered.filter((c) => c.price <= max);
    }

    // Sort
    const sortFn = (a: any, b: any) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      const modifier = sortOrder === "desc" ? -1 : 1;
      if (typeof valA === "string") return valA.localeCompare(valB) * modifier;
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

    // Collect unique values for filter dropdowns
    const categories = [...new Set(allCards.map(c => c.setName).filter(Boolean))].sort();
    const gradingCompanies = [...new Set(allCards.map(c => c.gradingCompany).filter(Boolean))].sort();
    const grades = [...new Set(allCards.map(c => c.grade).filter(Boolean))].sort();
    const languages = [...new Set(allCards.map(c => c.language).filter(Boolean))].sort();

    // Short cache for real-time: 10s CDN cache, 15s stale-while-revalidate
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=15');

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
      filters: {
        categories,
        gradingCompanies,
        grades,
        languages,
      },
      meta: {
        cacheAge: lastFetchTime ? Date.now() - lastFetchTime : null,
        isStale: lastFetchTime ? Date.now() - lastFetchTime > CACHE_TTL : true,
        cacheTTL: CACHE_TTL,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[API] Error:", err);
    return res.status(200).json({
      cards: [],
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
      stats: { totalCards: 0, listedCards: 0, arbitrageCount: 0, overpricedCount: 0, avgSpread: 0 },
      filters: { categories: [], gradingCompanies: [], grades: [], languages: [] },
      meta: { error: "Failed to fetch cards, will retry automatically", timestamp: new Date().toISOString() },
    });
  }
}
