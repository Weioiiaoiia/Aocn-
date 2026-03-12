/*
 * AOCN Radar — Real-time card listing monitor
 * Inspired by traded.gg/radar concept
 * Shows latest listed cards, price movements, and real-time arbitrage discovery
 */
import { useLang } from '@/contexts/LanguageContext';
import { fetchCards, type FetchCardsResponse } from '@/lib/api';
import type { Card } from '@/lib/data';
import {
  Radar as RadarIcon, Clock, TrendingUp, TrendingDown, ExternalLink,
  Filter, Sparkles, RefreshCw, Loader2, Zap, Activity, Eye,
  ChevronDown, Search, Volume2, VolumeX, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const REFRESH_INTERVAL = 30; // 30 seconds for radar
const MAX_RADAR_ITEMS = 100;

interface RadarItem extends Card {
  detectedAt: number;
  isNew: boolean;
  priceChange?: number;
}

// Time ago helper
function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Radar pulse animation
function RadarPulse() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
      <div className="absolute inset-4 rounded-full border border-emerald-500/30" />
      <div className="absolute inset-8 rounded-full border border-emerald-500/40" />
      <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/5" style={{ animationDuration: '3s' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <RadarIcon className="w-8 h-8 text-emerald-500 animate-pulse" />
      </div>
      {/* Sweeping line */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent origin-left"
          style={{ animation: 'spin 4s linear infinite' }}
        />
      </div>
    </div>
  );
}

// Single radar card item
function RadarCard({ item, index }: { item: RadarItem; index: number }) {
  const { t } = useLang();
  const isPositive = item.spreadPct > 0;

  return (
    <motion.div
      className={`glass-card overflow-hidden group ${item.isNew ? 'ring-1 ring-emerald-500/30' : ''}`}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
    >
      <div className="flex gap-3 p-3">
        {/* Card Image */}
        <div className="w-20 h-24 shrink-0 bg-secondary dark:bg-[#111118] rounded-lg overflow-hidden relative">
          <img
            src={item.imgUrl}
            alt={item.name}
            className="w-full h-full object-contain p-1"
            loading="lazy"
          />
          {item.isNew && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] font-bold flex items-center gap-0.5">
              <Zap className="w-2 h-2" /> NEW
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">{item.name}</h3>
            <span className="shrink-0 text-[9px] text-muted-foreground/60 font-mono flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {timeAgo(item.detectedAt)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-secondary text-muted-foreground border border-border">
              {item.gradingCompany} {item.grade}
            </span>
            <span className="text-[9px] text-muted-foreground">{item.setName}</span>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-[9px] text-muted-foreground">{t('价格', 'Price')}</div>
                <div className="text-sm font-mono font-bold text-foreground">
                  {item.price > 0 ? `$${item.price.toFixed(2)}` : '-'}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-muted-foreground">FMV</div>
                <div className="text-sm font-mono font-bold text-muted-foreground">${item.fmv.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {item.price > 0 && (
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-0.5 ${
                  isPositive
                    ? 'bg-green-50 dark:bg-green-500/10 text-green-500'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-500'
                }`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{item.spreadPct}%
                </span>
              )}
              <a
                href={`https://www.renaiss.xyz/card/${item.tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function RadarPage() {
  const { t } = useLang();
  const [items, setItems] = useState<RadarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [isPaused, setIsPaused] = useState(false);
  const [totalScanned, setTotalScanned] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const previousIds = useRef<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showArbitrageOnly, setShowArbitrageOnly] = useState(false);
  const [languageFilter, setLanguageFilter] = useState('all');

  const loadRadarData = useCallback(async () => {
    try {
      const resp = await fetchCards({
        offset: 0,
        limit: MAX_RADAR_ITEMS,
        sortBy: 'listDate',
        sortOrder: 'desc',
        listedOnly: true,
      });

      const now = Date.now();
      let newDetected = 0;

      const radarItems: RadarItem[] = resp.cards.map((card, i) => {
        const isNew = !previousIds.current.has(card.id);
        if (isNew) newDetected++;
        // Simulate detection time based on position (most recent first)
        const detectedAt = now - i * 60000 * (0.5 + Math.random() * 2);
        return {
          ...card,
          detectedAt,
          isNew: isNew && previousIds.current.size > 0,
        };
      });

      // Update previous IDs
      previousIds.current = new Set(resp.cards.map(c => c.id));

      setItems(radarItems);
      setTotalScanned(resp.stats.totalCards);
      setNewCount(newDetected);
      setCountdown(REFRESH_INTERVAL);
    } catch (err) {
      console.error('Radar fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRadarData(); }, [loadRadarData]);

  // Auto-refresh countdown
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          loadRadarData();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loadRadarData, isPaused]);

  // Extract filter options
  const filterOptions = useMemo(() => {
    const grades = new Set<string>();
    const languages = new Set<string>();
    items.forEach(item => {
      if (item.grade) grades.add(item.grade);
      if (item.language) languages.add(item.language);
    });
    return {
      grades: Array.from(grades).sort(),
      languages: Array.from(languages).sort(),
    };
  }, [items]);

  // Apply filters
  const filteredItems = useMemo(() => {
    let result = [...items];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(q) || item.setName.toLowerCase().includes(q)
      );
    }
    if (gradeFilter !== 'all') result = result.filter(item => item.grade === gradeFilter);
    if (languageFilter !== 'all') result = result.filter(item => item.language === languageFilter);
    if (priceMin) result = result.filter(item => item.price >= Number(priceMin));
    if (priceMax) result = result.filter(item => item.price <= Number(priceMax));
    if (showArbitrageOnly) result = result.filter(item => item.spreadPct > 0);
    return result;
  }, [items, searchQuery, gradeFilter, languageFilter, priceMin, priceMax, showArbitrageOnly]);

  const arbitrageItems = filteredItems.filter(item => item.spreadPct > 0);

  return (
    <div>
      {/* Header with Radar animation */}
      <div className="text-center mb-8">
        <RadarPulse />
        <h1 className="text-3xl font-extrabold text-foreground mb-2">
          <span className="text-emerald-500">AOCN</span> {t('实时雷达', 'Live Radar')}
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          {t(
            '实时监控 Renaiss 市场最新上架卡牌，自动发现套利机会。数据每30秒自动刷新。',
            'Real-time monitoring of newly listed cards on Renaiss marketplace. Auto-refresh every 30 seconds.'
          )}
        </p>
      </div>

      {/* Live Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card p-4 text-center">
          <Activity className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <div className="text-xl font-bold font-mono text-foreground">{totalScanned.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground">{t('总扫描卡牌', 'Total Scanned')}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <Eye className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <div className="text-xl font-bold font-mono text-foreground">{filteredItems.length}</div>
          <div className="text-[10px] text-muted-foreground">{t('雷达捕获', 'Radar Detected')}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <Sparkles className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <div className="text-xl font-bold font-mono text-green-500">{arbitrageItems.length}</div>
          <div className="text-[10px] text-muted-foreground">{t('套利信号', 'Arb Signals')}</div>
        </div>
        <div className="glass-card p-4 text-center relative">
          <RefreshCw className={`w-5 h-5 text-primary mx-auto mb-1 ${!isPaused ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          <div className="text-xl font-bold font-mono text-primary">{countdown}s</div>
          <div className="text-[10px] text-muted-foreground">{t('下次扫描', 'Next Scan')}</div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:text-foreground"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">{t('雷达过滤器', 'Radar Filters')}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('搜索卡牌...', 'Search cards...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-secondary dark:bg-white/[0.04] border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>
          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs bg-secondary dark:bg-white/[0.04] border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          >
            <option value="all">{t('全部评级', 'All Grades')}</option>
            {filterOptions.grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select
            value={languageFilter}
            onChange={e => setLanguageFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs bg-secondary dark:bg-white/[0.04] border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          >
            <option value="all">{t('全部语言', 'All Languages')}</option>
            {filterOptions.languages.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="Min $"
              value={priceMin}
              onChange={e => setPriceMin(e.target.value)}
              className="w-20 px-2 py-2 rounded-lg text-xs bg-secondary dark:bg-white/[0.04] border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
            <span className="text-muted-foreground text-xs">-</span>
            <input
              type="number"
              placeholder="Max $"
              value={priceMax}
              onChange={e => setPriceMax(e.target.value)}
              className="w-20 px-2 py-2 rounded-lg text-xs bg-secondary dark:bg-white/[0.04] border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>
          <button
            onClick={() => setShowArbitrageOnly(!showArbitrageOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              showArbitrageOnly
                ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-border bg-secondary dark:bg-white/[0.04] text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            {t('仅套利', 'Arb Only')}
          </button>
          <button
            onClick={() => { loadRadarData(); setCountdown(REFRESH_INTERVAL); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border bg-secondary dark:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            {t('手动刷新', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">{t('雷达扫描中...', 'Radar scanning...')}</p>
        </div>
      )}

      {/* Radar Feed */}
      {!loading && (
        <>
          {/* Arbitrage Alerts Section */}
          {arbitrageItems.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-emerald-500 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {t('套利信号', 'Arbitrage Signals')} ({arbitrageItems.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {arbitrageItems.slice(0, 6).map((item, i) => (
                  <RadarCard key={`arb-${item.id}`} item={item} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Full Radar Feed */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              {t('实时卡牌动态', 'Live Card Feed')} ({filteredItems.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence>
                {filteredItems.map((item, i) => (
                  <RadarCard key={item.id} item={item} index={i} />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <RadarIcon className="w-8 h-8 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">{t('雷达未检测到匹配的卡牌', 'No matching cards detected by radar')}</p>
            </div>
          )}
        </>
      )}

      {/* Data source */}
      <div className="mt-8 text-center text-[10px] text-muted-foreground/40">
        {t(
          '数据来源: Renaiss Protocol (renaiss.xyz) | 雷达每30秒自动扫描 | 仅供参考',
          'Source: Renaiss Protocol (renaiss.xyz) | Radar auto-scans every 30s | For reference only'
        )}
      </div>
    </div>
  );
}
