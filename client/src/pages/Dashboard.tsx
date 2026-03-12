/*
 * AOCN Dashboard — Ice Blue + Violet
 * Hero区域 + 新手引导入口 + 数据统计 + 精选套利 + 焦点事件
 */
import { useLang } from '@/contexts/LanguageContext';
import { ecosystemStats, arbitrageCards, timelineEvents } from '@/lib/data';
import { TrendingUp, Users, DollarSign, Layers, Calendar, ArrowRight, ExternalLink, Sparkles, BookOpen, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663427415692/ByMrgW2BXPeym8jL7YKc6Z/hero-bg-mJZBwTZJYPUCECtooN6XPo.webp';
const CARDS_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663427415692/ByMrgW2BXPeym8jL7YKc6Z/cards-showcase-3wXnbpjUoQJmKgKRgL65zu.webp';

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
  const topDeals = arbitrageCards.slice(0, 4);
  const recentEvents = timelineEvents.slice(-3).reverse();

  const stats = [
    { icon: Users, label: t('总用户', 'Total Users'), value: ecosystemStats.totalUsers, prefix: '', suffix: '+' },
    { icon: DollarSign, label: t('交易总额', 'Total Volume'), value: ecosystemStats.totalVolume, prefix: '$', suffix: '+' },
    { icon: Layers, label: t('链上藏品', 'On-chain Cards'), value: ecosystemStats.totalCards, prefix: '', suffix: '+' },
    { icon: TrendingUp, label: t('合作伙伴', 'Partners'), value: ecosystemStats.partners, prefix: '', suffix: '' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl mb-8" style={{ minHeight: '380px' }}>
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080810]/90 via-[#080810]/60 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 p-8 lg:p-12">
          <div className="flex-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-3xl lg:text-5xl font-bold leading-tight mb-4">
                {t('发现 ', 'Discover ')}
                <span className="text-gradient">{t('价值洼地', 'Value Gaps')}</span>
                <br />
                {t('智能套利分析', 'Smart Arbitrage')}
              </h1>
              <p className="text-white/45 text-sm lg:text-base max-w-lg mb-6 leading-relaxed">
                {t(
                  '实时监控 Renaiss Protocol 市场，自动识别低于市场价的卡片，为您提供专业的投资分析和入手建议。',
                  'Real-time monitoring of Renaiss Protocol marketplace, automatically identifying underpriced cards with professional investment analysis.'
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('arbitrage')}
                  className="btn-primary px-5 py-2.5 rounded-lg text-sm"
                >
                  {t('开始扫描', 'Start Scanning')} →
                </button>
                <button
                  onClick={() => onNavigate('beginner')}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium bg-ice/[0.08] text-ice/80 hover:bg-ice/[0.12] border border-ice/15 transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('新手入门', 'Beginner Guide')}
                </button>
              </div>
            </motion.div>
          </div>
          <div className="hidden lg:block w-80 shrink-0">
            <motion.img
              src={CARDS_IMG}
              alt="Collectible Cards"
              className="w-full rounded-xl opacity-70"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.7, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </div>
        </div>
      </section>

      {/* Quick Navigation Cards — 新手引导入口 */}
      <section className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Sparkles, title: t('新手专区', 'Beginner Zone'), desc: t('从零开始了解 Renaiss 生态', 'Learn Renaiss from scratch'), tab: 'beginner', gradient: 'from-ice/15 to-violet/10', border: 'border-ice/15', iconColor: 'text-ice' },
            { icon: Shield, title: t('SBT 图鉴', 'SBT Atlas'), desc: t('30+ SBT 完整收录与分析', '30+ SBTs fully cataloged'), tab: 'sbt', gradient: 'from-purple-500/15 to-violet/10', border: 'border-purple-500/15', iconColor: 'text-purple-400' },
            { icon: Zap, title: t('抽卡模拟', 'Gacha Simulator'), desc: t('模拟抽卡体验和概率分析', 'Simulate gacha experience'), tab: 'simulator', gradient: 'from-amber-500/15 to-orange-500/10', border: 'border-amber-500/15', iconColor: 'text-amber-400' },
            { icon: BookOpen, title: t('事件中心', 'Events Hub'), desc: t('追踪 Renaiss 最新动态', 'Track latest Renaiss updates'), tab: 'events', gradient: 'from-emerald-500/15 to-teal-500/10', border: 'border-emerald-500/15', iconColor: 'text-emerald-400' },
          ].map((item, i) => (
            <motion.button
              key={item.tab}
              onClick={() => onNavigate(item.tab)}
              className={`glass-card rounded-xl p-4 text-left group bg-gradient-to-br ${item.gradient} border ${item.border} hover:scale-[1.02] transition-all`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <item.icon className={`w-6 h-6 ${item.iconColor} mb-2 opacity-70 group-hover:opacity-100 transition-opacity`} />
              <h3 className="text-[14px] font-semibold text-white/80 mb-1">{item.title}</h3>
              <p className="text-[11px] text-white/35">{item.desc}</p>
              <div className="flex items-center gap-1 mt-2 text-[11px] text-white/25 group-hover:text-white/50 transition-colors">
                {t('进入', 'Enter')} <ArrowRight className="w-3 h-3" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass-card rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4 text-ice-dim" />
              <span className="text-[11px] text-white/30 uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-xl lg:text-2xl font-bold text-white/90 font-mono">
              <AnimatedNumber target={stat.value} prefix={stat.prefix} />{stat.suffix}
            </div>
          </motion.div>
        ))}
      </section>

      {/* Top Arbitrage Opportunities */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white/80">
            {t('热门套利机会', 'Top Arbitrage Opportunities')}
          </h2>
          <button
            onClick={() => onNavigate('arbitrage')}
            className="flex items-center gap-1 text-[12px] text-ice-dim hover:text-ice transition-colors"
          >
            {t('查看全部', 'View All')} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {topDeals.map((card, i) => (
            <motion.div
              key={card.id}
              className="glass-card rounded-xl overflow-hidden card-positive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <div className="aspect-square bg-black/20 relative overflow-hidden">
                <img
                  src={card.imgUrl}
                  alt={card.name}
                  className="w-full h-full object-contain p-3"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2 badge-ice px-2 py-0.5 rounded-full text-[10px] font-bold">
                  +{card.spreadPct}%
                </div>
                <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
                  <div className="live-dot" />
                  <span className="text-[8px] text-white/50">LIVE</span>
                </div>
              </div>
              <div className="p-3">
                <p className="text-[11px] text-white/55 line-clamp-2 mb-2 leading-relaxed">{card.name}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-white/25">{t('挂牌价', 'Listed')}</div>
                    <div className="text-sm font-mono font-semibold text-white/80">${card.price}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-white/25">FMV</div>
                    <div className="text-sm font-mono font-semibold text-ice">${card.fmv}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Events */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white/80">
            {t('最新动态', 'Recent Events')}
          </h2>
          <button
            onClick={() => onNavigate('events')}
            className="flex items-center gap-1 text-[12px] text-ice-dim hover:text-ice transition-colors"
          >
            {t('查看全部', 'View All')} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {recentEvents.map((evt, i) => (
            <motion.div
              key={evt.id}
              className="glass-card rounded-xl p-4 flex items-start gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-ice/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-ice-dim" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] text-white/30 font-mono">{evt.date}</span>
                  {evt.hasSbt && (
                    <span className="badge-violet px-1.5 py-0.5 rounded text-[9px] font-bold">SBT</span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-white/80 mb-1">{t(evt.title, evt.titleEn)}</h3>
                <p className="text-[11px] text-white/30 line-clamp-1">{t(evt.description, evt.descriptionEn)}</p>
              </div>
              <a
                href={evt.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 text-[10px] text-white/20 hover:text-ice transition-colors"
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
