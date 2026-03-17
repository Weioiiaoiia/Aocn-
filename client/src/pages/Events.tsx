/*
 * AOCN Events — Real-time synced event center with live updates
 * Features: SSE connection, event type filtering, live indicator, auto-refresh
 */
import { useLang } from '@/contexts/LanguageContext';
import { timelineEvents } from '@/lib/data';
import { ExternalLink, Twitter, Newspaper, Globe, ChevronDown, ChevronUp, Wifi, WifiOff, RefreshCw, Filter, TrendingUp, Shield, Calendar, Zap, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { connectSSE, fetchEvents, type RealTimeEvent, type EventsResponse } from '@/lib/api';

function SourceIcon({ type }: { type: string }) {
  if (type === 'twitter') return <Twitter className="w-3 h-3" />;
  if (type === 'news') return <Newspaper className="w-3 h-3" />;
  return <Globe className="w-3 h-3" />;
}

type EventFilter = 'all' | 'sbt' | 'milestone' | 'partnership' | 'update';

interface LiveActivity {
  id: string;
  type: RealTimeEvent['type'];
  message: string;
  messageEn: string;
  timestamp: Date;
  cardName?: string;
  spreadPct?: number;
}

export default function Events() {
  const { t } = useLang();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [marketStats, setMarketStats] = useState<EventsResponse['stats'] | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Connect SSE for real-time events
  useEffect(() => {
    const handleEvent = (event: RealTimeEvent) => {
      const activity: LiveActivity = {
        id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: event.type,
        message: event.type === 'arbitrage_alert'
          ? `套利机会: ${event.cardName} — 价差 +${event.spreadPct?.toFixed(1)}%`
          : event.type === 'price_update'
          ? `价格更新: ${event.cardName} — $${event.price?.toFixed(2)}`
          : event.message || '新事件',
        messageEn: event.type === 'arbitrage_alert'
          ? `Arbitrage: ${event.cardName} — Spread +${event.spreadPct?.toFixed(1)}%`
          : event.type === 'price_update'
          ? `Price Update: ${event.cardName} — $${event.price?.toFixed(2)}`
          : event.message || 'New event',
        timestamp: new Date(event.timestamp || Date.now()),
        cardName: event.cardName,
        spreadPct: event.spreadPct,
      };

      setLiveActivities(prev => [activity, ...prev].slice(0, 50));
    };

    sseRef.current = connectSSE(
      handleEvent,
      () => setSseConnected(false)
    );

    if (sseRef.current) {
      sseRef.current.onopen = () => setSseConnected(true);
    }

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, []);

  // Periodic API polling as fallback
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const data = await fetchEvents();
        if (data.stats) setMarketStats(data.stats);
        setLastRefresh(new Date());
      } catch {
        // Silently fail — SSE is primary
      }
    };

    fetchLatest();
    refreshTimerRef.current = setInterval(fetchLatest, 15000);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, []);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchEvents();
      if (data.stats) setMarketStats(data.stats);
      setLastRefresh(new Date());
    } catch {
      // ignore
    }
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  // Filter timeline events
  const filteredEvents = useMemo(() => {
    return timelineEvents.filter(evt => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!evt.title.toLowerCase().includes(q) && !evt.titleEn.toLowerCase().includes(q) && !evt.description.toLowerCase().includes(q)) return false;
      }
      if (eventFilter === 'sbt' && !evt.hasSbt) return false;
      if (eventFilter === 'milestone' && evt.type !== 'milestone') return false;
      if (eventFilter === 'partnership' && evt.type !== 'partnership') return false;
      if (eventFilter === 'update' && evt.type !== 'update' && evt.type !== 'news') return false;
      return true;
    });
  }, [searchQuery, eventFilter]);

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return t('刚刚', 'Just now');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('分钟前', 'm ago')}`;
    return date.toLocaleTimeString();
  };

  const getActivityIcon = (type: RealTimeEvent['type']) => {
    switch (type) {
      case 'arbitrage_alert': return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
      case 'sbt_update': return <Shield className="w-3.5 h-3.5 text-purple-500" />;
      case 'price_update': return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Calendar className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const filterOptions: { id: EventFilter; zh: string; en: string }[] = [
    { id: 'all', zh: '全部', en: 'All' },
    { id: 'sbt', zh: 'SBT 相关', en: 'SBT' },
    { id: 'milestone', zh: '里程碑', en: 'Milestone' },
    { id: 'partnership', zh: '合作', en: 'Partnership' },
    { id: 'update', zh: '更新', en: 'Update' },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">{t('事件中心', 'Events Hub')}</h1>
          <div className="flex items-center gap-3">
            {/* Live Status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border ${
              sseConnected
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-secondary border-border text-muted-foreground'
            }`}>
              {sseConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {sseConnected ? t('实时连接', 'Live') : t('轮询中', 'Polling')}
            </div>

            {/* Refresh */}
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('刷新', 'Refresh')}
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {t(
            'Renaiss Protocol 完整里程碑时间线 + 实时市场动态。所有信息均标注官方来源。',
            'Complete Renaiss Protocol timeline + real-time market activity. All sourced from official channels.'
          )}
        </p>
        <div className="text-[10px] text-muted-foreground/60 mt-1">
          {t('上次更新:', 'Last update:')} {lastRefresh.toLocaleTimeString()}
          {marketStats && ` | ${t('总卡牌:', 'Cards:')} ${marketStats.totalCards} | ${t('套利:', 'Arb:')} ${marketStats.arbitrageCount}`}
        </div>
      </div>

      {/* Live Activity Feed */}
      {liveActivities.length > 0 && (
        <div className="glass-card rounded-xl p-4 mb-6">
          <h3 className="text-xs font-semibold text-foreground/70 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('实时动态', 'Live Activity')}
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {liveActivities.slice(0, 8).map((activity, i) => (
              <motion.div
                key={activity.id}
                className="flex items-center gap-2.5 py-1.5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                {getActivityIcon(activity.type)}
                <span className="text-xs text-foreground flex-1 truncate">
                  {t(activity.message, activity.messageEn)}
                </span>
                <span className="text-[10px] text-muted-foreground/60 shrink-0">
                  {formatTime(activity.timestamp)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('搜索事件...', 'Search events...')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary dark:bg-white/[0.04] border border-border text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          {filterOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setEventFilter(opt.id)}
              className={`px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                eventFilter === opt.id
                  ? 'bg-primary/10 border border-primary/20 text-primary'
                  : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(opt.zh, opt.en)}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-[11px] text-muted-foreground mb-3">
        {t(`显示 ${filteredEvents.length} / ${timelineEvents.length} 个事件`, `Showing ${filteredEvents.length} / ${timelineEvents.length} events`)}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

        <div className="space-y-3">
          {filteredEvents.map((evt, i) => {
            const isExpanded = expandedId === evt.id;
            return (
              <motion.div
                key={evt.id}
                className="relative pl-12"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.5) }}
              >
                {/* Dot */}
                <div className={`absolute left-3 top-4 w-3 h-3 rounded-full border-2 ${
                  evt.hasSbt
                    ? 'bg-purple-500/30 border-purple-400'
                    : 'bg-primary/20 border-primary/50'
                }`} />

                <div
                  className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/10 transition-all"
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

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border overflow-hidden"
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
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {t('没有匹配的事件', 'No matching events')}
          </div>
        )}
      </div>
    </div>
  );
}
