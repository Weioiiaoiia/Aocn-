/*
 * AOCN Beginner Guide — Clean dual-theme
 */
import { useLang } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Sparkles, BookOpen, Wallet, CreditCard, ShoppingCart,
  Trophy, Star, TrendingUp, ChevronRight,
  ExternalLink, Shield, Gem, Zap, Target, Info,
  CheckCircle, Clock, Users
} from 'lucide-react';

const sections = [
  { id: 'intro', icon: Sparkles, zh: '项目介绍', en: 'About Renaiss' },
  { id: 'howto', icon: BookOpen, zh: '如何参与', en: 'How to Join' },
  { id: 'gacha', icon: Zap, zh: '抽卡指南', en: 'Gacha Guide' },
  { id: 'market', icon: ShoppingCart, zh: '市场交易', en: 'Marketplace' },
  { id: 'tcg', icon: Gem, zh: 'TCG 知识', en: 'TCG Knowledge' },
  { id: 'rarity', icon: Star, zh: '卡牌稀有度', en: 'Card Rarity' },
  { id: 'grading', icon: Shield, zh: '评级机构', en: 'Grading' },
  { id: 'buying', icon: Target, zh: '购卡指南', en: 'Buying Guide' },
  { id: 'trends', icon: TrendingUp, zh: '趋势更新', en: 'Trends' },
];

function StepCard({ step, title, children, delay = 0 }: { step: number; title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div className="relative pl-12 pb-8 last:pb-0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.4 }}>
      <div className="absolute left-[18px] top-10 bottom-0 w-px bg-gradient-to-b from-primary/30 to-transparent" />
      <div className="absolute left-0 top-0 w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span className="text-xs font-bold text-primary">{step}</span>
      </div>
      <div className="glass-card rounded-xl p-5">
        <h4 className="text-[15px] font-semibold text-foreground mb-3">{title}</h4>
        <div className="text-[13px] text-muted-foreground leading-relaxed space-y-2">{children}</div>
      </div>
    </motion.div>
  );
}

function InfoBox({ type = 'info', children }: { type?: 'info' | 'tip' | 'warning'; children: React.ReactNode }) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-500/[0.06] border-blue-200 dark:border-blue-500/15 text-blue-600 dark:text-blue-400',
    tip: 'bg-emerald-50 dark:bg-emerald-500/[0.06] border-emerald-200 dark:border-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-50 dark:bg-amber-500/[0.06] border-amber-200 dark:border-amber-500/15 text-amber-600 dark:text-amber-400',
  };
  const icons = { info: Info, tip: CheckCircle, warning: Clock };
  const Icon = icons[type];
  return (
    <div className={`flex gap-3 rounded-lg border p-3 mt-3 ${styles[type]}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="text-[12px] leading-relaxed">{children}</div>
    </div>
  );
}

const rarityData = [
  { code: 'RR', name: 'Double Rare', zh: '常见的高强度或人气卡，局部闪或全卡基础闪膜，工艺相对简单，流通量大', en: 'Common high-power or popular cards with partial or full basic holo', color: 'text-blue-500' },
  { code: 'AR', name: 'Art Rare', zh: '以插画表现为核心，细腻印刷与局部光泽处理突出画面完成度', en: 'Art-focused with delicate printing and partial gloss treatment', color: 'text-teal-500' },
  { code: 'SR', name: 'Super Rare', zh: '抽取难度明显提高，全卡闪膜或纹理压印工艺，收藏属性开始明显提升', en: 'Notably harder to pull, full holo or textured embossing', color: 'text-purple-500' },
  { code: 'SRA', name: 'Super Rare Alt Art', zh: 'SR的特殊插画版本，同级工艺但搭配限定构图与演出设计，数量更少', en: 'Special illustration version of SR with limited composition', color: 'text-pink-500' },
  { code: 'UR', name: 'Ultra Rare', zh: '通常为全卡闪+金边/金线设计，工艺辨识度高，官方定位偏收藏级', en: 'Full holo + gold border/line design, collector-grade', color: 'text-amber-500' },
  { code: 'MUR', name: 'Master Ultra Rare', zh: '顶级稀有度之一，采用多层闪膜、金属质感或复杂压纹工艺，发行量极低', en: 'Top rarity with multi-layer holo, extremely low print run', color: 'text-rose-500' },
];

const gradingData = [
  { name: 'PSA', full: 'Professional Sports Authenticator', zh: '市场认可度最高，PSA 10是收藏级卡牌的行业共识，流通性最好', en: 'Highest market recognition, PSA 10 is industry standard', highlight: true },
  { name: 'BGS', full: 'Beckett Grading Services', zh: '评级标准严格，细分卡况评分，顶级评分含金量极高', en: 'Strict grading standards, sub-grade scoring, top grades extremely valuable', highlight: false },
  { name: 'CGC', full: 'Certified Guaranty Company', zh: '近年发展迅速，性价比高，适合新卡与批量送评', en: 'Rapidly growing, cost-effective, suitable for new cards', highlight: false },
  { name: 'ARS', full: 'Arita Rating System (Japan)', zh: '以日系审美和整体观感为核心，更受日文卡收藏者青睐', en: 'Japan-focused aesthetics, preferred by Japanese card collectors', highlight: false },
];

export default function BeginnerGuide() {
  const { t } = useLang();
  const [activeSection, setActiveSection] = useState('intro');

  const renderSection = () => {
    switch (activeSection) {
      case 'intro': return <IntroSection />;
      case 'howto': return <HowToSection />;
      case 'gacha': return <GachaSection />;
      case 'market': return <MarketSection />;
      case 'tcg': return <TcgSection />;
      case 'rarity': return <RaritySection />;
      case 'grading': return <GradingSection />;
      case 'buying': return <BuyingSection />;
      case 'trends': return <TrendsSection />;
      default: return <IntroSection />;
    }
  };

  function IntroSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="intro">
        <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border border-border">
          <div className="relative p-8 lg:p-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] text-primary uppercase tracking-widest font-medium">Renaiss Protocol</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 leading-tight">{t('收藏品金融网络', 'The Collectible Financial Network')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-6">
                {t('Renaiss（@renaissxyz）是一个基于 BNB Chain 的 RWA 基础设施项目，专注于将实体收藏品（如 TCG 卡牌）转化为链上可验证、可赎回的 NFT 资产。它不仅是抽卡+交易平台，而是构建收藏品金融网络，支持链上定价（FMV）、托管、赎回、借贷等功能。', 'Renaiss is a BNB Chain-based RWA infrastructure project that converts physical collectibles into verifiable, redeemable on-chain NFT assets.')}
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="https://www.renaiss.xyz" target="_blank" rel="noopener noreferrer" className="btn-primary px-5 py-2.5 rounded-lg text-sm flex items-center gap-2">
                  {t('访问官网', 'Visit Website')} <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a href="https://discord.com/invite/renaiss" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-accent border border-border transition-colors flex items-center gap-2">
                  {t('加入 Discord', 'Join Discord')} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { icon: Shield, title: t('链上验证', 'On-chain Verification'), desc: t('通过预言机实时定价+链上结算，实现透明交易', 'Real-time oracle pricing + on-chain settlement') },
            { icon: Gem, title: t('实物赎回', 'Physical Redemption'), desc: t('NFT 可赎回实体卡牌，二月已开放 Alpha 阶段', 'NFTs redeemable for physical cards') },
            { icon: TrendingUp, title: t('金融功能', 'Financial Features'), desc: t('支持 FMV 定价、托管、借贷等功能', 'FMV pricing, custody, lending') },
          ].map((feat, i) => (
            <motion.div key={i} className="glass-card rounded-xl p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
              <feat.icon className="w-8 h-8 text-primary/50 mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-2">{feat.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="glass-card rounded-xl p-6">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" /> {t('主要玩法', 'Core Gameplay')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-secondary dark:bg-white/[0.02] p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <h4 className="text-[13px] font-medium text-foreground">{t('Gacha 抽卡', 'Gacha')}</h4>
              </div>
              <p className="text-xs text-muted-foreground">{t('通过 USDT 进行 Gacha 抽卡，获得真实 PSA 评级卡牌的 NFT 资产', 'Use USDT for Gacha pulls to obtain NFT assets of real PSA-graded cards')}</p>
            </div>
            <div className="rounded-lg bg-secondary dark:bg-white/[0.02] p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-purple-500" />
                </div>
                <h4 className="text-[13px] font-medium text-foreground">{t('Marketplace 交易', 'Marketplace')}</h4>
              </div>
              <p className="text-xs text-muted-foreground">{t('在官方市场中买卖卡牌，低买高卖赚取差价', 'Buy and sell cards on the official marketplace')}</p>
            </div>
          </div>
          <InfoBox type="tip">
            {t('拥有卡牌后可以放入市场赚取差价，或进行实体卡牌的 Redeem（赎回）。', 'After owning cards, list them for profit or redeem physical cards.')}
          </InfoBox>
        </div>
      </motion.div>
    );
  }

  function HowToSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="howto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{t('如何参与 Renaiss', 'How to Join Renaiss')}</h2>
          <p className="text-[13px] text-muted-foreground">{t('按照以下步骤，从零开始参与 Renaiss 生态', 'Follow these steps to join from scratch')}</p>
        </div>
        <StepCard step={1} title={t('注册 / 登录', 'Register / Login')} delay={0}>
          <p>{t('访问官网 renaiss.xyz，点击 "Log in" 登录，连接钱包（支持 BNB Chain/BSC）。新用户建议同时绑定 X 和 Discord 账号，即可免费领取 SBT。', 'Visit renaiss.xyz, click "Log in", connect wallet (BNB Chain/BSC). Link X and Discord for free SBTs.')}</p>
          <InfoBox type="tip">{t('绑定社交账号是获取免费 SBT 的最简单方式！', 'Linking social accounts is the easiest way to get free SBTs!')}</InfoBox>
        </StepCard>
        <StepCard step={2} title={t('充值', 'Top Up')} delay={0.1}>
          <p>{t('准备 BSC 链钱包：转入至少 0.001 BNB（Gas 费）+ 60 USDT。在官网连接钱包后，Approve USDT 授权，然后 Top Up。', 'Prepare BSC wallet: at least 0.001 BNB (Gas) + 60 USDT. Connect wallet, approve USDT, then Top Up.')}</p>
          <InfoBox type="info">{t('首次充值 60U 以上可直接解锁 Fund Your Account SBT', 'First deposit of 60U+ unlocks Fund Your Account SBT')}</InfoBox>
        </StepCard>
        <StepCard step={3} title={t('抽卡', 'Pull Cards')} delay={0.2}>
          <p>{t('去 Gacha 页面，查看当前限时卡池，每个包 48~88 USDT。开包后 10 分钟内可享 85%~90% FMV 回购托底。', 'Go to Gacha page, check pools (48~88 USDT). 10-min 85%~90% FMV buyback guarantee.')}</p>
          <InfoBox type="tip">{t('抽卡 5 次以上，可领取 Pack Opener 成就 SBT！', 'Pull 5+ times to earn Pack Opener SBT!')}</InfoBox>
        </StepCard>
        <StepCard step={4} title={t('市场交易', 'Market Trading')} delay={0.3}>
          <p>{t('进入 Marketplace，低 FMV 捡漏买入，挂单高卖，或直接 Bid 出价。', 'Enter Marketplace, buy below FMV, list high, or Bid directly.')}</p>
        </StepCard>
        <StepCard step={5} title={t('收集 SBT', 'Collect SBTs')} delay={0.4}>
          <p>{t('深度参与生态：加入 Discord、参与 AMA、发推互动，可拿限时 SBT。', 'Deep participation: join Discord, AMAs, interact on X for limited SBTs.')}</p>
          <InfoBox type="info">{t('SBT 是灵魂绑定代币，不可转让，代表你在生态中的真实贡献', 'SBTs are non-transferable, representing your real contribution')}</InfoBox>
        </StepCard>
      </motion.div>
    );
  }

  function GachaSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="gacha">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{t('抽卡指南 | 无限卡池', 'Gacha Guide')}</h2>
          <p className="text-[13px] text-muted-foreground">{t('了解 Renaiss 的抽卡机制和策略', 'Understand gacha mechanics and strategies')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="glass-card rounded-xl p-5 border-l-4 border-l-primary">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><CreditCard className="w-4 h-4 text-primary" /></div>
              <div><h3 className="text-sm font-semibold text-foreground">OMEGA Pack</h3><span className="text-[11px] text-primary">$48 USDT</span></div>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>S Tier (0.24%)</span><span className="text-amber-500">~$300</span></div>
              <div className="flex justify-between"><span>A Tier (4.85%)</span><span className="text-purple-500">~$120</span></div>
              <div className="flex justify-between"><span>B Tier (16.09%)</span><span className="text-blue-500">~$65</span></div>
              <div className="flex justify-between"><span>C Tier (78.82%)</span><span className="text-muted-foreground">~$40</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{t('期望值', 'EV')}</span>
              <span className="text-[13px] font-semibold text-emerald-500">EV $52.32 (+9%)</span>
            </div>
          </div>
          <div className="glass-card rounded-xl p-5 border-l-4 border-l-purple-500">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center"><CreditCard className="w-4 h-4 text-purple-500" /></div>
              <div><h3 className="text-sm font-semibold text-foreground">RenaCrypt Pack</h3><span className="text-[11px] text-purple-500">$88 USDT</span></div>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>S Tier (0.5%)</span><span className="text-amber-500">~$500</span></div>
              <div className="flex justify-between"><span>A Tier (5.0%)</span><span className="text-purple-500">~$180</span></div>
              <div className="flex justify-between"><span>B Tier (18.0%)</span><span className="text-blue-500">~$95</span></div>
              <div className="flex justify-between"><span>C Tier (76.5%)</span><span className="text-muted-foreground">~$72</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{t('期望值', 'EV')}</span>
              <span className="text-[13px] font-semibold text-emerald-500">EV $95.24 (+8.2%)</span>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6 mb-6">
          <h3 className="text-[15px] font-semibold text-foreground mb-4">{t('核心机制', 'Key Mechanics')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: t('保底机制', 'Buyback'), desc: t('开包后 10 分钟内可享 85%~90% FMV 回购', '10-min 85%~90% FMV buyback'), color: 'emerald' },
              { icon: TrendingUp, title: t('正期望值', 'Positive EV'), desc: t('所有卡池 EV > 1，抽卡期望值正向', 'All pools EV > 1'), color: 'blue' },
              { icon: Trophy, title: t('成就 SBT', 'Achievement SBT'), desc: t('抽卡 5 次以上领取 Pack Opener SBT', 'Pull 5+ for Pack Opener SBT'), color: 'purple' },
            ].map((m, i) => (
              <div key={i} className={`rounded-lg bg-${m.color}-50 dark:bg-${m.color}-500/[0.04] border border-${m.color}-200 dark:border-${m.color}-500/10 p-4`}>
                <m.icon className={`w-5 h-5 text-${m.color}-500 mb-2`} />
                <h4 className="text-[13px] font-medium text-foreground mb-1">{m.title}</h4>
                <p className="text-[11px] text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-[15px] font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> {t('FMV 更新时间', 'FMV Update Schedule')}
          </h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {t('Renaiss 定期在限时开卡包前进行 FMV 更新。假设活动在 24 号，前后一天都有随机概率更新 FMV。无限抽卡机不受此规则影响。', 'Renaiss updates FMV before limited-time packs. Infinite gacha machines are not affected.')}
          </p>
        </div>
      </motion.div>
    );
  }

  function MarketSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="market">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{t('市场交易', 'Marketplace Trading')}</h2>
          <p className="text-[13px] text-muted-foreground">{t('在官方市场中买入、卖出或持有卡牌', 'Buy, sell, or hold cards')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { icon: Target, title: t('捡漏买入', 'Buy Low'), desc: t('低 FMV 捡漏买入（FMV±10% 内有效）', 'Buy below FMV (within ±10%)') },
            { icon: TrendingUp, title: t('挂单高卖', 'List High'), desc: t('挂单高卖，设置合理卖出价格', 'List at reasonable price') },
            { icon: Zap, title: t('Bid 出价', 'Place Bids'), desc: t('直接 Bid 出价 / Offer 收购', 'Directly Bid/Offer') },
            { icon: Trophy, title: t('赚取积分', 'Earn Points'), desc: t('参与 Bid/List/Trade 可赚 Superliquid 积分', 'Earn Superliquid points') },
          ].map((item, i) => (
            <motion.div key={i} className="glass-card rounded-xl p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <item.icon className="w-6 h-6 text-primary/60 mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
        <InfoBox type="warning">{t('价格建议综合参考 FMV、SNKRDUNK 等平台实时价格', 'Cross-reference FMV and platforms like SNKRDUNK')}</InfoBox>
        <div className="mt-4 glass-card rounded-xl p-5">
          <h3 className="text-[15px] font-semibold text-foreground mb-3">{t('官方教程', 'Official Tutorial')}</h3>
          <a href="https://x.com/renaissxyz/status/2011015569546625077" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-primary hover:underline transition-colors">
            {t('Superliquid 完整教程', 'Superliquid Full Tutorial')} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </motion.div>
    );
  }

  function TcgSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="tcg">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{t('TCG 是什么？', 'What is TCG?')}</h2>
          <p className="text-[13px] text-muted-foreground">{t('Trading Card Game 集换式卡牌游戏入门', 'Trading Card Game Introduction')}</p>
        </div>
        <div className="glass-card rounded-xl p-6 mb-6">
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
            {t('TCG 是 Trading Card Game 的缩写，中文叫集换式卡牌游戏。它不是单纯的卡牌收集，也不只是对战游戏，而是一套把抽卡、对战、交易与收藏融合在一起的完整体系。', 'TCG stands for Trading Card Game — a complete system combining gacha, battling, trading, and collecting.')}
          </p>
          <div className="rounded-lg bg-purple-50 dark:bg-purple-500/[0.04] border border-purple-200 dark:border-purple-500/10 p-4">
            <h4 className="text-[13px] font-medium text-purple-600 dark:text-purple-400 mb-2">{t('TCG 的核心不在于"你抽到了什么"，而在于：', 'The core of TCG is not "what you pulled", but:')}</h4>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>• {t('你如何理解卡牌', 'How you understand cards')}</p>
              <p>• {t('你如何使用卡牌', 'How you use cards')}</p>
              <p>• {t('你如何看待它的价值', 'How you perceive their value')}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-[15px] font-semibold text-foreground mb-4">{t('常见的 TCG', 'Popular TCGs')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { name: t('宝可梦卡牌', 'Pokemon TCG'), sub: 'Pokemon TCG' },
              { name: t('游戏王', 'Yu-Gi-Oh!'), sub: 'Yu-Gi-Oh!' },
              { name: t('万智牌', 'MTG'), sub: 'Magic: The Gathering' },
              { name: 'One Piece', sub: 'Card Game' },
              { name: t('数码宝贝', 'Digimon'), sub: 'Card Game' },
            ].map((tcg, i) => (
              <div key={i} className="rounded-lg bg-secondary border border-border p-3 text-center">
                <p className="text-[13px] font-medium text-foreground">{tcg.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{tcg.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  function RaritySection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="rarity">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{t('卡牌稀有度', 'Card Rarity Levels')}</h2>
          <p className="text-[13px] text-muted-foreground">{t('了解 Pokemon TCG 的稀有度体系', 'Understand the Pokemon TCG rarity system')}</p>
        </div>
        <div className="space-y-3">
          {rarityData.map((r, i) => (
            <motion.div key={r.code} className="glass-card rounded-xl p-5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center">
                  <span className={`text-sm font-bold ${r.color}`}>{r.code}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-1">{r.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t(r.zh, r.en)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  function GradingSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="grading">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{t('卡牌评级机构', 'Card Grading Companies')}</h2>
          <p className="text-[13px] text-muted-foreground">{t('了解 PSA、BGS 等评级体系', 'Understand PSA, BGS and other grading systems')}</p>
        </div>
        <div className="glass-card rounded-xl p-6 mb-6">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {t('在 TCG 体系中，卡牌评级的核心作用是建立信任与提升流动性。PSA 10 已被广泛视为收藏级卡牌的行业共识。', 'Card grading builds trust and improves liquidity. PSA 10 is the industry standard for gem mint.')}
          </p>
        </div>
        <div className="space-y-3">
          {gradingData.map((g, i) => (
            <motion.div key={g.name} className={`glass-card rounded-xl p-5 ${g.highlight ? 'border-primary/20 bg-primary/[0.02]' : ''}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="flex items-start gap-4">
                <div className={`shrink-0 w-14 h-14 rounded-xl ${g.highlight ? 'bg-primary/10 border border-primary/20' : 'bg-secondary border border-border'} flex items-center justify-center`}>
                  <span className={`text-[13px] font-bold ${g.highlight ? 'text-primary' : 'text-foreground/60'}`}>{g.name}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-0.5">{g.full}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t(g.zh, g.en)}</p>
                  {g.highlight && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/15">
                      <Star className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-primary font-medium">{t('推荐 - 流通性最佳', 'Recommended - Best Liquidity')}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  function BuyingSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="buying">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{t('购卡指南', 'Buying Guide')}</h2>
          <p className="text-[13px] text-muted-foreground">{t('从三个方向判断卡牌价值', 'Evaluate card value from three perspectives')}</p>
        </div>
        <StepCard step={1} title={t('了解宝可梦本身', 'Understand the Pokemon')} delay={0}>
          <p>{t('优先选择人气高的宝可梦。热门推荐：皮卡丘、耿鬼、烈空座、喷火龙、伊布系列、梦幻、超梦等', 'Prioritize popular Pokemon: Pikachu, Gengar, Rayquaza, Charizard, Eevee series, Mew, Mewtwo')}</p>
        </StepCard>
        <StepCard step={2} title={t('了解卡牌世代', 'Understand Card Generations')} delay={0.1}>
          <p>{t('第七代之前（Sun & Moon）的为老卡，流通量少。', 'Cards before Gen 7 (Sun & Moon) are vintage with lower circulation.')}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">{t('世代', 'Gen')}</th>
                <th className="text-left py-2 text-muted-foreground font-medium">{t('系列', 'Series')}</th>
                <th className="text-left py-2 text-muted-foreground font-medium">{t('分类', 'Type')}</th>
              </tr></thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50"><td className="py-1.5">1-7</td><td>{t('红/绿 ~ 太阳月亮', 'Red/Green ~ Sun & Moon')}</td><td className="text-amber-500">{t('老卡', 'Vintage')}</td></tr>
                <tr className="border-b border-border/50"><td className="py-1.5">8</td><td>{t('剑盾', 'Sword & Shield')}</td><td className="text-primary">{t('近世代', 'Modern')}</td></tr>
                <tr className="border-b border-border/50"><td className="py-1.5">9</td><td>{t('朱&紫', 'Scarlet & Violet')}</td><td className="text-primary">{t('近世代', 'Modern')}</td></tr>
                <tr><td className="py-1.5">10</td><td>{t('风与波', 'Wind & Wave')}</td><td className="text-primary">{t('近世代', 'Modern')}</td></tr>
              </tbody>
            </table>
          </div>
        </StepCard>
        <StepCard step={3} title={t('了解市场策略', 'Market Strategy')} delay={0.2}>
          <p>{t('冷门宝可梦价格空间较小。短期盈利选择半年价格稳定、流通性强的准热门卡。', 'Less popular Pokemon have smaller margins. For short-term profit, choose semi-popular cards with stable prices.')}</p>
        </StepCard>
      </motion.div>
    );
  }

  function TrendsSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="trends">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{t('近期投资卡牌趋势更新', 'Recent Trends')}</h2>
          <p className="text-[13px] text-muted-foreground">{t('最新的卡牌市场动态和再贩信息', 'Latest market dynamics and restock info')}</p>
        </div>
        <div className="glass-card rounded-xl p-6 mb-6">
          <h3 className="text-[15px] font-semibold text-foreground mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" /> {t('100 预组再贩信息', 'Restock Info')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">{t('日期', 'Date')}</th>
                <th className="text-left py-2 text-muted-foreground font-medium">{t('店铺', 'Store')}</th>
              </tr></thead>
              <tbody className="text-foreground">
                <tr className="border-b border-border/50"><td className="py-2">3/13 ~ 3/16</td><td>{t('乐天 Books', 'Rakuten Books')}</td></tr>
                <tr className="border-b border-border/50"><td className="py-2">3/22+</td><td>{t('伊藤洋华堂', 'Ito-Yokado')}</td></tr>
                <tr><td className="py-2">3/22+</td><td>{t('玩具反斗城', 'Toys"R"Us')}</td></tr>
              </tbody>
            </table>
          </div>
          <InfoBox type="warning">{t('根据情况可能会有变动，请关注最新公告。', 'Subject to change, follow latest announcements.')}</InfoBox>
        </div>
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-[15px] font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" /> {t('社区 AMA 回顾', 'Community AMA Recap')}
          </h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
            {t('Renaiss 社区 AMA 回顾 | 走进 One Piece 集换式卡牌世界', 'Renaiss Community AMA Recap | Entering the One Piece TCG World')}
          </p>
          <a href="https://x.com/Renaiss_CN/status/2019031940134023597" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-primary hover:underline transition-colors">
            {t('查看完整 AMA 回顾', 'View Full AMA Recap')} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">{t('Renaiss 新手入门指南', 'Renaiss Beginner Guide')}</h1>
        <p className="text-sm text-muted-foreground">{t('从零开始了解 Renaiss 生态，一站式掌握所有信息', 'Learn everything about Renaiss from scratch')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-20 space-y-1">
            {sections.map((sec, i) => (
              <motion.button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  activeSection === sec.id
                    ? 'bg-primary/10 border border-primary/15 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <sec.icon className={`w-4 h-4 shrink-0 ${activeSection === sec.id ? 'text-primary' : ''}`} />
                <span className="text-[13px] font-medium">{t(sec.zh, sec.en)}</span>
              </motion.button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">{renderSection()}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}
