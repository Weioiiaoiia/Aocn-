/**
 * AOCN API Service
 * Fetches card data from our server proxy which calls Renaiss tRPC API
 * Includes price history endpoints for real historical data
 * Enhanced with retry logic, timeout control, and error recovery
 */
import type { Card } from './data';

const API_BASE = '/api';
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1s, doubles each retry
const FETCH_TIMEOUT = 30000; // 30 seconds timeout

export interface FetchCardsParams {
  offset?: number;
  limit?: number;
  sortBy?: 'listDate' | 'price' | 'fmv' | 'spread' | 'spreadPct';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  category?: string;
  listedOnly?: boolean;
}

export interface FetchCardsResponse {
  cards: Card[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats: {
    totalCards: number;
    listedCards: number;
    arbitrageCount: number;
    overpricedCount: number;
    avgSpread: number;
  };
}

export interface PriceSnapshot {
  timestamp: string;
  price: number;
  fmv: number;
  spreadPct: number;
}

export interface CardHistoryResponse {
  cardId: string;
  days: number;
  dataPoints: number;
  history: PriceSnapshot[];
}

export interface BatchHistoryResponse {
  days: number;
  cards: Record<string, PriceSnapshot[]>;
}

export interface HistoryStatsResponse {
  trackedCards: number;
  totalDataPoints: number;
  oldestRecord: string | null;
  newestRecord: string | null;
  maxHistoryDays: number;
  snapshotIntervalMinutes: number;
}

// ─── Robust fetch with timeout and retry ───
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  context = 'API'
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.warn(`[${context}] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, lastError.message);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError || new Error(`${context} failed after ${retries + 1} attempts`);
}

// ─── Local cache for resilience ───
let cachedCardsResponse: FetchCardsResponse | null = null;
let cachedAllCards: Card[] | null = null;

export async function fetchCards(params: FetchCardsParams = {}): Promise<FetchCardsResponse> {
  return fetchWithRetry(async () => {
    const searchParams = new URLSearchParams();
    if (params.offset !== undefined) searchParams.set('offset', String(params.offset));
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.search) searchParams.set('search', params.search);
    if (params.category) searchParams.set('category', params.category);
    if (params.listedOnly) searchParams.set('listedOnly', 'true');

    const resp = await fetchWithTimeout(`${API_BASE}/cards?${searchParams.toString()}`);
    if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.statusText}`);
    const data = await resp.json();
    // Cache successful response
    cachedCardsResponse = data;
    return data;
  }, MAX_RETRIES, 'fetchCards').catch(err => {
    // Return cached data if available on total failure
    if (cachedCardsResponse) {
      console.warn('[fetchCards] Using cached data after all retries failed');
      return cachedCardsResponse;
    }
    throw err;
  });
}

export async function fetchAllCards(): Promise<Card[]> {
  return fetchWithRetry(async () => {
    const resp = await fetchWithTimeout(`${API_BASE}/cards/all`);
    if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.statusText}`);
    const data = await resp.json();
    cachedAllCards = data.cards;
    return data.cards;
  }, MAX_RETRIES, 'fetchAllCards').catch(err => {
    if (cachedAllCards) {
      console.warn('[fetchAllCards] Using cached data after all retries failed');
      return cachedAllCards;
    }
    throw err;
  });
}

export async function refreshCards(): Promise<{ success: boolean; count: number }> {
  return fetchWithRetry(async () => {
    const resp = await fetchWithTimeout(`${API_BASE}/cards/refresh`, { method: 'POST' }, 60000); // 60s timeout for refresh
    if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }, MAX_RETRIES, 'refreshCards');
}

// ─── Price History APIs ───

export async function fetchCardHistory(cardId: string, days: number = 30): Promise<CardHistoryResponse> {
  return fetchWithRetry(async () => {
    const resp = await fetchWithTimeout(`${API_BASE}/cards/${encodeURIComponent(cardId)}/history?days=${days}`);
    if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }, 2, 'fetchCardHistory'); // Only 2 retries for history (less critical)
}

export async function fetchBatchHistory(cardIds: string[], days: number = 30): Promise<BatchHistoryResponse> {
  return fetchWithRetry(async () => {
    const resp = await fetchWithTimeout(`${API_BASE}/cards/history/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardIds, days }),
    });
    if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }, 2, 'fetchBatchHistory');
}

export async function fetchHistoryStats(): Promise<HistoryStatsResponse> {
  return fetchWithRetry(async () => {
    const resp = await fetchWithTimeout(`${API_BASE}/history/stats`);
    if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }, 2, 'fetchHistoryStats');
}
