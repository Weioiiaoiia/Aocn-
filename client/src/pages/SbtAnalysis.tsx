/*
 * AOCN SBT Analysis — Ice Blue + Violet
 * 完整 SBT 目录（30+）+ 深度分析 + 筛选 + 分类
 */
import { useLang } from '@/contexts/LanguageContext';
import { sbtItems, sbtCatalog, timelineEvents, type SbtCatalogItem } from '@/lib/data';
import { Shield, Award, Gift, Link2, ChevronRight, Search, Filter, CheckCircle, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';

const SBT_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663427415692/ByMrgW2BXPeym8jL7YKc6Z/sbt-crystal-fcr2LcqpLwjhQUAoPuMoSk.webp';

type FilterType = 'all' | 'available' | 'unavailable';
type CategoryType = 'all' | 'community' | 'gacha' | 'event' | 'trading' | 'social' | 'special';

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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">
      <CheckCircle className="w-3 h-3" /> 可获取
    </span>
  );
  if (label === '⭕') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-medium text-amber-400">
      <AlertCircle className="w-3 h-3" /> 特殊
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] font-medium text-white/30">
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
  const [viewMode, setViewMode] = useState<'catalog' | 'deep'>('catalog');

  // Deep analysis state
  const [selectedDeepId, setSelectedDeepId] = useState<string | null>(null);
  const selectedDeep = sbtItems.find(s => s.id === selectedDeepId);

  const selectedCatalog = sbtCatalog.find(s => s.id === selectedCatalogId);

  const filteredCatalog = useMemo(() => {
    return sbtCatalog.filter(sbt => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!sbt.name.toLowerCase().includes(q) && !sbt.nameEn.toLowerCase().includes(q)) return false;
      }
      // Availability filter
      if (filterType === 'available' && !sbt.available) return false;
      if (filterType === 'unavailable' && sbt.available) return false;
      // Category filter
      if (categoryFilter !== 'all' && sbt.category !== categoryFilter) return false;
      return true;
    });
  }, [searchQuery, filterType, categoryFilter]);

  const availableCount = sbtCatalog.filter(s => s.available).length;
  const totalCount = sbtCatalog.length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-ice" />
          <span className="text-[11px] text-white/30 uppercase tracking-widest">Soulbound Tokens</span>
        </div>
        <h1 className="text-2xl font-bold text-white/90 mb-2">{t('SBT 全景图鉴', 'SBT Complete Atlas')}</h1>
        <p className="text-sm text-white/40">
          {t(
            `收录全部 ${totalCount} 个 Renaiss SBT，其中 ${availableCount} 个当前可获取。深度分析每一个SBT的获取方式、颁发原因和持有权益。`,
            `Complete catalog of all ${totalCount} Renaiss SBTs, ${availableCount} currently available. In-depth analysis of each SBT's acquisition method, award reason, and holder benefits.`
          )}
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white/90 font-mono">{totalCount}</div>
          <div className="text-[11px] text-white/30 mt-1">{t('总 SBT 数', 'Total SBTs')}</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400 font-mono">{availableCount}</div>
          <div className="text-[11px] text-white/30 mt-1">{t('可获取', 'Available')}</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white/40 font-mono">{totalCount - availableCount}</div>
          <div className="text-[11px] text-white/30 mt-1">{t('已结束/特殊', 'Ended/Special')}</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('catalog')}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${viewMode === 'catalog' ? 'bg-gradient-to-r from-ice/15 to-violet/10 border border-ice/20 text-white/90' : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60'}`}
        >
          {t('完整目录', 'Full Catalog')} ({totalCount})
        </button>
        <button
          onClick={() => setViewMode('deep')}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${viewMode === 'deep' ? 'bg-gradient-to-r from-violet/15 to-ice/10 border border-violet/20 text-white/90' : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60'}`}
        >
          {t('深度分析', 'Deep Analysis')} ({sbtItems.length})
        </button>
      </div>

      {viewMode === 'catalog' ? (
        /* ─── Catalog View ─── */
        <div>
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('搜索 SBT 名称...', 'Search SBT name...')}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-ice/30 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'available', 'unavailable'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${filterType === f ? 'bg-ice/10 border border-ice/20 text-ice' : 'bg-white/[0.03] border border-white/[0.06] text-white/35 hover:text-white/55'}`}
                >
                  {f === 'all' ? t('全部', 'All') : f === 'available' ? t('可获取', 'Available') : t('已结束', 'Ended')}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(Object.keys(categoryLabels) as CategoryType[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${categoryFilter === cat ? 'bg-violet/10 border border-violet/20 text-violet' : 'bg-white/[0.02] border border-white/[0.04] text-white/25 hover:text-white/45'}`}
              >
                {t(categoryLabels[cat].zh, categoryLabels[cat].en)}
              </button>
            ))}
          </div>

          {/* Catalog Grid */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="lg:w-96 shrink-0 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {filteredCatalog.map((sbt, i) => (
                <motion.div
                  key={sbt.id}
                  className={`glass-card rounded-xl p-3.5 cursor-pointer transition-all ${selectedCatalogId === sbt.id ? 'border-ice/25 bg-ice/[0.03]' : ''}`}
                  onClick={() => setSelectedCatalogId(sbt.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${sbt.available ? 'bg-emerald-500/10' : sbt.availableLabel === '⭕' ? 'bg-amber-500/10' : 'bg-white/[0.04]'}`}>
                      <Shield className={`w-4.5 h-4.5 ${sbt.available ? 'text-emerald-400/60' : sbt.availableLabel === '⭕' ? 'text-amber-400/60' : 'text-white/20'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[13px] font-medium text-white/75 truncate">{t(sbt.name, sbt.nameEn)}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge label={sbt.availableLabel} />
                        <span className="text-[10px] text-white/20">{t(categoryLabels[sbt.category].zh, categoryLabels[sbt.category].en)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/10 shrink-0" />
                  </div>
                </motion.div>
              ))}
              {filteredCatalog.length === 0 && (
                <div className="text-center py-8 text-white/20 text-sm">{t('没有匹配的 SBT', 'No matching SBTs')}</div>
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
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${selectedCatalog.available ? 'bg-gradient-to-br from-emerald-500/15 to-ice/10 border border-emerald-500/20' : 'bg-white/[0.04] border border-white/[0.08]'}`}>
                        <Shield className={`w-8 h-8 ${selectedCatalog.available ? 'text-emerald-400/60' : 'text-white/20'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-lg font-bold text-white/85">{t(selectedCatalog.name, selectedCatalog.nameEn)}</h2>
                          <StatusBadge label={selectedCatalog.availableLabel} />
                        </div>
                        <p className="text-[12px] text-white/40">{t(selectedCatalog.description, selectedCatalog.descriptionEn)}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* How to get */}
                      <div className={`rounded-lg p-4 ${selectedCatalog.available ? 'bg-emerald-500/[0.04] border border-emerald-500/10' : 'bg-white/[0.02] border border-white/[0.04]'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Award className={`w-4 h-4 ${selectedCatalog.available ? 'text-emerald-400/60' : 'text-white/30'}`} />
                          <h4 className="text-[12px] font-semibold text-white/60">{t('获取方式', 'How to Earn')}</h4>
                        </div>
                        <p className="text-[12px] text-white/45 leading-relaxed">{t(selectedCatalog.howToGet, selectedCatalog.howToGetEn)}</p>
                      </div>

                      {/* Category */}
                      <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Filter className="w-4 h-4 text-violet/50" />
                          <h4 className="text-[12px] font-semibold text-white/60">{t('分类', 'Category')}</h4>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet/[0.08] border border-violet/15 text-[12px] text-violet/80">
                          {t(categoryLabels[selectedCatalog.category].zh, categoryLabels[selectedCatalog.category].en)}
                        </span>
                      </div>

                      {/* Status info */}
                      {!selectedCatalog.available && (
                        <div className="rounded-lg bg-amber-500/[0.04] border border-amber-500/10 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-amber-400/60" />
                            <h4 className="text-[12px] font-semibold text-amber-400/70">{t('状态说明', 'Status Note')}</h4>
                          </div>
                          <p className="text-[12px] text-white/40 leading-relaxed">
                            {selectedCatalog.availableLabel === '⭕'
                              ? t('此 SBT 为特殊身份认证，需要满足特定条件由官方审核授予。', 'This SBT is a special identity verification, requiring specific conditions and official review.')
                              : t('此 SBT 的获取活动已结束，目前无法获取。请关注官方公告了解类似活动。', 'The acquisition event for this SBT has ended. Please follow official announcements for similar events.')
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div className="glass-card rounded-xl p-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-ice/10 to-violet/10 border border-white/[0.06] flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-ice/30" />
                    </div>
                    <p className="text-sm text-white/30">{t('选择左侧的 SBT 查看详细信息', 'Select an SBT from the left to view details')}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Deep Analysis View ─── */
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-80 shrink-0 space-y-2">
            {sbtItems.map((sbt, i) => {
              const relatedEvent = timelineEvents.find(e => e.id === sbt.relatedEventId);
              return (
                <motion.div
                  key={sbt.id}
                  className={`glass-card rounded-xl p-3 cursor-pointer transition-all ${selectedDeepId === sbt.id ? 'border-purple-500/30 bg-purple-500/[0.04]' : ''}`}
                  onClick={() => setSelectedDeepId(sbt.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-purple-400/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-medium text-white/75 truncate">{t(sbt.name, sbt.nameEn)}</h3>
                      <p className="text-[10px] text-white/30 truncate">{relatedEvent ? relatedEvent.date : ''}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/15 shrink-0" />
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
                      <h2 className="text-lg font-bold text-white/85 mb-1">{t(selectedDeep.name, selectedDeep.nameEn)}</h2>
                      <p className="text-[12px] text-white/40">{t(selectedDeep.description, selectedDeep.descriptionEn)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-lg bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-ice-dim" />
                        <h4 className="text-[12px] font-semibold text-white/60">{t('如何获得', 'How to Earn')}</h4>
                      </div>
                      <p className="text-[12px] text-white/40 leading-relaxed">{t(selectedDeep.howToGet, selectedDeep.howToGetEn)}</p>
                    </div>

                    <div className="rounded-lg bg-purple-500/[0.04] border border-purple-500/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-purple-400/60" />
                        <h4 className="text-[12px] font-semibold text-purple-400/70">{t('为什么颁发（深度分析）', 'Why Awarded (Deep Analysis)')}</h4>
                      </div>
                      <p className="text-[12px] text-white/45 leading-relaxed">{t(selectedDeep.whyAwarded, selectedDeep.whyAwardedEn)}</p>
                    </div>

                    <div className="rounded-lg bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-4 h-4 text-amber-400/60" />
                        <h4 className="text-[12px] font-semibold text-white/60">{t('持有权益', 'Holder Benefits')}</h4>
                      </div>
                      <p className="text-[12px] text-white/40 leading-relaxed">{t(selectedDeep.benefits, selectedDeep.benefitsEn)}</p>
                    </div>

                    {(() => {
                      const relEvt = timelineEvents.find(e => e.id === selectedDeep.relatedEventId);
                      if (!relEvt) return null;
                      return (
                        <div className="rounded-lg bg-white/[0.02] p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Link2 className="w-4 h-4 text-blue-400/60" />
                            <h4 className="text-[12px] font-semibold text-white/60">{t('关联事件', 'Related Event')}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-white/30">{relEvt.date}</span>
                            <span className="text-[12px] text-white/50">{t(relEvt.title, relEvt.titleEn)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              ) : (
                <motion.div className="glass-card rounded-xl p-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <img src={SBT_IMG} alt="SBT" className="w-24 h-24 mx-auto rounded-xl mb-4 opacity-40" />
                  <p className="text-sm text-white/30">{t('选择左侧的SBT查看深度分析', 'Select an SBT from the left to view deep analysis')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
