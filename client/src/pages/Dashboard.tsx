/*
 * AOCN Dashboard — Clean light theme with live data
 */
import { useLang } from '@/contexts/LanguageContext';
import { ecosystemStats, timelineEvents, type Card } from '@/lib/data';
import { fetchCards } from '@/lib/api';
import { TrendingUp, Users, DollarSign, Layers, Calendar, ArrowRight, ExternalLink, Sparkles, BookOpen, Shield, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function AnimatedNumber({ target, prefix = '' }: { target: number; prefix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <span>{prefix}{val.toLocaleString()}</span>;
}

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useLang();
  const [topDeals, setTopDeals] = useState<Card[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [liveStats, setLiveStats] = useState(ecosystemStats);
  const recentEvents = timelineEvents.slice(-3).reverse();

  useEffect(() => {
    fetchCards({ offset: 0, limit: 4, sortBy: 'spreadPct', sortOrder: 'desc', listedOnly: true })
      .then(resp => {
        if (resp.cards && resp.cards.length > 0) {
          // Only show positive spread cards
          const positive = resp.cards.filter(c => c.spreadPct > 0);
          setTopDeals(positive.slice(0, 4));
        }
        if (resp.stats && resp.stats.totalCards > 0) {
          setLiveStats(prev => ({
            ...prev,
            totalCards: resp.stats.totalCards,
          }));
        }
      })
      .catch(err => {
        console.error('Dashboard fetch error:', err);
        // Silently fail - dashboard will show static data
      })
      .finally(() => setLoadingDeals(false));
  }, []);

  const stats = [
    { icon: Users, label: t('总用户', 'Total Users'), value: liveStats.totalUsers, prefix: '', suffix: '+', source: 'Phemex / KuCoin' },
    { icon: DollarSign, label: t('交易总额', 'Total Volume'), value: liveStats.totalVolume, prefix: '$', suffix: '+', source: 'BscScan' },
    { icon: Layers, label: t('链上藏品', 'On-chain NFTs'), value: liveStats.totalCards, prefix: '', suffix: '+', source: 'Renaiss' },
    { icon: TrendingUp, label: t('NFT持有者', 'NFT Holders'), value: liveStats.holders, prefix: '', suffix: '', source: 'BscScan' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-br from-secondary via-background to-secondary dark:from-[#0f0f1a] dark:via-[#0a0a0f] dark:to-[#0f0f1a]" style={{ minHeight: '360px' }}>
        <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 lg:py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-5">
              {t('发现 ', 'Discover ')}
              <span className="text-gradient">{t('价值洼地', 'Value Gaps')}</span>
              <br />
              {t('智能套利分析', 'Smart Arbitrage')}
            </h1>
            <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              {t(
                `实时监控 Renaiss Protocol 全部 ${liveStats.totalCards.toLocaleString()}+ 张卡牌，自动识别低于市场价的卡片，为您提供专业的投资分析和入手建议。`,
                `Real-time monitoring of all ${liveStats.totalCards.toLocaleString()}+ Renaiss cards, automatically identifying underpriced cards with professional investment analysis.`
              )}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => onNavigate('arbitrage')}
                className="btn-primary px-6 py-3 rounded-xl text-sm flex items-center gap-2"
              >
                {t('开始扫描', 'Start Scanning')} <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('beginner')}
                className="btn-secondary px-6 py-3 rounded-xl text-sm flex items-center gap-2"
              >
                {t('了解更多', 'Learn More')}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Sparkles, title: t('新手专区', 'Beginner Zone'), desc: t('从零开始了解 Renaiss 生态', 'Learn Renaiss from scratch'), tab: 'beginner', color: 'text-blue-500' },
            { icon: Shield, title: t('SBT 图鉴', 'SBT Atlas'), desc: t('SBT 完整收录与分析', 'SBTs fully cataloged'), tab: 'sbt', color: 'text-purple-500' },
            { icon: Zap, title: t('抽卡模拟', 'Gacha Simulator'), desc: t('模拟抽卡体验和概率分析', 'Simulate gacha experience'), tab: 'simulator', color: 'text-amber-500' },
            { icon: BookOpen, title: t('事件中心', 'Events Hub'), desc: t('追踪 Renaiss 最新动态', 'Track latest Renaiss updates'), tab: 'events', color: 'text-emerald-500' },
          ].map((item, i) => (
            <motion.button
              key={item.tab}
              onClick={() => onNavigate(item.tab)}
              className="glass-card p-5 text-left group hover:scale-[1.02] transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <item.icon className={`w-6 h-6 ${item.color} mb-3 opacity-80 group-hover:opacity-100 transition-opacity`} />
              <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                {t('进入', 'Enter')} <ArrowRight className="w-3 h-3" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-foreground font-mono">
              <AnimatedNumber target={stat.value} prefix={stat.prefix} />{stat.suffix}
            </div>
            <div className="text-[10px] text-muted-foreground/60 mt-1">{t('来源:', 'Source:')} {stat.source}</div>
          </motion.div>
        ))}
      </section>

      {/* Top Arbitrage Opportunities */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">
            {t('热门套利机会', 'Top Arbitrage Opportunities')}
          </h2>
          <button
            onClick={() => onNavigate('arbitrage')}
            className="flex items-center gap-1 text-sm text-primary hover:underline transition-colors"
          >
            {t('查看全部', 'View All')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loadingDeals ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">{t('加载中...', 'Loading...')}</span>
          </div>
        ) : topDeals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topDeals.map((card, i) => (
              <motion.div
                key={card.id}
                className="glass-card overflow-hidden group cursor-pointer"
                onClick={() => onNavigate('arbitrage')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <div className="aspect-square bg-secondary dark:bg-[#111118] relative overflow-hidden">
                  <img
                    src={card.imgUrl}
                    alt={card.name}
                    className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 badge-grade px-2 py-0.5 rounded-md text-[10px]">
                    {card.grade}
                  </div>
                  <div className="absolute top-2.5 right-2.5 badge-arb px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {t('套利', 'Arb')}
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 dark:bg-black/60 backdrop-blur-sm">
                    <div className="live-dot" />
                    <span className="text-[9px] text-muted-foreground">LIVE</span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium text-foreground line-clamp-2 mb-3 leading-relaxed">{card.name}</p>
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <div className="text-[10px] text-muted-foreground mb-0.5">{t('挂牌价', 'Listed')}</div>
                      <div className="text-lg font-bold font-mono text-foreground">${card.price.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground mb-0.5">{t('参考价', 'FMV')}</div>
                      <div className="text-lg font-bold font-mono text-muted-foreground">${card.fmv.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">{t('潜在利润', 'Profit')}</span>
                    <span className="text-sm font-bold text-green-500">
                      +{card.spreadPct}% (${card.spread.toFixed(2)})
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {t('暂无套利机会数据', 'No arbitrage data available yet')}
          </div>
        )}
      </section>

      {/* Recent Events */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">
            {t('最新动态', 'Recent Events')}
          </h2>
          <button
            onClick={() => onNavigate('events')}
            className="flex items-center gap-1 text-sm text-primary hover:underline transition-colors"
          >
            {t('查看全部', 'View All')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-3">
          {recentEvents.map((evt, i) => (
            <motion.div
              key={evt.id}
              className="glass-card p-4 flex items-start gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-mono">{evt.date}</span>
                  {evt.hasSbt && (
                    <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded text-[9px] font-bold">SBT</span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{t(evt.title, evt.titleEn)}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{t(evt.description, evt.descriptionEn)}</p>
              </div>
              <a
                href={evt.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                {evt.source} <ExternalLink className="w-3 h-3" />
              </a>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
