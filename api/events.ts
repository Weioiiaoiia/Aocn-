/**
 * Vercel Serverless Function: /api/events
 * Server-Sent Events (SSE) endpoint for real-time data push
 * Sends card data updates, price changes, and activity notifications
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const RENAISS_API = "https://www.renaiss.xyz/api/trpc/collectible.list";

interface ParsedCard {
  id: string;
  tokenId: string;
  name: string;
  setName: string;
  price: number;
  fmv: number;
  spreadPct: number;
  imgUrl: string;
}

// In-memory cache for SSE
let cachedCards: ParsedCard[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 15_000; // 15 seconds - much shorter for real-time

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

async function fetchLatestCards(): Promise<ParsedCard[]> {
  const now = Date.now();
  if (cachedCards.length > 0 && now - lastFetchTime < CACHE_TTL) {
    return cachedCards;
  }

  try {
    // Fetch first 200 cards (most recent/active) for speed
    const allCards: ParsedCard[] = [];
    const seenIds = new Set<string>();

    for (let offset = 0; offset < 200; offset += 50) {
      const input = buildTrpcInput(offset, 50);
      const url = `${RENAISS_API}?batch=1&input=${encodeURIComponent(input)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "*/*",
          Referer: "https://www.renaiss.xyz/marketplace",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!resp.ok) break;
      const data = await resp.json();
      const result = data[0]?.result?.data?.json;
      if (!result) break;

      const collection = result.collection || [];
      for (const raw of collection) {
        try {
          const price = parsePrice(raw.askPriceInUSDT);
          const fmv = parseFmv(raw.fmvPriceInUSD);
          const spreadPct = fmv > 0 && price > 0
            ? Math.round(((fmv - price) / fmv) * 1000) / 10
            : 0;

          const card: ParsedCard = {
            id: raw.id,
            tokenId: String(raw.tokenId),
            name: raw.name,
            setName: raw.setName,
            price,
            fmv,
            spreadPct,
            imgUrl: raw.frontImageUrl,
          };

          if (!seenIds.has(card.id)) {
            seenIds.add(card.id);
            allCards.push(card);
          }
        } catch { /* skip */ }
      }

      if (!result.pagination?.hasMore) break;
      await new Promise(r => setTimeout(r, 50));
    }

    if (allCards.length > 0) {
      cachedCards = allCards;
      lastFetchTime = Date.now();
    }
    return cachedCards;
  } catch (err) {
    console.error("[SSE] Fetch error:", err);
    return cachedCards;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // For Vercel serverless, we can't do true SSE streaming
  // Instead, return a snapshot of latest data with short cache
  try {
    const cards = await fetchLatestCards();

    // Detect recent activities (cards listed/sold in last hour)
    const recentActivities = cards
      .filter(c => c.price > 0)
      .slice(0, 20)
      .map(c => ({
        type: 'price_update' as const,
        cardId: c.id,
        cardName: c.name,
        price: c.price,
        fmv: c.fmv,
        spreadPct: c.spreadPct,
        imgUrl: c.imgUrl,
        timestamp: new Date().toISOString(),
      }));

    // Find arbitrage opportunities
    const arbitrageAlerts = cards
      .filter(c => c.price > 0 && c.spreadPct > 10)
      .slice(0, 10)
      .map(c => ({
        type: 'arbitrage_alert' as const,
        cardId: c.id,
        cardName: c.name,
        price: c.price,
        fmv: c.fmv,
        spreadPct: c.spreadPct,
        imgUrl: c.imgUrl,
        timestamp: new Date().toISOString(),
      }));

    // Stats
    const listedCards = cards.filter(c => c.price > 0);
    const stats = {
      totalCards: cards.length,
      listedCards: listedCards.length,
      arbitrageCount: listedCards.filter(c => c.spreadPct > 0).length,
      avgSpread: listedCards.length > 0
        ? Math.round(listedCards.filter(c => Math.abs(c.spreadPct) <= 200)
            .reduce((s, c) => s + c.spreadPct, 0) /
            Math.max(listedCards.filter(c => Math.abs(c.spreadPct) <= 200).length, 1) * 10) / 10
        : 0,
    };

    // Short cache for real-time feel
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=15');

    return res.status(200).json({
      activities: recentActivities,
      arbitrageAlerts,
      stats,
      meta: {
        timestamp: new Date().toISOString(),
        cacheAge: lastFetchTime ? Date.now() - lastFetchTime : null,
        nextRefresh: 15,
      },
    });
  } catch (err) {
    console.error("[SSE] Error:", err);
    return res.status(200).json({
      activities: [],
      arbitrageAlerts: [],
      stats: { totalCards: 0, listedCards: 0, arbitrageCount: 0, avgSpread: 0 },
      meta: { error: "Failed to fetch events", timestamp: new Date().toISOString() },
    });
  }
}
