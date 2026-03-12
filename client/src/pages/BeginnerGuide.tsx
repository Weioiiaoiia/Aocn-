/*
 * AOCN Beginner Guide — 新手专区
 * 融合 Google Docs 全部内容的分步指引页面
 * Ice Blue + Violet theme
 */
import { useLang } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Sparkles, BookOpen, Wallet, CreditCard, ShoppingCart,
  Trophy, Star, TrendingUp, ChevronRight, ChevronDown,
  ExternalLink, Shield, Gem, Zap, Target, Info,
  ArrowRight, CheckCircle, Clock, Users
} from 'lucide-react';

/* ─── Section Data ─── */
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

/* ─── Step Card Component ─── */
function StepCard({ step, title, children, delay = 0 }: {
  step: number; title: string; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      className="relative pl-12 pb-8 last:pb-0"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {/* Timeline line */}
      <div className="absolute left-[18px] top-10 bottom-0 w-px bg-gradient-to-b from-ice/30 to-transparent last:hidden" />
      {/* Step number */}
      <div className="absolute left-0 top-0 w-9 h-9 rounded-full bg-gradient-to-br from-ice/20 to-violet/20 border border-ice/20 flex items-center justify-center">
        <span className="text-xs font-bold text-ice">{step}</span>
      </div>
      <div className="glass-card rounded-xl p-5">
        <h4 className="text-[15px] font-semibold text-white/85 mb-3">{title}</h4>
        <div className="text-[13px] text-white/50 leading-relaxed space-y-2">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Info Box Component ─── */
function InfoBox({ type = 'info', children }: { type?: 'info' | 'tip' | 'warning'; children: React.ReactNode }) {
  const styles = {
    info: 'bg-ice/[0.06] border-ice/15 text-ice/80',
    tip: 'bg-emerald-500/[0.06] border-emerald-500/15 text-emerald-400/80',
    warning: 'bg-amber-500/[0.06] border-amber-500/15 text-amber-400/80',
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

/* ─── Rarity Table ─── */
const rarityData = [
  { code: 'RR', name: 'Double Rare', zh: '常见的高强度或人气卡，局部闪或全卡基础闪膜，工艺相对简单，流通量大', en: 'Common high-power or popular cards with partial or full basic holo, simple craft, high circulation', color: 'text-blue-400' },
  { code: 'AR', name: 'Art Rare', zh: '以插画表现为核心，细腻印刷与局部光泽处理突出画面完成度', en: 'Art-focused with delicate printing and partial gloss treatment', color: 'text-teal-400' },
  { code: 'SR', name: 'Super Rare', zh: '抽取难度明显提高，全卡闪膜或纹理压印工艺，收藏属性开始明显提升', en: 'Notably harder to pull, full holo or textured embossing, collectibility rises significantly', color: 'text-purple-400' },
  { code: 'SRA', name: 'Super Rare Alt Art', zh: 'SR的特殊插画版本，同级工艺但搭配限定构图与演出设计，数量更少', en: 'Special illustration version of SR with limited composition, fewer in number', color: 'text-pink-400' },
  { code: 'UR', name: 'Ultra Rare', zh: '通常为全卡闪+金边/金线设计，工艺辨识度高，官方定位偏收藏级', en: 'Full holo + gold border/line design, high craft recognition, collector-grade', color: 'text-amber-400' },
  { code: 'MUR', name: 'Master Ultra Rare', zh: '顶级稀有度之一，采用多层闪膜、金属质感或复杂压纹工艺，发行量极低', en: 'Top rarity with multi-layer holo, metallic texture or complex embossing, extremely low print run', color: 'text-rose-400' },
];

/* ─── Grading Table ─── */
const gradingData = [
  { name: 'PSA', full: 'Professional Sports Authenticator', zh: '市场认可度最高，PSA 10是收藏级卡牌的行业共识，流通性最好', en: 'Highest market recognition, PSA 10 is industry standard for gem mint, best liquidity', highlight: true },
  { name: 'BGS', full: 'Beckett Grading Services', zh: '评级标准严格，细分卡况评分，顶级评分含金量极高，适合高端卡牌', en: 'Strict grading standards, sub-grade scoring, top grades extremely valuable, for high-end cards', highlight: false },
  { name: 'CGC', full: 'Certified Guaranty Company', zh: '近年发展迅速，性价比高，适合新卡与批量送评', en: 'Rapidly growing, cost-effective, suitable for new cards and bulk submissions', highlight: false },
  { name: 'ARS', full: 'Arita Rating System (Japan)', zh: '以日系审美和整体观感为核心，更受日文卡收藏者青睐', en: 'Japan-focused aesthetics and overall presentation, preferred by Japanese card collectors', highlight: false },
];

export default function BeginnerGuide() {
  const { t } = useLang();
  const [activeSection, setActiveSection] = useState('intro');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

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

  /* ─── Section: 项目介绍 ─── */
  function IntroSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="intro">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-ice/10 via-violet/5 to-transparent" />
          <div className="relative p-8 lg:p-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-ice animate-pulse" />
                <span className="text-[11px] text-ice/70 uppercase tracking-widest font-medium">Renaiss Protocol</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white/90 mb-4 leading-tight">
                {t('收藏品金融网络', 'The Collectible Financial Network')}
              </h2>
              <p className="text-[14px] text-white/50 leading-relaxed max-w-2xl mb-6">
                {t(
                  'Renaiss（@renaissxyz）是一个基于 BNB Chain 的 RWA（真实世界资产）基础设施项目，专注于将实体收藏品（如 TCG 卡牌）转化为链上可验证、可赎回的 NFT 资产。它不仅是抽卡+交易平台，而是构建收藏品金融网络，支持链上定价（FMV）、托管、赎回、借贷等功能。',
                  'Renaiss (@renaissxyz) is a BNB Chain-based RWA infrastructure project that converts physical collectibles (like TCG cards) into verifiable, redeemable on-chain NFT assets. It\'s not just a gacha + trading platform — it\'s building a Collectible Financial Network with on-chain pricing (FMV), custody, redemption, and lending.'
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="https://www.renaiss.xyz" target="_blank" rel="noopener noreferrer"
                  className="btn-primary px-5 py-2.5 rounded-lg text-sm flex items-center gap-2">
                  {t('访问官网', 'Visit Website')} <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a href="https://discord.com/invite/renais" target="_blank" rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.05] text-white/65 hover:bg-white/[0.08] border border-white/[0.08] transition-colors flex items-center gap-2">
                  {t('加入 Discord', 'Join Discord')} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { icon: Shield, title: t('链上验证', 'On-chain Verification'), desc: t('通过预言机实时定价+链上结算，实现透明交易，解决假货问题', 'Real-time oracle pricing + on-chain settlement for transparent trading, solving counterfeiting') },
            { icon: Gem, title: t('实物赎回', 'Physical Redemption'), desc: t('NFT 可赎回实体卡牌，二月已开放 Alpha 阶段试领取', 'NFTs are redeemable for physical cards, Alpha redemption opened in February') },
            { icon: TrendingUp, title: t('金融功能', 'Financial Features'), desc: t('支持 FMV 定价、托管、借贷等功能，构建完整的收藏品金融网络', 'FMV pricing, custody, lending — building a complete collectible financial network') },
          ].map((feat, i) => (
            <motion.div key={i} className="glass-card rounded-xl p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
              <feat.icon className="w-8 h-8 text-ice/50 mb-3" />
              <h3 className="text-[14px] font-semibold text-white/80 mb-2">{feat.title}</h3>
              <p className="text-[12px] text-white/40 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Core Gameplay */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-[16px] font-semibold text-white/85 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet/70" />
            {t('主要玩法', 'Core Gameplay')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-white/[0.02] p-4 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-ice/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-ice/60" />
                </div>
                <h4 className="text-[13px] font-medium text-white/70">{t('Gacha 抽卡', 'Gacha (Card Pulls)')}</h4>
              </div>
              <p className="text-[12px] text-white/40 leading-relaxed">
                {t('通过 USDT 进行 Gacha 抽卡，获得真实 PSA 评级卡牌的 NFT 资产', 'Use USDT for Gacha pulls to obtain NFT assets of real PSA-graded cards')}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.02] p-4 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-violet/10 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-violet/60" />
                </div>
                <h4 className="text-[13px] font-medium text-white/70">{t('Marketplace 交易', 'Marketplace Trading')}</h4>
              </div>
              <p className="text-[12px] text-white/40 leading-relaxed">
                {t('在市场中买入、卖出或持有卡牌，通过交易参与收藏品经济体系', 'Buy, sell, or hold cards in the marketplace to participate in the collectible economy')}
              </p>
            </div>
          </div>
          <InfoBox type="tip">
            {t(
              '拥有卡牌后可以放入市场赚取差价，或进行实体卡牌的 Redeem（赎回）。四月预计完成全域覆盖。',
              'After owning cards, you can list them on the market for profit or redeem physical cards. Full coverage expected by April.'
            )}
          </InfoBox>
        </div>
      </motion.div>
    );
  }

  /* ─── Section: 如何参与 ─── */
  function HowToSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="howto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white/90 mb-2">{t('如何参与 Renaiss（基础篇）', 'How to Join Renaiss (Basics)')}</h2>
          <p className="text-[13px] text-white/40">{t('按照以下步骤，从零开始参与 Renaiss 生态', 'Follow these steps to join the Renaiss ecosystem from scratch')}</p>
        </div>

        <StepCard step={1} title={t('注册 / 登录', 'Register / Login')} delay={0}>
          <p>{t(
            '访问官网 renaiss.xyz，点击 "Log in" 登录，连接钱包（支持 BNB Chain/BSC）。新用户建议同时绑定 X（Twitter）和 Discord 账号，即可免费领取最早的 SBT 或成就徽章（Easiest SBT）。',
            'Visit renaiss.xyz, click "Log in", connect your wallet (supports BNB Chain/BSC). New users should also link X (Twitter) and Discord accounts to claim free SBT badges.'
          )}</p>
          <InfoBox type="tip">
            {t('绑定社交账号是获取免费 SBT 的最简单方式！', 'Linking social accounts is the easiest way to get free SBTs!')}
          </InfoBox>
        </StepCard>

        <StepCard step={2} title={t('充值', 'Top Up')} delay={0.1}>
          <p>{t(
            '准备 BSC 链钱包：转入至少 0.001 BNB（用于 Gas 费）+ 60 USDT（或更多，用于抽卡/交易）。在官网连接钱包后，进入充值页面，Approve USDT 授权，然后 Top Up（充值）。',
            'Prepare a BSC wallet: transfer at least 0.001 BNB (for Gas) + 60 USDT (or more, for gacha/trading). Connect wallet on the website, go to the top-up page, approve USDT, then Top Up.'
          )}</p>
          <InfoBox type="info">
            {t('首次充值 60U 以上可直接解锁充值相关 SBT 徽章（Fund Your Account SBT）', 'First deposit of 60U+ unlocks the Fund Your Account SBT badge')}
          </InfoBox>
        </StepCard>

        <StepCard step={3} title={t('抽卡', 'Pull Cards')} delay={0.2}>
          <p>{t(
            '去 Gacha 页面，查看当前限时卡池（如 Legacy Pack、2026 Pack 等），每个包通常 48~88 USDT。开包后 10 分钟内可享 85%~90% FMV 回购托底（保底机制）。',
            'Go to the Gacha page, check current limited-time pools (Legacy Pack, 2026 Pack, etc.), each pack usually 48~88 USDT. Within 10 minutes of opening, enjoy 85%~90% FMV buyback guarantee.'
          )}</p>
          <InfoBox type="tip">
            {t('抽卡 5 次以上，可领取 Pack Opener 开袋器成就 SBT！', 'Pull 5+ times to earn the Pack Opener achievement SBT!')}
          </InfoBox>
        </StepCard>

        <StepCard step={4} title={t('市场交易', 'Market Trading')} delay={0.3}>
          <p>{t(
            '进入 Marketplace，查看卡牌列表。FMV（公平市场价，由预言机实时定价）。玩法：低 FMV 捡漏买入（FMV±10% 内有效），挂单高卖（List），或直接 Bid 出价 / Offer 收购。',
            'Enter Marketplace, browse card listings. FMV (Fair Market Value, real-time oracle pricing). Strategy: buy below FMV (within ±10%), list high (List), or directly Bid/Offer.'
          )}</p>
        </StepCard>

        <StepCard step={5} title={t('收集 SBT（空投机会）', 'Collect SBTs (Airdrop Opportunity)')} delay={0.4}>
          <p>{t(
            '深度参与 Renaiss 生态：加入 Discord、参与 AMA 填问卷、DC/微信群活跃、发推互动，可拿限时 SBT。邀请好友、开包多、持有价值高、内容创作等维度可争年终名人堂 SBT。',
            'Deep participation in Renaiss ecosystem: join Discord, participate in AMAs, be active in communities, interact on X to earn limited SBTs. Invite friends, open packs, hold valuable cards, create content for Hall of Fame SBTs.'
          )}</p>
          <InfoBox type="info">
            {t('SBT 是灵魂绑定代币，不可转让，代表你在生态中的真实贡献和身份', 'SBTs are Soulbound Tokens — non-transferable, representing your real contribution and identity in the ecosystem')}
          </InfoBox>
        </StepCard>
      </motion.div>
    );
  }

  /* ─── Section: 抽卡指南 ─── */
  function GachaSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="gacha">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white/90 mb-2">{t('抽卡指南 | 无限卡池', 'Gacha Guide | Infinite Pool')}</h2>
          <p className="text-[13px] text-white/40">{t('了解 Renaiss 的抽卡机制和策略', 'Understand Renaiss gacha mechanics and strategies')}</p>
        </div>

        {/* Pack Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="glass-card rounded-xl p-5 border-l-3 border-l-ice/40">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-ice/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-ice/60" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white/80">OMEGA Pack</h3>
                <span className="text-[11px] text-ice/60">$48 USDT</span>
              </div>
            </div>
            <div className="space-y-2 text-[12px] text-white/45">
              <div className="flex justify-between"><span>S Tier (0.24%)</span><span className="text-amber-400/70">~$300</span></div>
              <div className="flex justify-between"><span>A Tier (4.85%)</span><span className="text-purple-400/70">~$120</span></div>
              <div className="flex justify-between"><span>B Tier (16.09%)</span><span className="text-blue-400/70">~$65</span></div>
              <div className="flex justify-between"><span>C Tier (78.82%)</span><span className="text-white/30">~$40</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] text-white/30">{t('期望值', 'Expected Value')}</span>
              <span className="text-[13px] font-semibold text-emerald-400/70">EV $52.32 (+9%)</span>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 border-l-3 border-l-violet/40">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-violet/60" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white/80">RenaCrypt Pack</h3>
                <span className="text-[11px] text-violet/60">$88 USDT</span>
              </div>
            </div>
            <div className="space-y-2 text-[12px] text-white/45">
              <div className="flex justify-between"><span>S Tier (0.5%)</span><span className="text-amber-400/70">~$500</span></div>
              <div className="flex justify-between"><span>A Tier (5.0%)</span><span className="text-purple-400/70">~$180</span></div>
              <div className="flex justify-between"><span>B Tier (18.0%)</span><span className="text-blue-400/70">~$95</span></div>
              <div className="flex justify-between"><span>C Tier (76.5%)</span><span className="text-white/30">~$72</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] text-white/30">{t('期望值', 'Expected Value')}</span>
              <span className="text-[13px] font-semibold text-emerald-400/70">EV $95.24 (+8.2%)</span>
            </div>
          </div>
        </div>

        {/* Key Mechanics */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h3 className="text-[15px] font-semibold text-white/85 mb-4">{t('核心机制', 'Key Mechanics')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10 p-4">
              <Shield className="w-5 h-5 text-emerald-400/60 mb-2" />
              <h4 className="text-[13px] font-medium text-white/70 mb-1">{t('保底机制', 'Buyback Guarantee')}</h4>
              <p className="text-[11px] text-white/40">{t('开包后 10 分钟内可享 85%~90% FMV 回购托底', 'Within 10 min of opening, enjoy 85%~90% FMV buyback guarantee')}</p>
            </div>
            <div className="rounded-lg bg-ice/[0.04] border border-ice/10 p-4">
              <TrendingUp className="w-5 h-5 text-ice/60 mb-2" />
              <h4 className="text-[13px] font-medium text-white/70 mb-1">{t('正期望值', 'Positive EV')}</h4>
              <p className="text-[11px] text-white/40">{t('所有卡池 EV > 1，抽卡期望值正向', 'All pools have EV > 1, positive expected value')}</p>
            </div>
            <div className="rounded-lg bg-violet/[0.04] border border-violet/10 p-4">
              <Trophy className="w-5 h-5 text-violet/60 mb-2" />
              <h4 className="text-[13px] font-medium text-white/70 mb-1">{t('成就 SBT', 'Achievement SBT')}</h4>
              <p className="text-[11px] text-white/40">{t('抽卡 5 次以上领取 Pack Opener SBT', 'Pull 5+ times to earn Pack Opener SBT')}</p>
            </div>
          </div>
        </div>

        {/* FMV Update Info */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-[15px] font-semibold text-white/85 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400/60" />
            {t('FMV 更新时间', 'FMV Update Schedule')}
          </h3>
          <p className="text-[13px] text-white/50 leading-relaxed">
            {t(
              'Renaiss 定期都会在限时开卡包前进行一次 FMV 的更新。假设抽卡活动在 24 号，那前后一天都有随机的概率在任何时段更新卡牌的 FMV 价格。无限抽卡机（非限时活动）不受此规则影响。',
              'Renaiss regularly updates FMV before limited-time pack openings. If a gacha event is on the 24th, FMV may update randomly within a day before or after. Infinite gacha machines are not affected by this rule.'
            )}
          </p>
        </div>
      </motion.div>
    );
  }

  /* ─── Section: 市场交易 ─── */
  function MarketSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="market">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white/90 mb-2">{t('市场交易（Marketplace）', 'Marketplace Trading')}</h2>
          <p className="text-[13px] text-white/40">{t('在官方市场中买入、卖出或持有卡牌', 'Buy, sell, or hold cards in the official marketplace')}</p>
        </div>

        {/* Trading Strategies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { icon: Target, title: t('捡漏买入', 'Buy Low'), desc: t('低 FMV 捡漏买入（FMV±10% 内有效），关注价格低于 FMV 的卡牌', 'Buy below FMV (within ±10%), focus on cards priced below FMV'), color: 'ice' },
            { icon: TrendingUp, title: t('挂单高卖', 'List High'), desc: t('挂单高卖（List），设置合理的卖出价格等待成交', 'List cards at a reasonable price and wait for trades'), color: 'emerald-400' },
            { icon: Zap, title: t('Bid 出价', 'Place Bids'), desc: t('直接 Bid 出价 / Offer 收购，主动寻找交易机会', 'Directly Bid/Offer to actively seek trading opportunities'), color: 'violet' },
            { icon: Trophy, title: t('赚取积分', 'Earn Points'), desc: t('参与 Bid/List/Trade 可赚 Superliquid 积分（Trade 权重最高）', 'Earn Superliquid points through Bid/List/Trade (Trade has highest weight)'), color: 'amber-400' },
          ].map((item, i) => (
            <motion.div key={i} className="glass-card rounded-xl p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <item.icon className={`w-6 h-6 text-${item.color}/60 mb-3`} />
              <h3 className="text-[14px] font-semibold text-white/80 mb-2">{item.title}</h3>
              <p className="text-[12px] text-white/40 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <InfoBox type="warning">
          {t(
            '价格建议综合参考 FMV、SNKRDUNK 等平台实时价格。捡漏工具推荐：renaiss77.xyz（监控差价/趋势）',
            'Price recommendations should reference FMV and platforms like SNKRDUNK. Tool recommendation: renaiss77.xyz (monitor spreads/trends)'
          )}
        </InfoBox>

        <div className="mt-4 glass-card rounded-xl p-5">
          <h3 className="text-[15px] font-semibold text-white/85 mb-3">{t('官方教程', 'Official Tutorial')}</h3>
          <a href="https://x.com/renaissxyz/status/2011015569546625077" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-[13px] text-ice/70 hover:text-ice transition-colors">
            {t('Superliquid 完整教程：Bid/List/Trade/积分', 'Superliquid Full Tutorial: Bid/List/Trade/Points')}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </motion.div>
    );
  }

  /* ─── Section: TCG 知识 ─── */
  function TcgSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="tcg">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white/90 mb-2">{t('TCG 是什么？', 'What is TCG?')}</h2>
          <p className="text-[13px] text-white/40">{t('Trading Card Game 集换式卡牌游戏入门', 'Trading Card Game Introduction')}</p>
        </div>

        <div className="glass-card rounded-xl p-6 mb-6">
          <p className="text-[13px] text-white/55 leading-relaxed mb-4">
            {t(
              'TCG 是 Trading Card Game 的缩写，中文叫集换式卡牌游戏。它不是单纯的卡牌收集，也不只是对战游戏，而是一套把抽卡、对战、交易与收藏融合在一起的完整体系。在 TCG 中，玩家通过开卡包获得不同稀有度的卡牌，再根据规则进行组牌与对战；同时，卡牌可以被自由交易、收藏，甚至因为稀有度、人气或版本原因而产生长期价值。',
              'TCG stands for Trading Card Game. It\'s not just card collecting or battling — it\'s a complete system combining gacha, battling, trading, and collecting. Players open packs to get cards of varying rarity, build decks for battles, and freely trade or collect cards that gain long-term value based on rarity, popularity, or edition.'
            )}
          </p>
          <div className="rounded-lg bg-violet/[0.04] border border-violet/10 p-4">
            <h4 className="text-[13px] font-medium text-violet/70 mb-2">{t('TCG 的核心不在于"你抽到了什么"，而在于：', 'The core of TCG is not "what you pulled", but:')}</h4>
            <div className="space-y-1.5 text-[12px] text-white/50">
              <p>• {t('你如何理解卡牌', 'How you understand cards')}</p>
              <p>• {t('你如何使用卡牌', 'How you use cards')}</p>
              <p>• {t('你如何看待它的价值', 'How you perceive their value')}</p>
            </div>
          </div>
        </div>

        {/* Popular TCGs */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-[15px] font-semibold text-white/85 mb-4">{t('常见的 TCG', 'Popular TCGs')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { name: t('宝可梦卡牌', 'Pokemon TCG'), sub: 'Pokemon TCG' },
              { name: t('游戏王', 'Yu-Gi-Oh!'), sub: 'Yu-Gi-Oh!' },
              { name: t('万智牌', 'MTG'), sub: 'Magic: The Gathering' },
              { name: 'One Piece', sub: 'Card Game' },
              { name: t('数码宝贝', 'Digimon'), sub: 'Card Game' },
            ].map((tcg, i) => (
              <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                <p className="text-[13px] font-medium text-white/70">{tcg.name}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{tcg.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  /* ─── Section: 卡牌稀有度 ─── */
  function RaritySection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="rarity">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white/90 mb-2">{t('卡牌稀有度', 'Card Rarity Levels')}</h2>
          <p className="text-[13px] text-white/40">{t('了解 Pokemon TCG 的稀有度体系', 'Understand the Pokemon TCG rarity system')}</p>
        </div>

        <div className="space-y-3">
          {rarityData.map((r, i) => (
            <motion.div key={r.code} className="glass-card rounded-xl p-5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className={`w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center`}>
                    <span className={`text-[14px] font-bold ${r.color}`}>{r.code}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-white/80 mb-1">{r.name}</h3>
                  <p className="text-[12px] text-white/45 leading-relaxed">{t(r.zh, r.en)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  /* ─── Section: 评级机构 ─── */
  function GradingSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="grading">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white/90 mb-2">{t('卡牌评级机构', 'Card Grading Companies')}</h2>
          <p className="text-[13px] text-white/40">{t('了解 PSA、BGS 等评级体系', 'Understand PSA, BGS and other grading systems')}</p>
        </div>

        <div className="glass-card rounded-xl p-6 mb-6">
          <p className="text-[13px] text-white/55 leading-relaxed">
            {t(
              '在 TCG 体系中，卡牌评级的核心作用是建立信任与提升流动性。PSA（Professional Sports Authenticator）因其极高的市场认可度，成为当前 TCG 市场中流动性最好的评级标准。PSA 10 已被广泛视为收藏级卡牌的行业共识。',
              'In the TCG ecosystem, card grading serves to build trust and improve liquidity. PSA (Professional Sports Authenticator) has the highest market recognition, making it the most liquid grading standard. PSA 10 is widely recognized as the industry standard for gem mint.'
            )}
          </p>
        </div>

        <div className="space-y-3">
          {gradingData.map((g, i) => (
            <motion.div key={g.name} className={`glass-card rounded-xl p-5 ${g.highlight ? 'border-ice/20 bg-ice/[0.02]' : ''}`}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="flex items-start gap-4">
                <div className={`shrink-0 w-14 h-14 rounded-xl ${g.highlight ? 'bg-ice/10 border border-ice/20' : 'bg-white/[0.04] border border-white/[0.08]'} flex items-center justify-center`}>
                  <span className={`text-[13px] font-bold ${g.highlight ? 'text-ice' : 'text-white/60'}`}>{g.name}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-white/80 mb-0.5">{g.full}</h3>
                  <p className="text-[12px] text-white/45 leading-relaxed">{t(g.zh, g.en)}</p>
                  {g.highlight && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ice/10 border border-ice/15">
                      <Star className="w-3 h-3 text-ice/70" />
                      <span className="text-[10px] text-ice/70 font-medium">{t('推荐 - 流通性最佳', 'Recommended - Best Liquidity')}</span>
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

  /* ─── Section: 购卡指南 ─── */
  function BuyingSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="buying">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white/90 mb-2">{t('Renaiss Pokemon NFT 购卡指南', 'Renaiss Pokemon NFT Buying Guide')}</h2>
          <p className="text-[13px] text-white/40">{t('从三个方向判断卡牌价值', 'Evaluate card value from three perspectives')}</p>
        </div>

        <StepCard step={1} title={t('了解宝可梦本身', 'Understand the Pokemon')} delay={0}>
          <p>{t(
            '优先选择人气高的宝可梦，或是你自己真正喜欢的角色。人气高代表关注度和流通性更好；但已喜欢则更适合长期持有。若目标是提升卡的长期价值，则应选择大众都喜欢、颜值高、稀缺度够的热门卡。',
            'Prioritize popular Pokemon or characters you genuinely like. High popularity means better attention and liquidity; personal favorites are better for long-term holding. For long-term value, choose popular, visually appealing, and scarce cards.'
          )}</p>
          <p className="mt-2 text-white/55">{t(
            '热门推荐：皮卡丘、耿鬼、烈空座、喷火龙、伊布系列、梦幻、超梦等',
            'Popular picks: Pikachu, Gengar, Rayquaza, Charizard, Eevee series, Mew, Mewtwo, etc.'
          )}</p>
        </StepCard>

        <StepCard step={2} title={t('了解卡牌世代', 'Understand Card Generations')} delay={0.1}>
          <p>{t(
            '宝可梦卡也分为近世代卡牌与老卡。第七代之前（Sun & Moon 太阳月亮）的年份世代都可称之为老卡，流通数量少，非高价卡可能较为难查询价格。',
            'Pokemon cards are divided into modern and vintage. Cards before Generation 7 (Sun & Moon) are considered vintage with lower circulation, and non-high-value vintage cards may be harder to price.'
          )}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 text-white/40 font-medium">{t('世代', 'Gen')}</th>
                  <th className="text-left py-2 text-white/40 font-medium">{t('系列', 'Series')}</th>
                  <th className="text-left py-2 text-white/40 font-medium">{t('分类', 'Type')}</th>
                </tr>
              </thead>
              <tbody className="text-white/50">
                <tr className="border-b border-white/[0.03]"><td className="py-1.5">1-6</td><td>{t('红/绿 ~ X/Y', 'Red/Green ~ X/Y')}</td><td className="text-amber-400/60">{t('老卡', 'Vintage')}</td></tr>
                <tr className="border-b border-white/[0.03]"><td className="py-1.5">7</td><td>{t('太阳月亮', 'Sun & Moon')}</td><td className="text-amber-400/60">{t('老卡', 'Vintage')}</td></tr>
                <tr className="border-b border-white/[0.03]"><td className="py-1.5">8</td><td>{t('剑盾', 'Sword & Shield')}</td><td className="text-ice/60">{t('近世代', 'Modern')}</td></tr>
                <tr className="border-b border-white/[0.03]"><td className="py-1.5">9</td><td>{t('朱&紫', 'Scarlet & Violet')}</td><td className="text-ice/60">{t('近世代', 'Modern')}</td></tr>
                <tr><td className="py-1.5">10</td><td>{t('风与波', 'Wind & Wave')}</td><td className="text-ice/60">{t('近世代', 'Modern')}</td></tr>
              </tbody>
            </table>
          </div>
        </StepCard>

        <StepCard step={3} title={t('了解市场策略', 'Understand Market Strategy')} delay={0.2}>
          <p>{t(
            '冷门宝可梦价格空间较小，若想短期盈利，选择半年价格稳定、流通性强的准热门卡。综合参考 FMV、SNKRDUNK 等平台实时价格进行判断。',
            'Less popular Pokemon have smaller price margins. For short-term profit, choose semi-popular cards with stable 6-month prices and strong liquidity. Cross-reference FMV and platforms like SNKRDUNK for pricing.'
          )}</p>
        </StepCard>
      </motion.div>
    );
  }

  /* ─── Section: 趋势更新 ─── */
  function TrendsSection() {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="trends">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white/90 mb-2">{t('近期投资卡牌趋势更新', 'Recent Card Investment Trends')}</h2>
          <p className="text-[13px] text-white/40">{t('最新的卡牌市场动态和再贩信息', 'Latest card market dynamics and restock information')}</p>
        </div>

        <div className="glass-card rounded-xl p-6 mb-6">
          <h3 className="text-[15px] font-semibold text-white/85 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-ice/60" />
            {t('100 预组再贩信息', '100 Pre-built Deck Restock Info')}
          </h3>

          <div className="mb-4">
            <h4 className="text-[13px] font-medium text-white/70 mb-3">{t('大型零售店再次发售（已确认）', 'Major Retailer Restocks (Confirmed)')}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left py-2 text-white/50 font-medium">{t('日期', 'Date')}</th>
                    <th className="text-left py-2 text-white/50 font-medium">{t('店铺', 'Store')}</th>
                  </tr>
                </thead>
                <tbody className="text-white/55">
                  <tr className="border-b border-white/[0.04]"><td className="py-2">3/13 10:00 ~ 3/16 9:59</td><td>{t('乐天 Books', 'Rakuten Books')}</td></tr>
                  <tr className="border-b border-white/[0.04]"><td className="py-2">3/22 {t('起', 'onwards')}</td><td>{t('伊藤洋华堂', 'Ito-Yokado')}</td></tr>
                  <tr><td className="py-2">3/22 {t('起', 'onwards')}</td><td>{t('玩具反斗城', 'Toys"R"Us')}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <InfoBox type="warning">
            {t('根据情况可能会有变动，随时更新。便利店再发售信息为预测，请关注最新公告。', 'Subject to change, updated regularly. Convenience store restock info is predicted, please follow latest announcements.')}
          </InfoBox>
        </div>

        {/* AMA Recap */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-[15px] font-semibold text-white/85 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet/60" />
            {t('社区 AMA 回顾', 'Community AMA Recap')}
          </h3>
          <p className="text-[13px] text-white/50 leading-relaxed mb-3">
            {t(
              'Renaiss 社区 AMA 回顾 | 走进 One Piece 集换式卡牌世界 — 探讨了 Renaiss 未来将扩展海贼王等 IP 的计划。',
              'Renaiss Community AMA Recap | Entering the One Piece TCG World — Discussed plans to expand into One Piece and other IPs.'
            )}
          </p>
          <a href="https://x.com/Renaiss_CN/status/2019031940134023597" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-[13px] text-ice/70 hover:text-ice transition-colors">
            {t('查看完整 AMA 回顾', 'View Full AMA Recap')} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-ice to-violet" />
          <span className="text-[11px] text-white/30 uppercase tracking-widest">{t('新手专区', 'Beginner Zone')}</span>
        </div>
        <h1 className="text-2xl font-bold text-white/90 mb-2">{t('Renaiss 新手入门指南', 'Renaiss Beginner Guide')}</h1>
        <p className="text-sm text-white/40">
          {t(
            '从零开始了解 Renaiss 生态，一站式掌握所有你需要知道的信息',
            'Learn everything about the Renaiss ecosystem from scratch, all in one place'
          )}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar Navigation */}
        <div className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-20 space-y-1">
            {sections.map((sec, i) => (
              <motion.button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  activeSection === sec.id
                    ? 'bg-gradient-to-r from-ice/10 to-violet/5 border border-ice/15 text-white/90'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
                }`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <sec.icon className={`w-4 h-4 shrink-0 ${activeSection === sec.id ? 'text-ice' : ''}`} />
                <span className="text-[13px] font-medium">{t(sec.zh, sec.en)}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {renderSection()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
