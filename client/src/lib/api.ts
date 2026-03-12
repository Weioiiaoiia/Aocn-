/**
 * AOCN API Service
 * Fetches card data from our server proxy which calls Renaiss tRPC API
 * Includes price history endpoints for real historical data
 */
import type { Card } from './data';

const API_BASE = '/api';

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

export async function fetchCards(params: FetchCardsParams = {}): Promise<FetchCardsResponse> {
  const searchParams = new URLSearchParams();
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  if (params.search) searchParams.set('search', params.search);
  if (params.category) searchParams.set('category', params.category);
  if (params.listedOnly) searchParams.set('listedOnly', 'true');

  const resp = await fetch(`${API_BASE}/cards?${searchParams.toString()}`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

export async function fetchAllCards(): Promise<Card[]> {
  const resp = await fetch(`${API_BASE}/cards/all`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  const data = await resp.json();
  return data.cards;
}

export async function refreshCards(): Promise<{ success: boolean; count: number }> {
  const resp = await fetch(`${API_BASE}/cards/refresh`, { method: 'POST' });
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

// ─── Price History APIs ───

export async function fetchCardHistory(cardId: string, days: number = 30): Promise<CardHistoryResponse> {
  const resp = await fetch(`${API_BASE}/cards/${cardId}/history?days=${days}`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

export async function fetchBatchHistory(cardIds: string[], days: number = 30): Promise<BatchHistoryResponse> {
  const resp = await fetch(`${API_BASE}/cards/history/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardIds, days }),
  });
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

export async function fetchHistoryStats(): Promise<HistoryStatsResponse> {
  const resp = await fetch(`${API_BASE}/history/stats`);
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}
