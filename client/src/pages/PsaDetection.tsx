/*
 * AOCN PSA Sequential Certificate Number Detection Page
 * 
 * Dedicated page for detecting PSA consecutive serial numbers.
 * Cards are displayed in a spread-out grid layout (similar to Arbitrage page)
 * with full arbitrage information visible on each card.
 */
import { useLang } from '@/contexts/LanguageContext';
import { fetchAllCards } from '@/lib/api';
import { useSequentialDetector, type SequentialGroup } from '@/hooks/useSequentialDetector';
import type { Card } from '@/lib/data';
import {
  Search, ExternalLink, Sparkles, RefreshCw, X,
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
  TrendingUp, TrendingDown, Share2, Hash, Layers,
  ArrowUpDown, Filter, BarChart3, Link2, Eye,
  Calculator, Heart, DollarSign, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect, useCallback } from 'react';

type ViewMode = 'groups' | 'all-cards';
type SortKey = 'length' | 'totalValue' | 'totalFmv' | 'spreadPct';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 20;

function shareGroupToTwitter(group: SequentialGroup) {
  const text = encodeURIComponent(
    `Found ${group.length} consecutive PSA serial numbers on @renaissxyz!\n\n` +
    `${group.gradingCompany} ${group.grade} | ${group.setName}\n` +
    `Serial #${group.startSerial} → #${group.endSerial}\n` +
    `Total Value: $${group.totalValue.toFixed(2)} | FMV: $${group.totalFmv.toFixed(2)}\n\n` +
    `Detected by @Aocn_renaiss #AOCN #PSA #TCG`
  );
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

// ─── Group Detail Modal ───
function GroupDetailModal({ group, onClose }: { group: SequentialGroup; onClose: () => void }) {
  const { t } = useLang();
  const totalSpread = group.cards.reduce((sum, c) => sum + c.spread, 0);
  const avgSpreadPct = group.cards.length > 0
    ? (group.cards.reduce((sum, c) => sum + c.spreadPct, 0) / group.cards.length)
    : 0;
  const isPositiveGroup = totalSpread > 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-4xl rounded-2xl border border-border bg-background overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
      >
        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-grade px-2.5 py-1 rounded-lg text-xs font-bold">
                {group.gradingCompany} {group.grade}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                <Link2 className="w-3 h-3 inline mr-1" />
                {group.length} {t('连号', 'Consecutive')}
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground">{group.setName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Serial #{group.startSerial} → #{group.endSerial}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl bg-secondary dark:bg-white/[0.04] p-3">
              <div className="text-[10px] text-muted-foreground mb-1">{t('总挂牌价', 'Total Listed')}</div>
              <div className="text-lg font-mono font-bold text-foreground">${group.totalValue.toFixed(2)}</div>
            </div>
            <div className="rounded-xl bg-secondary dark:bg-white/[0.04] p-3">
              <div className="text-[10px] text-muted-foreground mb-1">{t('总 FMV', 'Total FMV')}</div>
              <div className="text-lg font-mono font-bold text-primary">${group.totalFmv.toFixed(2)}</div>
            </div>
            <div className={`rounded-xl p-3 ${isPositiveGroup ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
              <div className="text-[10px] text-muted-foreground mb-1">{t('总价差', 'Total Spread')}</div>
              <div className={`text-lg font-mono font-bold ${isPositiveGroup ? 'text-green-500' : 'text-red-500'}`}>
                {isPositiveGroup ? '+' : ''}${totalSpread.toFixed(2)}
              </div>
            </div>
            <div className={`rounded-xl p-3 ${avgSpreadPct > 0 ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
              <div className="text-[10px] text-muted-foreground mb-1">{t('平均价差%', 'Avg Spread %')}</div>
              <div className={`text-lg font-mono font-bold ${avgSpreadPct > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {avgSpreadPct > 0 ? '+' : ''}{avgSpreadPct.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            {t('连号卡牌详情', 'Consecutive Cards Detail')}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.cards.map((card, i) => {
              const isPositive = card.spread > 0;
              return (
                <motion.div
                  key={card.id}
                  className="glass-card overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="aspect-[4/5] bg-secondary dark:bg-[#111118] relative overflow-hidden">
                    <img src={card.imgUrl} alt={card.name}
                      className="w-full h-full object-contain p-4" loading="lazy" />
                    <div className="absolute top-3 left-3 badge-grade px-2 py-0.5 rounded-lg text-xs font-bold">{card.grade}</div>
                    <div className="absolute top-3 right-3 bg-purple-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {card.serial}
                    </div>
                    {isPositive && (
                      <div className="absolute bottom-3 right-3 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-3 h-3" /> {t('套利', 'Arb')}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-1 leading-snug">{card.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{card.setName}</p>

                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <div className="text-[10px] text-muted-foreground">{t('挂牌价', 'Listed')}</div>
                        <div className="text-lg font-bold font-mono text-foreground">
                          {card.price > 0 ? `$${card.price.toFixed(2)}` : t('未上架', 'Unlisted')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">FMV</div>
                        <div className="text-lg font-bold font-mono text-muted-foreground">${card.fmv.toFixed(2)}</div>
                      </div>
                    </div>

                    {card.price > 0 && (
                      <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 ${isPositive ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                        <span className="text-xs text-muted-foreground">{t('利润', 'Profit')}</span>
                        <span className={`text-sm font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{card.spreadPct}% (${isPositive ? '+' : ''}{card.spread.toFixed(2)})
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="rounded-lg bg-secondary dark:bg-white/[0.03] p-2">
                        <div className="text-[9px] text-muted-foreground">{t('回购价', 'Buyback')}</div>
                        <div className="text-xs font-mono font-bold text-foreground">${card.buyback.toFixed(2)}</div>
                      </div>
                      <div className="rounded-lg bg-secondary dark:bg-white/[0.03] p-2">
                        <div className="text-[9px] text-muted-foreground">{t('序列号', 'Serial')}</div>
                        <div className="text-xs font-mono font-bold text-purple-500">{card.serial}</div>
                      </div>
                    </div>

                    <a
                      href={`https://www.renaiss.xyz/card/${card.tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold btn-primary"
                    >
                      {t('查看卡牌', 'View Card')} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 flex-wrap">
            <button
              onClick={() => shareGroupToTwitter(group)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> {t('分享到 X', 'Share on X')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page Component ───
export default function PsaDetection() {
  const { t } = useLang();
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<SequentialGroup | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('groups');
  const [sortKey, setSortKey] = useState<SortKey>('length');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [minLength, setMinLength] = useState(2);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  // Load all cards
  const loadCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cards = await fetchAllCards();
      setAllCards(cards);
    } catch (err) {
      console.error('Failed to load cards:', err);
      setError(t('数据加载失败，请重试', 'Failed to load data, please retry'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadCards(); }, [loadCards]);

  // Run sequential detection
  const { groups, groupCount, sequentialCardCount, isScanning, lastScanTime, rescan } = useSequentialDetector(allCards);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCards();
    rescan();
    setRefreshing(false);
  };

  // Extract filter options
  const filterOptions = useMemo(() => {
    const grades = new Set<string>();
    const companies = new Set<string>();
    groups.forEach(g => {
      grades.add(g.grade);
      companies.add(g.gradingCompany);
    });
    return {
      grades: Array.from(grades).sort(),
      companies: Array.from(companies).sort(),
    };
  }, [groups]);

  // Filter and sort groups
  const filteredGroups = useMemo(() => {
    let result = [...groups];

    // Min length filter
    result = result.filter(g => g.length >= minLength);

    // Grade filter
    if (gradeFilter !== 'all') result = result.filter(g => g.grade === gradeFilter);

    // Company filter
    if (companyFilter !== 'all') result = result.filter(g => g.gradingCompany === companyFilter);

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.setName.toLowerCase().includes(q) ||
        g.gradingCompany.toLowerCase().includes(q) ||
        g.grade.toLowerCase().includes(q) ||
        g.cards.some(c => c.name.toLowerCase().includes(q) || c.serial.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case 'length': diff = a.length - b.length; break;
        case 'totalValue': diff = a.totalValue - b.totalValue; break;
        case 'totalFmv': diff = a.totalFmv - b.totalFmv; break;
        case 'spreadPct': {
          const aAvg = a.cards.reduce((s, c) => s + c.spreadPct, 0) / a.cards.length;
          const bAvg = b.cards.reduce((s, c) => s + c.spreadPct, 0) / b.cards.length;
          diff = aAvg - bAvg;
          break;
        }
      }
      return sortDir === 'desc' ? -diff : diff;
    });

    return result;
  }, [groups, searchQuery, sortKey, sortDir, minLength, gradeFilter, companyFilter]);

  const totalPages = Math.ceil(filteredGroups.length / PAGE_SIZE);
  const pagedGroups = filteredGroups.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  // Stats
  const totalValue = groups.reduce((sum, g) => sum + g.totalValue, 0);
  const totalFmv = groups.reduce((sum, g) => sum + g.totalFmv, 0);
  const arbitrageGroups = groups.filter(g => {
    const totalSpread = g.cards.reduce((s, c) => s + c.spread, 0);
    return totalSpread > 0;
  }).length;

  return (
    <div>
      <AnimatePresence>
        {selectedGroup && (
          <GroupDetailModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('PSA 连号检测', 'PSA Sequential Detection')}</h1>
            <p className="text-sm text-muted-foreground">
              {t(
                '自动扫描 Renaiss 全部卡牌，检测 PSA 连续证书编号',
                'Auto-scan all Renaiss cards for consecutive PSA certificate numbers'
              )}
            </p>
          </div>
        </div>
        {lastScanTime && (
          <p className="text-xs text-muted-foreground/60 mt-1">
            {t('上次扫描:', 'Last scan:')} {lastScanTime.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Link2 className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-[10px] text-muted-foreground uppercase">{t('连号组数', 'Groups')}</span>
          </div>
          <div className="text-xl font-bold font-mono text-purple-500">{groupCount}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] text-muted-foreground uppercase">{t('涉及卡牌', 'Cards')}</span>
          </div>
          <div className="text-xl font-bold font-mono text-blue-500">{sequentialCardCount}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[10px] text-muted-foreground uppercase">{t('套利组', 'Arb Groups')}</span>
          </div>
          <div className="text-xl font-bold font-mono text-green-500">{arbitrageGroups}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] text-muted-foreground uppercase">{t('总价值', 'Total Value')}</span>
          </div>
          <div className="text-xl font-bold font-mono text-foreground">${totalValue.toFixed(0)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase">{t('总 FMV', 'Total FMV')}</span>
          </div>
          <div className="text-xl font-bold font-mono text-primary">${totalFmv.toFixed(0)}</div>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('搜索卡组名称、评级公司、序列号...', 'Search set name, grading company, serial...')}
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-secondary dark:bg-white/[0.04] border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing || isScanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-secondary dark:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${(refreshing || isScanning) ? 'animate-spin' : ''}`} />
            {isScanning ? t('扫描中...', 'Scanning...') : t('重新扫描', 'Rescan')}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={companyFilter}
          onChange={e => { setCompanyFilter(e.target.value); setPage(0); }}
          className="px-3 py-1.5 rounded-lg text-[12px] bg-secondary dark:bg-white/[0.04] border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          <option value="all">{t('全部评级公司', 'All Companies')}</option>
          {filterOptions.companies.map(c => <option key={c} value={c}>{c}</option>)}
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
          value={String(minLength)}
          onChange={e => { setMinLength(Number(e.target.value)); setPage(0); }}
          className="px-3 py-1.5 rounded-lg text-[12px] bg-secondary dark:bg-white/[0.04] border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          <option value="2">{t('最少2连号', 'Min 2 Consecutive')}</option>
          <option value="3">{t('最少3连号', 'Min 3 Consecutive')}</option>
          <option value="4">{t('最少4连号', 'Min 4 Consecutive')}</option>
          <option value="5">{t('最少5连号', 'Min 5 Consecutive')}</option>
        </select>
      </div>

      {/* Sort + Count */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
          {[
            { key: 'length' as SortKey, label: t('连号长度', 'Length') },
            { key: 'totalValue' as SortKey, label: t('总价值', 'Value') },
            { key: 'totalFmv' as SortKey, label: 'FMV' },
            { key: 'spreadPct' as SortKey, label: t('价差', 'Spread') },
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
        <div className="text-xs text-muted-foreground">
          {t(
            `共 ${filteredGroups.length} 组连号 | 第 ${page + 1}/${totalPages || 1} 页`,
            `${filteredGroups.length} groups | Page ${page + 1}/${totalPages || 1}`
          )}
        </div>
      </div>

      {/* Pagination top */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1 mb-4">
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

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">{t('正在加载卡牌数据并扫描连号...', 'Loading cards and scanning for sequences...')}</p>
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

      {/* Groups Grid - Spread out cards layout like Arbitrage */}
      {!loading && !error && (
        <div className="space-y-8">
          {pagedGroups.map((group, gi) => {
            const totalSpread = group.cards.reduce((sum, c) => sum + c.spread, 0);
            const avgSpreadPct = group.cards.length > 0
              ? (group.cards.reduce((sum, c) => sum + c.spreadPct, 0) / group.cards.length)
              : 0;
            const isPositiveGroup = totalSpread > 0;

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(gi * 0.05, 0.3) }}
              >
                {/* Group Header */}
                <div className="glass-card p-4 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Link2 className="w-6 h-6 text-purple-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="badge-grade px-2 py-0.5 rounded-md text-[10px] font-bold">
                            {group.gradingCompany} {group.grade}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                            {group.length} {t('连号', 'Consecutive')}
                          </span>
                          {isPositiveGroup && (
                            <span className="badge-positive px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> {t('套利', 'Arb')}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-foreground mt-1">{group.setName}</h3>
                        <p className="text-xs text-muted-foreground">
                          Serial #{group.startSerial} → #{group.endSerial}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">{t('总价值', 'Total')}</div>
                        <div className="text-sm font-bold font-mono text-foreground">${group.totalValue.toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">FMV</div>
                        <div className="text-sm font-bold font-mono text-primary">${group.totalFmv.toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">{t('价差', 'Spread')}</div>
                        <div className={`text-sm font-bold font-mono ${isPositiveGroup ? 'text-green-500' : 'text-red-500'}`}>
                          {avgSpreadPct > 0 ? '+' : ''}{avgSpreadPct.toFixed(1)}%
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedGroup(group)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium btn-secondary hover:bg-secondary transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> {t('详情', 'Detail')}
                      </button>
                      <button
                        onClick={() => shareGroupToTwitter(group)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cards spread out in grid - like Arbitrage layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.cards.map((card, ci) => {
                    const isPositive = card.spread > 0;
                    return (
                      <motion.div
                        key={card.id}
                        className="glass-card overflow-hidden cursor-pointer group"
                        onClick={() => setSelectedGroup(group)}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(ci * 0.04, 0.2) }}
                      >
                        <div className="aspect-[4/5] bg-secondary dark:bg-[#111118] relative overflow-hidden">
                          <img
                            src={card.imgUrl}
                            alt={card.name}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute top-3 left-3 badge-grade px-2.5 py-1 rounded-lg text-xs font-bold">{card.grade}</div>
                          {/* Serial badge */}
                          <div className="absolute top-3 right-3 bg-purple-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg">
                            <Hash className="w-3 h-3" /> {card.serial}
                          </div>
                          {isPositive && (
                            <div className="absolute bottom-3 right-3 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                              <Sparkles className="w-3 h-3" /> {t('套利', 'Arb')}
                            </div>
                          )}
                          {!isPositive && card.price > 0 && (
                            <div className="absolute bottom-3 right-3 bg-red-500/80 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
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
                              <div className="text-[10px] text-muted-foreground">FMV</div>
                              <div className="text-xl font-bold font-mono text-muted-foreground">${card.fmv.toFixed(2)}</div>
                            </div>
                          </div>

                          {card.price > 0 && (
                            <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${isPositive ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                              <span className="text-xs text-muted-foreground">{t('利润', 'Profit')}</span>
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
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Link2 className="w-8 h-8 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">{t('未检测到连号卡牌', 'No consecutive serial numbers detected')}</p>
          <p className="text-xs text-muted-foreground/60">
            {t('尝试降低最小连号长度或更换筛选条件', 'Try lowering minimum length or changing filters')}
          </p>
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
          `数据来源: Renaiss Protocol (renaiss.xyz) | 共扫描 ${allCards.length} 张卡牌 | 检测到 ${groupCount} 组连号`,
          `Data: Renaiss Protocol (renaiss.xyz) | Scanned ${allCards.length} cards | Found ${groupCount} sequential groups`
        )}
      </div>
    </div>
  );
}
