/**
 * AOCN API Service
 * Fetches card data from our server proxy which calls Renaiss tRPC API
 * Includes price history endpoints for real historical data
 * Enhanced with SSE real-time push, retry logic, timeout control, and error recovery
 * 
 * OPTIMIZED: 15s polling + SSE for real-time monitoring
 */
import type { Card } from './data';

const API_BASE = '/api';
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;
const FETCH_TIMEOUT = 30000;
const POLLING_INTERVAL = 15_000; // 15 seconds

export interface FetchCardsParams {
  offset?: number;
  limit?: number;
  sortBy?: 'listDate' | 'price' | 'fmv' | 'spread' | 'spreadPct';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  category?: string;
  listedOnly?: boolean;
  // Advanced filters
  gradingCompany?: string;
  gradeFilter?: string;
  languageFilter?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
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
  filters?: {
    categories: string[];
    gradingCompanies: string[];
    grades: string[];
    languages: string[];
  };
  meta?: {
    cacheAge: number | null;
    isStale: boolean;
    cacheTTL: number;
    timestamp: string;
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

// ─── SSE / Real-time Event Types ───
export interface RealTimeEvent {
  type: 'price_update' | 'arbitrage_alert' | 'sbt_update' | 'activity';
  cardId?: string;
  cardName?: string;
  price?: number;
  fmv?: number;
  spreadPct?: number;
  imgUrl?: string;
  message?: string;
  timestamp: string;
}

export interface EventsResponse {
  activities: RealTimeEvent[];
  arbitrageAlerts: RealTimeEvent[];
  stats: {
    totalCards: number;
    listedCards: number;
    arbitrageCount: number;
    avgSpread: number;
  };
  meta: {
    timestamp: string;
    cacheAge: number | null;
    nextRefresh: number;
  };
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
    // Advanced filters
    if (params.gradingCompany) searchParams.set('gradingCompany', params.gradingCompany);
    if (params.gradeFilter) searchParams.set('gradeFilter', params.gradeFilter);
    if (params.languageFilter) searchParams.set('languageFilter', params.languageFilter);
    if (params.yearMin) searchParams.set('yearMin', String(params.yearMin));
    if (params.yearMax) searchParams.set('yearMax', String(params.yearMax));
    if (params.priceMin) searchParams.set('priceMin', String(params.priceMin));
    if (params.priceMax) searchParams.set('priceMax', String(params.priceMax));

    const resp = await fetchWithTimeout(`${API_BASE}/cards?${searchParams.toString()}`);
    if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.statusText}`);
    const data = await resp.json();
    cachedCardsResponse = data;
    return data;
  }, MAX_RETRIES, 'fetchCards').catch(err => {
    if (cachedCardsResponse) {
      console.warn('[fetchCards] Using cached data after all retries failed');
      return cachedCardsResponse;
    }
    throw err;
  });
}

export async function fetchAllCards(): Promise<Card[]> {
  return fetchWithRetry(async () => {
    const resp = await fetchWithTimeout(`${API_BASE}/cards?limit=10000&sortBy=spreadPct&sortOrder=desc`);
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
    const resp = await fetchWithTimeout(`${API_BASE}/refresh`, { method: 'POST' }, 60000);
    if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }, MAX_RETRIES, 'refreshCards');
}

// ─── Real-time Events API ───
export async function fetchEvents(): Promise<EventsResponse> {
  return fetchWithRetry(async () => {
    const resp = await fetchWithTimeout(`${API_BASE}/events`, {}, 15000);
    if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }, 2, 'fetchEvents');
}

// ─── SSE Stream Connection ───
export type SSECallback = (event: RealTimeEvent) => void;

export function connectSSE(onEvent: SSECallback, onError?: (err: Event) => void): EventSource | null {
  if (typeof EventSource === 'undefined') {
    console.warn('[SSE] EventSource not supported');
    return null;
  }

  try {
    const es = new EventSource(`${API_BASE}/stream`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'snapshot' && data.cards) {
          for (const card of data.cards) {
            onEvent({
              type: 'price_update',
              cardId: card.id,
              cardName: card.name,
              price: card.price,
              fmv: card.fmv,
              spreadPct: card.spreadPct,
              imgUrl: card.imgUrl,
              timestamp: data.timestamp,
            });
          }
        } else if (data.type === 'arbitrage' && data.cards) {
          for (const card of data.cards) {
            onEvent({
              type: 'arbitrage_alert',
              cardId: card.id,
              cardName: card.name,
              price: card.price,
              fmv: card.fmv,
              spreadPct: card.spreadPct,
              imgUrl: card.imgUrl,
              timestamp: data.timestamp,
            });
          }
        }
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    };

    es.onerror = (err) => {
      console.warn('[SSE] Connection error, will auto-reconnect');
      if (onError) onError(err);
    };

    return es;
  } catch (err) {
    console.error('[SSE] Failed to connect:', err);
    return null;
  }
}

// ─── Polling-based real-time updates ───
export type PollingCallback = (data: FetchCardsResponse) => void;

let pollingTimer: ReturnType<typeof setInterval> | null = null;

export function startPolling(callback: PollingCallback, interval = POLLING_INTERVAL): void {
  stopPolling();
  
  // Immediate first fetch
  fetchCards({ limit: 50, sortBy: 'listDate', sortOrder: 'desc' })
    .then(callback)
    .catch(err => console.error('[Polling] Initial fetch error:', err));

  pollingTimer = setInterval(async () => {
    try {
      const data = await fetchCards({ limit: 50, sortBy: 'listDate', sortOrder: 'desc' });
      callback(data);
    } catch (err) {
      console.error('[Polling] Error:', err);
    }
  }, interval);
}

export function stopPolling(): void {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

// ─── Price History APIs ───
export async function fetchCardHistory(cardId: string, days: number = 30): Promise<CardHistoryResponse> {
  return fetchWithRetry(async () => {
    const resp = await fetchWithTimeout(`${API_BASE}/cards/${encodeURIComponent(cardId)}/history?days=${days}`);
    if (!resp.ok) throw new Error(`API error: ${resp.status} ${resp.statusText}`);
    return resp.json();
  }, 2, 'fetchCardHistory');
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
