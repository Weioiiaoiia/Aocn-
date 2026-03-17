/**
 * Vercel Serverless Function: /api/stream
 * Server-Sent Events (SSE) streaming endpoint
 * Provides real-time data push via SSE protocol
 * Note: Vercel Edge functions have 30s limit, so we send data and close
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const RENAISS_API = "https://www.renaiss.xyz/api/trpc/collectible.list";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Fetch latest 50 cards quickly
    const input = buildTrpcInput(0, 50);
    const url = `${RENAISS_API}?batch=1&input=${encodeURIComponent(input)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "*/*",
        Referer: "https://www.renaiss.xyz/marketplace",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to fetch' })}\n\n`);
      return res.end();
    }

    const data = await resp.json();
    const result = data[0]?.result?.data?.json;

    if (!result) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'No data' })}\n\n`);
      return res.end();
    }

    const collection = result.collection || [];
    const cards = collection.map((raw: any) => {
      const price = parsePrice(raw.askPriceInUSDT);
      const fmv = parseFmv(raw.fmvPriceInUSD);
      const spreadPct = fmv > 0 && price > 0
        ? Math.round(((fmv - price) / fmv) * 1000) / 10
        : 0;
      return {
        id: raw.id,
        tokenId: String(raw.tokenId),
        name: raw.name,
        setName: raw.setName,
        price,
        fmv,
        spreadPct,
        imgUrl: raw.frontImageUrl,
      };
    });

    // Send initial data event
    res.write(`data: ${JSON.stringify({
      type: 'snapshot',
      cards: cards.slice(0, 20),
      stats: {
        totalCards: result.pagination?.total || cards.length,
        listedCards: cards.filter((c: any) => c.price > 0).length,
      },
      timestamp: new Date().toISOString(),
    })}\n\n`);

    // Send arbitrage alerts
    const arbitrage = cards.filter((c: any) => c.price > 0 && c.spreadPct > 5);
    if (arbitrage.length > 0) {
      res.write(`data: ${JSON.stringify({
        type: 'arbitrage',
        cards: arbitrage.slice(0, 10),
        timestamp: new Date().toISOString(),
      })}\n\n`);
    }

    // Send heartbeat
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);

  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`);
  }

  return res.end();
}
