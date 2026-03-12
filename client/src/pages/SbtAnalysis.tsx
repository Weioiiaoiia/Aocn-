/*
 * Design: Obsidian Glass — SBT分析中心
 * SBT画廊 + 深度分析（为何获得、条件、权益）
 */
import { useLang } from '@/contexts/LanguageContext';
import { sbtItems, timelineEvents } from '@/lib/data';
import { Shield, Award, Gift, Link2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const SBT_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663427415692/ByMrgW2BXPeym8jL7YKc6Z/sbt-crystal-fcr2LcqpLwjhQUAoPuMoSk.webp';

export default function SbtAnalysis() {
  const { t } = useLang();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = sbtItems.find(s => s.id === selectedId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white/90 mb-2">{t('Soulbound Ledger', 'Soulbound Ledger')}</h1>
        <p className="text-sm text-white/40">
          {t(
            '深度分析每一个Renaiss SBT：为什么颁发、如何获得、持有权益。所有分析基于官方公开信息。',
            'In-depth analysis of every Renaiss SBT: why it was issued, how to earn it, and holder benefits. All analysis based on official public information.'
          )}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* SBT Gallery */}
        <div className="lg:w-80 shrink-0 space-y-2">
          {sbtItems.map((sbt, i) => {
            const relatedEvent = timelineEvents.find(e => e.id === sbt.relatedEventId);
            return (
              <motion.div
                key={sbt.id}
                className={`glass-card rounded-xl p-3 cursor-pointer transition-all ${
                  selectedId === sbt.id ? 'border-purple-500/30 bg-purple-500/[0.04]' : ''
                }`}
                onClick={() => setSelectedId(sbt.id)}
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
                    <p className="text-[10px] text-white/30 truncate">
                      {relatedEvent ? relatedEvent.date : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/15 shrink-0" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                className="glass-card rounded-xl p-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <img src={SBT_IMG} alt="SBT" className="w-20 h-20 rounded-xl object-cover" />
                  <div>
                    <h2 className="text-lg font-bold text-white/85 mb-1">{t(selected.name, selected.nameEn)}</h2>
                    <p className="text-[12px] text-white/40">{t(selected.description, selected.descriptionEn)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* How to get */}
                  <div className="rounded-lg bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-emerald-400/60" />
                      <h4 className="text-[12px] font-semibold text-white/60">{t('如何获得', 'How to Earn')}</h4>
                    </div>
                    <p className="text-[12px] text-white/40 leading-relaxed">{t(selected.howToGet, selected.howToGetEn)}</p>
                  </div>

                  {/* Why awarded - deep analysis */}
                  <div className="rounded-lg bg-purple-500/[0.04] border border-purple-500/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-purple-400/60" />
                      <h4 className="text-[12px] font-semibold text-purple-400/70">{t('为什么颁发（深度分析）', 'Why Awarded (Deep Analysis)')}</h4>
                    </div>
                    <p className="text-[12px] text-white/45 leading-relaxed">{t(selected.whyAwarded, selected.whyAwardedEn)}</p>
                  </div>

                  {/* Benefits */}
                  <div className="rounded-lg bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-4 h-4 text-amber-400/60" />
                      <h4 className="text-[12px] font-semibold text-white/60">{t('持有权益', 'Holder Benefits')}</h4>
                    </div>
                    <p className="text-[12px] text-white/40 leading-relaxed">{t(selected.benefits, selected.benefitsEn)}</p>
                  </div>

                  {/* Related event */}
                  {(() => {
                    const relEvt = timelineEvents.find(e => e.id === selected.relatedEventId);
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
              <motion.div
                className="glass-card rounded-xl p-12 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <img src={SBT_IMG} alt="SBT" className="w-24 h-24 mx-auto rounded-xl mb-4 opacity-40" />
                <p className="text-sm text-white/30">{t('选择左侧的SBT查看详细分析', 'Select an SBT from the left to view detailed analysis')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
