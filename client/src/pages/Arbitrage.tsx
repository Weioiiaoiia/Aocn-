/*
 * AOCN Arbitrage — Full marketplace scanner with live data from Renaiss
 * Features: Favorites, Export CSV, Auto-refresh countdown, Profit calculator,
 * Category/Year/Grade filters, Price alerts, Historical price chart simulation
 */
import { useLang } from '@/contexts/LanguageContext';
import { gachaPacks, type Card } from '@/lib/data';
import { fetchCards, refreshCards, fetchCardHistory, type FetchCardsResponse, type PriceSnapshot } from '@/lib/api';
import {
  TrendingUp, TrendingDown, ExternalLink, Search, Filter,
  Package, ArrowUpDown, Share2, Sparkles, RefreshCw, X,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, BarChart3,
  Heart, Download, Timer, Calculator, Bell, LineChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

type SortKey = 'spreadPct' | 'price' | 'fmv' | 'grade';
type SortDir = 'asc' | 'desc';
type FilterMode = 'all' | 'positive' | 'negative';

const PAGE_SIZE = 30;
const AUTO_REFRESH_INTERVAL = 300; // 5 minutes in seconds

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

// ─── Favorites Hook ───
function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('aocn_favorites');
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const toggle = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('aocn_favorites', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  return { favorites, toggle, isFav: (id: string) => favorites.has(id) };
}

// ─── Price Alert Hook ───
function usePriceAlerts() {
  const [alerts, setAlerts] = useState<Map<string, number>>(() => {
    try {
      const saved = localStorage.getItem('aocn_price_alerts');
      return saved ? new Map<string, number>(JSON.parse(saved)) : new Map<string, number>();
    } catch { return new Map<string, number>(); }
  });

  const setAlert = useCallback((cardId: string, threshold: number) => {
    setAlerts(prev => {
      const next = new Map(prev);
      if (threshold <= 0) next.delete(cardId); else next.set(cardId, threshold);
      localStorage.setItem('aocn_price_alerts', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  return { alerts, setAlert, hasAlert: (id: string) => alerts.has(id), getAlert: (id: string) => alerts.get(id) };
}

// ─── Export CSV ───
function exportCSV(cards: Card[], filename: string) {
  const headers = ['Name', 'Set', 'Grade', 'Year', 'Language', 'Listed Price', 'FMV', 'Buyback', 'Spread $', 'Spread %', 'URL'];
  const rows = cards.map(c => [
    `"${c.name}"`, `"${c.setName}"`, c.grade, c.year, c.language,
    c.price.toFixed(2), c.fmv.toFixed(2), c.buyback.toFixed(2),
    c.spread.toFixed(2), c.spreadPct.toString(),
    `https://www.renaiss.xyz/card/${c.tokenId}`
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Price History (Real API with fallback) ───
function useCardHistory(card: Card) {
  const [history, setHistory] = useState<{ day: string; price: number; fmv: number }[]>([]);
  const [isReal, setIsReal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCardHistory(card.id, 14)
      .then(resp => {
        if (cancelled) return;
        if (resp.history && resp.history.length >= 2) {
          // Use real data from backend
          const mapped = resp.history.map((s: PriceSnapshot) => {
            const d = new Date(s.timestamp);
            return {
              day: `${d.getMonth() + 1}/${d.getDate()}`,
              price: s.price,
              fmv: s.fmv,
            };
          });
          setHistory(mapped);
          setIsReal(true);
        } else {
          // Not enough real data yet, generate initial baseline
          setHistory(generateBaseline(card));
          setIsReal(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistory(generateBaseline(card));
          setIsReal(false);
        }
      });
    return () => { cancelled = true; };
  }, [card.id, card.price, card.fmv]);

  return { history, isReal };
}

function generateBaseline(card: Card) {
  // Show current price as a single-point baseline when no history exists
  const now = new Date();
  const dayStr = `${now.getMonth() + 1}/${now.getDate()}`;
  return [{ day: dayStr, price: card.price, fmv: card.fmv }];
}

// ─── Mini Chart Component ───
function MiniChart({ data }: { data: { day: string; price: number; fmv: number }[] }) {
  const { t } = useLang();
  const maxVal = Math.max(...data.map(d => Math.max(d.price, d.fmv)));
  const minVal = Math.min(...data.map(d => Math.min(d.price, d.fmv)));
  const range = maxVal - minVal || 1;
  const h = 100;
  const w = 280;
  const step = w / (data.length - 1);

  const pricePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${i * step},${h - ((d.price - minVal) / range) * h}`).join(' ');
  const fmvPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${i * step},${h - ((d.fmv - minVal) / range) * h}`).join(' ');

  return (
    <div className="mt-3">
      <div className="flex items-center gap-4 mb-2">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> {t('挂牌价', 'Price')}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" /> FMV
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
        <path d={pricePath} fill="none" stroke="#3b82f6" strokeWidth="2" />
        <path d={fmvPath} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4,2" />
      </svg>
      <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-0.5">
        <span>{data[0]?.day}</span>
        <span>{data[data.length - 1]?.day}</span>
      </div>
    </div>
  );
}

// ─── Profit Calculator Modal ───
function ProfitCalculator({ card, onClose }: { card: Card; onClose: () => void }) {
  const { t } = useLang();
  const [fee, setFee] = useState(5);
  const buyPrice = card.price;
  const sellPrice = card.fmv;
  const feeAmount = sellPrice * (fee / 100);
  const netProfit = sellPrice - buyPrice - feeAmount;
  const roi = buyPrice > 0 ? ((netProfit / buyPrice) * 100) : 0;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          {t('套利利润计算器', 'Arbitrage Profit Calculator')}
        </h3>
        <p className="text-xs text-muted-foreground mb-4 line-clamp-1">{card.name}</p>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary p-3">
              <div className="text-[10px] text-muted-foreground">{t('买入价', 'Buy Price')}</div>
              <div className="text-lg font-mono font-bold text-foreground">${buyPrice.toFixed(2)}</div>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <div className="text-[10px] text-muted-foreground">{t('卖出价 (FMV)', 'Sell (FMV)')}</div>
              <div className="text-lg font-mono font-bold text-primary">${sellPrice.toFixed(2)}</div>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">{t('手续费率 (%)', 'Fee Rate (%)')}</label>
            <input
              type="number" value={fee} onChange={e => setFee(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-sm bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              min={0} max={100} step={0.1}
            />
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t('手续费', 'Fee')}</span>
              <span className="font-mono text-red-500">-${feeAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t('回购保底', 'Buyback Floor')}</span>
              <span className="font-mono text-foreground">${card.buyback.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-xs font-semibold">{t('净利润', 'Net Profit')}</span>
              <span className={`text-xl font-mono font-bold ${netProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {netProfit > 0 ? '+' : ''}${netProfit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold">ROI</span>
              <span className={`text-lg font-mono font-bold ${roi > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Card Detail Modal ───
function CardDetail({ card, onClose, isFav, toggleFav, onCalc }: {
  card: Card; onClose: () => void; isFav: boolean; toggleFav: () => void; onCalc: () => void;
}) {
  const { t } = useLang();
  const isPositive = card.spread > 0;
  const { history: priceHistory, isReal: isRealHistory } = useCardHistory(card);

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
            <button
              onClick={toggleFav}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 dark:bg-black/50 backdrop-blur-sm hover:bg-background transition-colors"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </button>
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

            {/* Price History Chart */}
            <div className="rounded-xl bg-secondary dark:bg-white/[0.03] p-4 mb-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <LineChart className="w-3.5 h-3.5 text-blue-500" />
                  {t('价格走势', 'Price Trend')}
                </h4>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  isRealHistory
                    ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  {isRealHistory ? t('实时数据', 'Live Data') : t('暂无历史 - 待積累', 'Collecting...')}
                </span>
              </div>
              {priceHistory.length >= 2 ? (
                <MiniChart data={priceHistory} />
              ) : (
                <div className="flex items-center justify-center py-6 text-[11px] text-muted-foreground/60">
                  {t('历史数据積累中，每30分钟记录一次价格快照...', 'Accumulating history, snapshots every 30 min...')}
                </div>
              )}
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

            <div className="flex gap-2 flex-wrap">
              <a
                href={`https://www.renaiss.xyz/card/${card.tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold btn-primary"
              >
                {t('购买卡牌', 'Buy Card')} <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onCalc}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
              >
                <Calculator className="w-3.5 h-3.5" />
              </button>
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
                <Search className="w-3.5 h-3.5" /> eBay
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
  const [calcCard, setCalcCard] = useState<Card | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('positive');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('spreadPct');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [listedOnly, setListedOnly] = useState(true);
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalCards: 0, listedCards: 0, arbitrageCount: 0, overpricedCount: 0, avgSpread: 0 });
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL);
  const [alertThresholdInput, setAlertThresholdInput] = useState('');
  const [showAlertModal, setShowAlertModal] = useState<Card | null>(null);
  // Category filters
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [setFilter, setSetFilter] = useState<string>('all');

  const { favorites, toggle: toggleFav, isFav } = useFavorites();
  const { alerts, setAlert, hasAlert, getAlert } = usePriceAlerts();

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
      setCountdown(AUTO_REFRESH_INTERVAL);
    } catch (err) {
      setError('Failed to load data, please try again');
      console.error('Failed to load cards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  // Auto-refresh countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          loadCards();
          return AUTO_REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
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
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  // Extract unique years, grades, sets for filters
  const filterOptions = useMemo(() => {
    const years = new Set<number>();
    const grades = new Set<string>();
    const sets = new Set<string>();
    allCards.forEach(c => {
      if (c.year) years.add(c.year);
      if (c.grade) grades.add(c.grade);
      if (c.setName) sets.add(c.setName);
    });
    return {
      years: Array.from(years).sort((a, b) => b - a),
      grades: Array.from(grades).sort(),
      sets: Array.from(sets).sort(),
    };
  }, [allCards]);

  // Client-side filtering and sorting
  const filteredCards = useMemo(() => {
    let result = [...allCards];
    if (listedOnly) result = result.filter(c => c.price > 0);
    if (filterMode === 'positive') result = result.filter(c => c.spreadPct > 0);
    else if (filterMode === 'negative') result = result.filter(c => c.spreadPct < 0);
    if (showFavOnly) result = result.filter(c => favorites.has(c.id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) || c.setName.toLowerCase().includes(q) ||
        c.grade.toLowerCase().includes(q) || c.language.toLowerCase().includes(q)
      );
    }
    if (yearFilter !== 'all') result = result.filter(c => String(c.year) === yearFilter);
    if (gradeFilter !== 'all') result = result.filter(c => c.grade === gradeFilter);
    if (setFilter !== 'all') result = result.filter(c => c.setName === setFilter);

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
  }, [allCards, filterMode, searchQuery, sortKey, sortDir, listedOnly, showFavOnly, favorites, yearFilter, gradeFilter, setFilter]);

  const totalPages = Math.ceil(filteredCards.length / PAGE_SIZE);
  const pagedCards = filteredCards.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <AnimatePresence>
        {selectedCard && (
          <CardDetail
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            isFav={isFav(selectedCard.id)}
            toggleFav={() => toggleFav(selectedCard.id)}
            onCalc={() => { setCalcCard(selectedCard); }}
          />
        )}
        {calcCard && <ProfitCalculator card={calcCard} onClose={() => setCalcCard(null)} />}
        {showAlertModal && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAlertModal(null)} />
            <motion.div
              className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            >
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                {t('设置价格提醒', 'Set Price Alert')}
              </h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{showAlertModal.name}</p>
              <p className="text-[11px] text-muted-foreground mb-2">
                {t('当价差超过此阈值时提醒（%）', 'Alert when spread exceeds threshold (%)')}
              </p>
              <input
                type="number"
                value={alertThresholdInput}
                onChange={e => setAlertThresholdInput(e.target.value)}
                placeholder="e.g. 15"
                className="w-full px-3 py-2 rounded-lg text-sm bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAlert(showAlertModal.id, Number(alertThresholdInput));
                    setShowAlertModal(null);
                    setAlertThresholdInput('');
                  }}
                  className="flex-1 btn-primary px-4 py-2 rounded-lg text-sm"
                >
                  {t('确认', 'Confirm')}
                </button>
                {hasAlert(showAlertModal.id) && (
                  <button
                    onClick={() => {
                      setAlert(showAlertModal.id, 0);
                      setShowAlertModal(null);
                    }}
                    className="px-4 py-2 rounded-lg text-sm btn-secondary text-red-500"
                  >
                    {t('取消提醒', 'Remove')}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
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
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Timer className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] text-muted-foreground uppercase">{t('下次刷新', 'Next Refresh')}</span>
          </div>
          <div className="text-xl font-bold font-mono text-blue-500">{formatCountdown(countdown)}</div>
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
            onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-secondary dark:bg-white/[0.04] border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-secondary dark:bg-white/[0.04] text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={listedOnly} onChange={e => { setListedOnly(e.target.checked); setPage(0); }} className="rounded" />
            {t('仅在售', 'Listed Only')}
          </label>
          <button
            onClick={() => { setShowFavOnly(!showFavOnly); setPage(0); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              showFavOnly ? 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-500' : 'border-border bg-secondary dark:bg-white/[0.04] text-muted-foreground hover:text-foreground'
            }`}
          >
            <Heart className={`w-4 h-4 ${showFavOnly ? 'fill-red-500' : ''}`} />
            {t('收藏', 'Favorites')} ({favorites.size})
          </button>
          <button
            onClick={() => exportCSV(filteredCards, `renaiss-arbitrage-${new Date().toISOString().split('T')[0]}.csv`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-secondary dark:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-all"
          >
            <Download className="w-4 h-4" />
            {t('导出CSV', 'Export CSV')}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-secondary dark:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {t('刷新', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Advanced Filters: Year / Grade / Set */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={yearFilter}
          onChange={e => { setYearFilter(e.target.value); setPage(0); }}
          className="px-3 py-1.5 rounded-lg text-[12px] bg-secondary dark:bg-white/[0.04] border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          <option value="all">{t('全部年份', 'All Years')}</option>
          {filterOptions.years.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>
        <select
          value={gradeFilter}
          onChange={e => { setGradeFilter(e.target.value); setPage(0); }}
          className="px-3 py-1.5 rounded-lg text-[12px] bg-secondary dark:bg-white/[0.04] border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          <option value="all">{t('全部评级', 'All Grades')}</option>
          {filterOptions.grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select
          value={setFilter}
          onChange={e => { setSetFilter(e.target.value); setPage(0); }}
          className="px-3 py-1.5 rounded-lg text-[12px] bg-secondary dark:bg-white/[0.04] border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 max-w-[200px]"
        >
          <option value="all">{t('全部卡组', 'All Sets')}</option>
          {filterOptions.sets.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
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
                <span className="badge-arb px-2.5 py-1 rounded-full text-[11px]">+{pack.evPct}% EV</span>
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
              <f.icon className="w-3 h-3" /> {f.label}
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
                sortKey === s.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
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
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i;
              else if (page < 3) pageNum = i;
              else if (page > totalPages - 4) pageNum = totalPages - 5 + i;
              else pageNum = page - 2 + i;
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    page === pageNum ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}>
                  {pageNum + 1}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-all">
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
          <button onClick={loadCards} className="btn-primary px-6 py-2.5 rounded-xl text-sm">{t('重试', 'Retry')}</button>
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
                  <img src={card.imgUrl} alt={card.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  <div className="absolute top-3 left-3 badge-grade px-2.5 py-1 rounded-lg text-xs font-bold">{card.grade}</div>
                  {isPositive && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3 h-3" /> {t('套利', 'Arb')}
                    </div>
                  )}
                  {!isPositive && card.price > 0 && (
                    <div className="absolute top-3 right-3 bg-red-500/80 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">{t('溢价', 'Over')}</div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/70 dark:bg-black/50 backdrop-blur-sm">
                    <div className="live-dot" />
                    <span className="text-[9px] text-muted-foreground font-medium">renaiss</span>
                  </div>
                  {/* Favorite & Alert buttons */}
                  <div className="absolute bottom-3 right-3 flex gap-1.5">
                    <button
                      onClick={e => { e.stopPropagation(); toggleFav(card.id); }}
                      className="p-1.5 rounded-full bg-background/70 dark:bg-black/50 backdrop-blur-sm hover:bg-background transition-colors"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav(card.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setShowAlertModal(card); setAlertThresholdInput(String(getAlert(card.id) || '')); }}
                      className="p-1.5 rounded-full bg-background/70 dark:bg-black/50 backdrop-blur-sm hover:bg-background transition-colors"
                    >
                      <Bell className={`w-3.5 h-3.5 ${hasAlert(card.id) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                    </button>
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
                    href={`https://www.renaiss.xyz/card/${card.tokenId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold btn-primary"
                    onClick={e => e.stopPropagation()}
                  >
                    {t('购买卡牌', 'Buy Card')} <ExternalLink className="w-3.5 h-3.5" />
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
          <span className="text-sm text-muted-foreground px-4">{page + 1} / {totalPages}</span>
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
