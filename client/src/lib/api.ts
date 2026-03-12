/**
 * AOCN API Service
 * Fetches card data from our server proxy which calls Renaiss tRPC API
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
