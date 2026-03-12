/*
 * AOCN Arbitrage — Full marketplace scanner with live data from Renaiss
 * Covers ALL cards in the Renaiss marketplace
 */
import { useLang } from '@/contexts/LanguageContext';
import { gachaPacks, type Card } from '@/lib/data';
import { fetchCards, refreshCards, type FetchCardsResponse } from '@/lib/api';
import {
  TrendingUp, TrendingDown, ExternalLink, Search, Filter,
  Package, ArrowUpDown, Share2, Sparkles, RefreshCw, X,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

type SortKey = 'spreadPct' | 'price' | 'fmv' | 'grade';
type SortDir = 'asc' | 'desc';
type FilterMode = 'all' | 'positive' | 'negative';

const PAGE_SIZE = 30;

function shareToTwitter(card: Card) {
  const text = encodeURIComponent(
    `Found a ${card.spreadPct > 0 ? '+' : ''}${card.spreadPct}% arbitrage opportunity on @renaissxyz!\n\n` +
    `${card.name}\nListed: $${card.price} | FMV: $${card.fmv}\n\n` +
    `Analyzed by @Aocn_renaiss #AOCN #Renaiss #TCG`
  );
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

function gradeToNum(grade: string): number {
  const m = grade.match(/\d+/);
  return m ? parseInt(m[0]) : 0;
}

function CardDetail({ card, onClose }: { card: Card; onClose: () => void }) {
  const { t } = useLang();
  const isPositive = card.spread > 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-background overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex flex-col md:flex-row">
          <div className="md:w-64 shrink-0 bg-secondary dark:bg-[#111118] p-6 flex items-center justify-center relative">
            <img src={card.imgUrl} alt={card.name} className="max-h-72 object-contain rounded-lg" loading="lazy" />
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 dark:bg-black/50 backdrop-blur-sm">
              <div className="live-dot" />
              <span className="text-[9px] text-muted-foreground">LIVE</span>
            </div>
          </div>
          <div className="flex-1 p-6">
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="mb-4">
              <span className="inline-block badge-grade px-2 py-0.5 rounded-md text-[10px] mb-2">
                {card.gradingCompany} {card.grade}
              </span>
              <h3 className="text-sm font-semibold text-foreground leading-relaxed">{card.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{card.setName}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-secondary dark:bg-white/[0.04] p-3">
                <div className="text-[10px] text-muted-foreground mb-1">{t('挂牌价', 'Listed Price')}</div>
                <div className="text-lg font-mono font-bold text-foreground">${card.price.toFixed(2)}</div>
              </div>
              <div className="rounded-xl bg-secondary dark:bg-white/[0.04] p-3">
                <div className="text-[10px] text-muted-foreground mb-1">FMV</div>
                <div className="text-lg font-mono font-bold text-primary">${card.fmv.toFixed(2)}</div>
              </div>
              <div className={`rounded-xl p-3 ${isPositive ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                <div className="text-[10px] text-muted-foreground mb-1">{t('套利空间', 'Spread')}</div>
                <div className={`text-lg font-mono font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{card.spreadPct}%
                </div>
              </div>
            </div>

            {/* Additional info */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-lg bg-secondary dark:bg-white/[0.03] p-2">
                <div className="text-[10px] text-muted-foreground">{t('回购价', 'Buyback')}</div>
                <div className="text-sm font-mono font-bold text-foreground">${card.buyback.toFixed(2)}</div>
              </div>
              <div className="rounded-lg bg-secondary dark:bg-white/[0.03] p-2">
                <div className="text-[10px] text-muted-foreground">{t('年份', 'Year')}</div>
                <div className="text-sm font-mono font-bold text-foreground">{card.year}</div>
              </div>
              <div className="rounded-lg bg-secondary dark:bg-white/[0.03] p-2">
                <div className="text-[10px] text-muted-foreground">{t('语言', 'Language')}</div>
                <div className="text-sm font-bold text-foreground">{card.language || '-'}</div>
              </div>
              <div className="rounded-lg bg-secondary dark:bg-white/[0.03] p-2">
                <div className="text-[10px] text-muted-foreground">{t('卡号', 'Card #')}</div>
                <div className="text-sm font-bold text-foreground">{card.cardNumber || '-'}</div>
              </div>
            </div>

            <div className="rounded-xl bg-secondary dark:bg-white/[0.03] p-4 mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">{t('套利逻辑分析', 'Arbitrage Analysis')}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isPositive
                  ? t(
                      `该卡牌当前挂牌价 $${card.price.toFixed(2)} 低于公允市场价值(FMV) $${card.fmv.toFixed(2)}，存在 $${card.spread.toFixed(2)} 的价差空间（${card.spreadPct}%）。买入后以FMV价格卖出可获得约 ${card.spreadPct}% 的利润。回购保底价 $${card.buyback.toFixed(2)}。`,
                      `Listed at $${card.price.toFixed(2)}, below FMV of $${card.fmv.toFixed(2)}, with a $${card.spread.toFixed(2)} spread (${card.spreadPct}%). Buyback floor: $${card.buyback.toFixed(2)}.`
                    )
                  : t(
                      `该卡牌当前挂牌价 $${card.price.toFixed(2)} 高于公允市场价值(FMV) $${card.fmv.toFixed(2)}，溢价 ${Math.abs(card.spreadPct)}%。不建议在当前价格买入。`,
                      `Listed at $${card.price.toFixed(2)}, above FMV of $${card.fmv.toFixed(2)}, with a ${Math.abs(card.spreadPct)}% premium. Not recommended.`
                    )
                }
              </p>
            </div>

            <div className="flex gap-2">
              <a
                href={`https://www.renaiss.xyz/marketplace/${card.itemId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold btn-primary"
              >
                {t('在Renaiss查看', 'View on Renaiss')} <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => shareToTwitter(card)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <a
                href={card.ebaySearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium btn-secondary"
              >
                <Search className="w-3.5 h-3.5" />
                eBay
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Arbitrage() {
  const { t } = useLang();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('positive');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('spreadPct');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [listedOnly, setListedOnly] = useState(true);
  const [page, setPage] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalCards: 0, listedCards: 0, arbitrageCount: 0, overpricedCount: 0, avgSpread: 0 });
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch all cards on mount
  const loadCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchCards({
        offset: 0,
        limit: 10000,
        sortBy: 'spreadPct',
        sortOrder: 'desc',
        listedOnly: true,
      });
      setAllCards(resp.cards);
      setStats(resp.stats);
    } catch (err) {
      setError('Failed to load data, please try again');
      console.error('Failed to load cards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCards();
      await loadCards();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  };

  // Client-side filtering and sorting
  const filteredCards = useMemo(() => {
    let result = [...allCards];

    // Listed only filter
    if (listedOnly) {
      result = result.filter(c => c.price > 0);
    }

    // Filter mode
    if (filterMode === 'positive') {
      result = result.filter(c => c.spreadPct > 0);
    } else if (filterMode === 'negative') {
      result = result.filter(c => c.spreadPct < 0);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.setName.toLowerCase().includes(q) ||
        c.grade.toLowerCase().includes(q) ||
        c.language.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case 'spreadPct': diff = a.spreadPct - b.spreadPct; break;
        case 'price': diff = a.price - b.price; break;
        case 'fmv': diff = a.fmv - b.fmv; break;
        case 'grade': diff = gradeToNum(a.grade) - gradeToNum(b.grade); break;
      }
      return sortDir === 'desc' ? -diff : diff;
    });

    return result;
  }, [allCards, filterMode, searchQuery, sortKey, sortDir, listedOnly]);

  const totalPages = Math.ceil(filteredCards.length / PAGE_SIZE);
  const pagedCards = filteredCards.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  return (
    <div>
      <AnimatePresence>
        {selectedCard && <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">{t('全市场扫描', 'Full Market Scanner')}</h1>
        <p className="text-sm text-muted-foreground">
          {t(
            `实时监控 Renaiss 全部 ${stats.totalCards.toLocaleString()} 张卡牌，发现套利机会`,
            `Real-time monitoring of all ${stats.totalCards.toLocaleString()} Renaiss cards for arbitrage opportunities`
          )}
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase">{t('总卡牌', 'Total Cards')}</span>
          </div>
          <div className="text-xl font-bold font-mono text-foreground">{stats.totalCards.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[10px] text-muted-foreground uppercase">{t('套利机会', 'Arbitrage')}</span>
          </div>
          <div className="text-xl font-bold font-mono text-green-500">{stats.arbitrageCount}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] text-muted-foreground uppercase">{t('溢价卡牌', 'Overpriced')}</span>
          </div>
          <div className="text-xl font-bold font-mono text-red-500">{stats.overpricedCount}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] text-muted-foreground uppercase">{t('平均价差', 'Avg Spread')}</span>
          </div>
          <div className={`text-xl font-bold font-mono ${stats.avgSpread > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.avgSpread > 0 ? '+' : ''}{stats.avgSpread}%
          </div>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('搜索卡片名称、卡组、语言...', 'Search card name, set, language...')}
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-secondary dark:bg-white/[0.04] border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-secondary dark:bg-white/[0.04] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={listedOnly}
              onChange={e => { setListedOnly(e.target.checked); setPage(0); }}
              className="rounded"
            />
            {t('仅在售', 'Listed Only')}
          </label>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-secondary dark:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {t('刷新数据', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Gacha EV Section */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-500" />
          {t('抽卡正期望值分析', 'Gacha Positive EV Analysis')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gachaPacks.map(pack => (
            <div key={pack.id} className="glass-card p-5 card-positive">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">{pack.name}</h3>
                <span className="badge-arb px-2.5 py-1 rounded-full text-[11px]">
                  +{pack.evPct}% EV
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-[10px] text-muted-foreground">{t('包价', 'Pack Price')}</div>
                  <div className="text-xl font-mono font-bold text-foreground">${pack.price}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">{t('期望值', 'Expected Value')}</div>
                  <div className="text-xl font-mono font-bold text-green-500">${pack.ev}</div>
                </div>
              </div>
              <div className="flex gap-1.5">
                {pack.tiers.map(tier => (
                  <div key={tier.tier} className="flex-1 rounded-lg bg-secondary dark:bg-white/[0.04] p-2 text-center">
                    <div className="text-[10px] font-bold text-foreground">Tier {tier.tier}</div>
                    <div className="text-[10px] text-muted-foreground">{tier.probability}%</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sort + Filter tabs */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5">
          {[
            { id: 'positive' as FilterMode, label: t('低于FMV', 'Below FMV'), icon: TrendingUp },
            { id: 'negative' as FilterMode, label: t('高于FMV', 'Above FMV'), icon: TrendingDown },
            { id: 'all' as FilterMode, label: t('全部', 'All'), icon: Filter },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { setFilterMode(f.id); setPage(0); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterMode === f.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent'
              }`}
            >
              <f.icon className="w-3 h-3" />
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
          {[
            { key: 'spreadPct' as SortKey, label: t('涨幅', 'Spread') },
            { key: 'price' as SortKey, label: t('价格', 'Price') },
            { key: 'fmv' as SortKey, label: 'FMV' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => toggleSort(s.key)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                sortKey === s.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label} {sortKey === s.key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Card count + pagination info */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-muted-foreground">
          {t(
            `共 ${filteredCards.length} 张卡牌 | 第 ${page + 1}/${totalPages || 1} 页`,
            `${filteredCards.length} cards total | Page ${page + 1}/${totalPages || 1}`
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    page === pageNum
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">{t('正在从 Renaiss 加载全部卡牌数据...', 'Loading all card data from Renaiss...')}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{t('首次加载可能需要1-2分钟', 'First load may take 1-2 minutes')}</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button onClick={loadCards} className="btn-primary px-6 py-2.5 rounded-xl text-sm">
            {t('重试', 'Retry')}
          </button>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pagedCards.map((card, i) => {
            const isPositive = card.spread > 0;
            return (
              <motion.div
                key={card.id}
                className="glass-card overflow-hidden cursor-pointer group"
                onClick={() => setSelectedCard(card)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <div className="aspect-[4/5] bg-secondary dark:bg-[#111118] relative overflow-hidden">
                  <img
                    src={card.imgUrl}
                    alt={card.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 badge-grade px-2.5 py-1 rounded-lg text-xs font-bold">
                    {card.grade}
                  </div>
                  {isPositive && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      {t('套利', 'Arb')}
                    </div>
                  )}
                  {!isPositive && card.price > 0 && (
                    <div className="absolute top-3 right-3 bg-red-500/80 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                      {t('溢价', 'Over')}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/70 dark:bg-black/50 backdrop-blur-sm">
                    <div className="live-dot" />
                    <span className="text-[9px] text-muted-foreground font-medium">renaiss</span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-1 leading-snug">{card.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{card.setName}</p>

                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className="text-[10px] text-muted-foreground">{t('挂牌价', 'Listed')}</div>
                      <div className="text-xl font-bold font-mono text-foreground">
                        {card.price > 0 ? `$${card.price.toFixed(2)}` : t('未上架', 'Unlisted')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">{t('参考价', 'FMV')}</div>
                      <div className="text-xl font-bold font-mono text-muted-foreground">${card.fmv.toFixed(2)}</div>
                    </div>
                  </div>

                  {card.price > 0 && (
                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${isPositive ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                      <span className="text-xs text-muted-foreground">{t('潜在利润', 'Profit')}</span>
                      <span className={`text-sm font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{card.spreadPct}% (${isPositive ? '+' : ''}{card.spread.toFixed(2)})
                      </span>
                    </div>
                  )}

                  <a
                    href={`https://www.renaiss.xyz/marketplace/${card.itemId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold btn-primary"
                    onClick={e => e.stopPropagation()}
                  >
                    {t('在Renaiss查看', 'View on Renaiss')} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Search className="w-8 h-8 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">{t('没有找到匹配的卡牌', 'No matching cards found')}</p>
        </div>
      )}

      {/* Bottom pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium btn-secondary disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> {t('上一页', 'Previous')}
          </button>
          <span className="text-sm text-muted-foreground px-4">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium btn-secondary disabled:opacity-30"
          >
            {t('下一页', 'Next')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Data source note */}
      <div className="mt-8 text-center text-xs text-muted-foreground/50">
        {t(
          `数据来源: Renaiss Protocol 官方市场 (renaiss.xyz) | 覆盖全部 ${stats.totalCards.toLocaleString()} 张卡牌 | 每5分钟自动刷新`,
          `Data: Renaiss Protocol (renaiss.xyz) | All ${stats.totalCards.toLocaleString()} cards | Auto-refresh every 5min`
        )}
      </div>
    </div>
  );
}
