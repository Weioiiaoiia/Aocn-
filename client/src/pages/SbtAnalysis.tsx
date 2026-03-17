/*
 * AOCN SBT Analysis — Clean dual-theme
 */
import { useLang } from '@/contexts/LanguageContext';
import { sbtItems, sbtCatalog, timelineEvents } from '@/lib/data';
import { Shield, Award, Gift, Link2, ChevronRight, Search, Filter, CheckCircle, XCircle, AlertCircle, Sparkles, BarChart3, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';

const SBT_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663427415692/ByMrgW2BXPeym8jL7YKc6Z/sbt-crystal-fcr2LcqpLwjhQUAoPuMoSk.webp';

type FilterType = 'all' | 'available' | 'unavailable';
type CategoryType = 'all' | 'community' | 'gacha' | 'event' | 'trading' | 'social' | 'special';
type RarityType = 'all' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

const rarityLabels: Record<string, { zh: string; en: string; color: string }> = {
  all: { zh: '全部稀有度', en: 'All Rarity', color: '' },
  common: { zh: '普通', en: 'Common', color: 'text-gray-500' },
  uncommon: { zh: '稀有', en: 'Uncommon', color: 'text-green-500' },
  rare: { zh: '精良', en: 'Rare', color: 'text-blue-500' },
  epic: { zh: '史诗', en: 'Epic', color: 'text-purple-500' },
  legendary: { zh: '传说', en: 'Legendary', color: 'text-amber-500' },
};

function getRarityFromCategory(cat: string, available: boolean, label?: string): string {
  if (label === '⭕' || cat === 'special') return 'legendary';
  if (cat === 'event') return 'epic';
  if (cat === 'trading') return 'rare';
  if (cat === 'gacha') return 'uncommon';
  return 'common';
}

const categoryLabels: Record<string, { zh: string; en: string }> = {
  all: { zh: '全部', en: 'All' },
  community: { zh: '社区', en: 'Community' },
  gacha: { zh: '抽卡', en: 'Gacha' },
  event: { zh: '活动', en: 'Event' },
  trading: { zh: '交易', en: 'Trading' },
  social: { zh: '社交', en: 'Social' },
  special: { zh: '特殊', en: 'Special' },
};

function StatusBadge({ label }: { label: '✅' | '❌' | '⭕' }) {
  if (label === '✅') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
      <CheckCircle className="w-3 h-3" /> 可获取
    </span>
  );
  if (label === '⭕') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[10px] font-medium text-amber-600 dark:text-amber-400">
      <AlertCircle className="w-3 h-3" /> 特殊
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary border border-border text-[10px] font-medium text-muted-foreground">
      <XCircle className="w-3 h-3" /> 已结束
    </span>
  );
}

export default function SbtAnalysis() {
  const { t } = useLang();
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
  const [rarityFilter, setRarityFilter] = useState<RarityType>('all');
  const [viewMode, setViewMode] = useState<'catalog' | 'deep' | 'stats'>('catalog');
  const [selectedDeepId, setSelectedDeepId] = useState<string | null>(null);
  const selectedDeep = sbtItems.find(s => s.id === selectedDeepId);
  const selectedCatalog = sbtCatalog.find(s => s.id === selectedCatalogId);

  const filteredCatalog = useMemo(() => {
    return sbtCatalog.filter(sbt => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!sbt.name.toLowerCase().includes(q) && !sbt.nameEn.toLowerCase().includes(q)) return false;
      }
      if (filterType === 'available' && !sbt.available) return false;
      if (filterType === 'unavailable' && sbt.available) return false;
      if (categoryFilter !== 'all' && sbt.category !== categoryFilter) return false;
      if (rarityFilter !== 'all') {
        const rarity = getRarityFromCategory(sbt.category, sbt.available, sbt.availableLabel);
        if (rarity !== rarityFilter) return false;
      }
      return true;
    });
  }, [searchQuery, filterType, categoryFilter, rarityFilter]);

  // Stats for the chart view
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    sbtCatalog.forEach(sbt => {
      stats[sbt.category] = (stats[sbt.category] || 0) + 1;
    });
    return stats;
  }, []);

  const rarityStats = useMemo(() => {
    const stats: Record<string, number> = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    sbtCatalog.forEach(sbt => {
      const r = getRarityFromCategory(sbt.category, sbt.available, sbt.availableLabel);
      stats[r] = (stats[r] || 0) + 1;
    });
    return stats;
  }, []);

  const availableCount = sbtCatalog.filter(s => s.available).length;
  const totalCount = sbtCatalog.length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">{t('SBT 全景图鉴', 'SBT Complete Atlas')}</h1>
        <p className="text-sm text-muted-foreground">
          {t(
            `收录全部 ${totalCount} 个 Renaiss SBT，其中 ${availableCount} 个当前可获取。`,
            `Complete catalog of all ${totalCount} Renaiss SBTs, ${availableCount} currently available.`
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="stat-card text-center">
          <div className="text-2xl font-bold text-foreground font-mono">{totalCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{t('总 SBT 数', 'Total SBTs')}</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-bold text-emerald-500 font-mono">{availableCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{t('可获取', 'Available')}</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-2xl font-bold text-muted-foreground font-mono">{totalCount - availableCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{t('已结束/特殊', 'Ended/Special')}</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('catalog')}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${viewMode === 'catalog' ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'}`}
        >
          {t('完整目录', 'Full Catalog')} ({totalCount})
        </button>
        <button
          onClick={() => setViewMode('deep')}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${viewMode === 'deep' ? 'bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'}`}
        >
          {t('深度分析', 'Deep Analysis')} ({sbtItems.length})
        </button>
        <button
          onClick={() => setViewMode('stats')}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5 ${viewMode === 'stats' ? 'bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'}`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          {t('数据可视化', 'Data Viz')}
        </button>
      </div>

      {viewMode === 'catalog' ? (
        <div>
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('搜索 SBT 名称...', 'Search SBT name...')}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary dark:bg-white/[0.04] border border-border text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'available', 'unavailable'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${filterType === f ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'}`}
                >
                  {f === 'all' ? t('全部', 'All') : f === 'available' ? t('可获取', 'Available') : t('已结束', 'Ended')}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(Object.keys(categoryLabels) as CategoryType[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${categoryFilter === cat ? 'bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'}`}
              >
                {t(categoryLabels[cat].zh, categoryLabels[cat].en)}
              </button>
            ))}
          </div>

          {/* Rarity Filter */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Star className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
            {(Object.keys(rarityLabels) as RarityType[]).map(r => (
              <button
                key={r}
                onClick={() => setRarityFilter(r)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${rarityFilter === r ? 'bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'}`}
              >
                <span className={r !== 'all' ? rarityLabels[r].color : ''}>{t(rarityLabels[r].zh, rarityLabels[r].en)}</span>
              </button>
            ))}
          </div>

          {/* Catalog Grid */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="lg:w-96 shrink-0 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {filteredCatalog.map((sbt, i) => (
                <motion.div
                  key={sbt.id}
                  className={`glass-card rounded-xl p-3.5 cursor-pointer transition-all ${selectedCatalogId === sbt.id ? 'border-primary/25 bg-primary/[0.03]' : ''}`}
                  onClick={() => setSelectedCatalogId(sbt.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${sbt.available ? 'bg-emerald-50 dark:bg-emerald-500/10' : sbt.availableLabel === '⭕' ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-secondary'}`}>
                      <Shield className={`w-4 h-4 ${sbt.available ? 'text-emerald-500' : sbt.availableLabel === '⭕' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-medium text-foreground truncate">{t(sbt.name, sbt.nameEn)}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge label={(sbt.availableLabel || sbt.status) as '✅' | '❌' | '⭕'} />
                        <span className="text-[10px] text-muted-foreground">{t(categoryLabels[sbt.category].zh, categoryLabels[sbt.category].en)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                  </div>
                </motion.div>
              ))}
              {filteredCatalog.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">{t('没有匹配的 SBT', 'No matching SBTs')}</div>
              )}
            </div>

            {/* Detail Panel */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {selectedCatalog ? (
                  <motion.div
                    key={selectedCatalog.id}
                    className="glass-card rounded-xl p-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${selectedCatalog.available ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-secondary border border-border'}`}>
                        <Shield className={`w-8 h-8 ${selectedCatalog.available ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-lg font-bold text-foreground">{t(selectedCatalog.name, selectedCatalog.nameEn)}</h2>
                          <StatusBadge label={(selectedCatalog.availableLabel || selectedCatalog.status) as '✅' | '❌' | '⭕'} />
                        </div>
                        <p className="text-xs text-muted-foreground">{t(selectedCatalog.description, selectedCatalog.descriptionEn)}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className={`rounded-lg p-4 ${selectedCatalog.available ? 'bg-emerald-50 dark:bg-emerald-500/[0.04] border border-emerald-200 dark:border-emerald-500/10' : 'bg-secondary border border-border'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Award className={`w-4 h-4 ${selectedCatalog.available ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                          <h4 className="text-xs font-semibold text-foreground/70">{t('获取方式', 'How to Earn')}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t(selectedCatalog.howToGet || '', selectedCatalog.howToGetEn || '')}</p>
                      </div>

                      <div className="rounded-lg bg-secondary dark:bg-white/[0.02] border border-border p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Filter className="w-4 h-4 text-purple-500" />
                          <h4 className="text-xs font-semibold text-foreground/70">{t('分类', 'Category')}</h4>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-500/[0.08] border border-purple-200 dark:border-purple-500/15 text-xs text-purple-600 dark:text-purple-400">
                          {t(categoryLabels[selectedCatalog.category].zh, categoryLabels[selectedCatalog.category].en)}
                        </span>
                      </div>

                      {!selectedCatalog.available && (
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-500/[0.04] border border-amber-200 dark:border-amber-500/10 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400">{t('状态说明', 'Status Note')}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {selectedCatalog.availableLabel === '⭕'
                              ? t('此 SBT 为特殊身份认证，需要满足特定条件由官方审核授予。', 'This SBT is a special identity verification.')
                              : t('此 SBT 的获取活动已结束，目前无法获取。', 'The acquisition event for this SBT has ended.')
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div className="glass-card rounded-xl p-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/5 border border-border flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-primary/30" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('选择左侧的 SBT 查看详细信息', 'Select an SBT from the left to view details')}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : viewMode === 'stats' ? (
        /* Data Visualization View */
        <div className="space-y-6">
          {/* Category Distribution */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              {t('分类分布', 'Category Distribution')}
            </h3>
            <div className="space-y-3">
              {Object.entries(categoryStats).map(([cat, count]) => {
                const pct = Math.round((count / totalCount) * 100);
                const label = categoryLabels[cat] || { zh: cat, en: cat };
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{t(label.zh, label.en)}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rarity Distribution */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              {t('\u7a00\u6709\u5ea6\u5206\u5e03', 'Rarity Distribution')}
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(rarityStats).map(([rarity, count]) => {
                const label = rarityLabels[rarity];
                if (!label) return null;
                return (
                  <motion.div
                    key={rarity}
                    className="text-center glass-card rounded-xl p-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className={`text-2xl font-bold font-mono ${label.color || 'text-foreground'}`}>{count}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{t(label.zh, label.en)}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Availability Pie */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('\u53ef\u83b7\u53d6\u72b6\u6001', 'Availability Status')}</h3>
            <div className="flex items-center gap-8">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-secondary" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500" strokeDasharray={`${(availableCount / totalCount) * 100} ${100 - (availableCount / totalCount) * 100}`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-foreground">{Math.round((availableCount / totalCount) * 100)}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-foreground">{t('\u53ef\u83b7\u53d6', 'Available')}: {availableCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary border border-border" />
                  <span className="text-xs text-muted-foreground">{t('\u5df2\u7ed3\u675f/\u7279\u6b8a', 'Ended/Special')}: {totalCount - availableCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Deep Analysis View */
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-80 shrink-0 space-y-2">
            {sbtItems.map((sbt, i) => {
              const relatedEvent = timelineEvents.find(e => e.id === sbt.relatedEventId);
              return (
                <motion.div
                  key={sbt.id}
                  className={`glass-card rounded-xl p-3 cursor-pointer transition-all ${selectedDeepId === sbt.id ? 'border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/[0.04]' : ''}`}
                  onClick={() => setSelectedDeepId(sbt.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-medium text-foreground truncate">{t(sbt.name, sbt.nameEn)}</h3>
                      <p className="text-[10px] text-muted-foreground truncate">{relatedEvent ? relatedEvent.date : ''}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {selectedDeep ? (
                <motion.div
                  key={selectedDeep.id}
                  className="glass-card rounded-xl p-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <img src={SBT_IMG} alt="SBT" className="w-20 h-20 rounded-xl object-cover" />
                    <div>
                      <h2 className="text-lg font-bold text-foreground mb-1">{t(selectedDeep.name, selectedDeep.nameEn)}</h2>
                      <p className="text-xs text-muted-foreground">{t(selectedDeep.description, selectedDeep.descriptionEn)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-lg bg-secondary dark:bg-white/[0.02] border border-border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-primary" />
                        <h4 className="text-xs font-semibold text-foreground/70">{t('如何获得', 'How to Earn')}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t(selectedDeep.howToGet, selectedDeep.howToGetEn)}</p>
                    </div>

                    <div className="rounded-lg bg-purple-50 dark:bg-purple-500/[0.04] border border-purple-200 dark:border-purple-500/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-purple-500" />
                        <h4 className="text-xs font-semibold text-purple-600 dark:text-purple-400">{t('为什么颁发（深度分析）', 'Why Awarded (Deep Analysis)')}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t(selectedDeep.whyAwarded || '', selectedDeep.whyAwardedEn || '')}</p>
                    </div>

                    <div className="rounded-lg bg-secondary dark:bg-white/[0.02] border border-border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-semibold text-foreground/70">{t('持有权益', 'Holder Benefits')}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t(selectedDeep.benefits || '', selectedDeep.benefitsEn || '')}</p>
                    </div>

                    {(() => {
                      const relEvt = timelineEvents.find(e => e.id === selectedDeep.relatedEventId);
                      if (!relEvt) return null;
                      return (
                        <div className="rounded-lg bg-secondary dark:bg-white/[0.02] border border-border p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Link2 className="w-4 h-4 text-primary" />
                            <h4 className="text-xs font-semibold text-foreground/70">{t('关联事件', 'Related Event')}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-muted-foreground">{relEvt.date}</span>
                            <span className="text-xs text-foreground">{t(relEvt.title, relEvt.titleEn)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              ) : (
                <motion.div className="glass-card rounded-xl p-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <img src={SBT_IMG} alt="SBT" className="w-24 h-24 mx-auto rounded-xl mb-4 opacity-40" />
                  <p className="text-sm text-muted-foreground">{t('选择左侧的SBT查看深度分析', 'Select an SBT from the left to view deep analysis')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
