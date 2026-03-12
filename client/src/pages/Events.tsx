/*
 * AOCN Events — Clean dual-theme timeline
 */
import { useLang } from '@/contexts/LanguageContext';
import { timelineEvents } from '@/lib/data';
import { ExternalLink, Twitter, Newspaper, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

function SourceIcon({ type }: { type: string }) {
  if (type === 'twitter') return <Twitter className="w-3 h-3" />;
  if (type === 'news') return <Newspaper className="w-3 h-3" />;
  return <Globe className="w-3 h-3" />;
}

export default function Events() {
  const { t } = useLang();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">{t('事件中心', 'Events Hub')}</h1>
        <p className="text-sm text-muted-foreground">
          {t(
            'Renaiss Protocol 完整里程碑时间线。所有信息均标注官方来源，确保100%真实。',
            'Complete Renaiss Protocol milestone timeline. All information sourced from official channels.'
          )}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

        <div className="space-y-3">
          {timelineEvents.map((evt, i) => {
            const isExpanded = expandedId === evt.id;
            return (
              <motion.div
                key={evt.id}
                className="relative pl-12"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Dot */}
                <div className={`absolute left-3 top-4 w-3 h-3 rounded-full border-2 ${
                  evt.hasSbt
                    ? 'bg-purple-500/30 border-purple-400'
                    : 'bg-primary/20 border-primary/50'
                }`} />

                <div
                  className="glass-card rounded-xl p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[11px] font-mono text-muted-foreground">{evt.date}</span>
                        <a
                          href={evt.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-secondary text-muted-foreground hover:text-primary border border-border transition-colors"
                        >
                          <SourceIcon type={evt.sourceType || evt.type} />
                          {evt.source}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        {evt.hasSbt && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/25">
                            SBT
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{t(evt.title, evt.titleEn)}</h3>
                    </div>
                    <div className="shrink-0 text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-border"
                    >
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        {t(evt.description, evt.descriptionEn)}
                      </p>
                      {evt.hasSbt && evt.sbtInfo && (
                        <div className="rounded-lg bg-purple-50 dark:bg-purple-500/[0.06] border border-purple-200 dark:border-purple-500/15 p-3">
                          <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400/70 mb-1">
                            {t('SBT 奖励', 'SBT Reward')}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {t(evt.sbtInfo, evt.sbtInfoEn || evt.sbtInfo)}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
