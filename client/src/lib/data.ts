/**
 * AOCN Data Layer
 * Provides card data from Renaiss marketplace via server API
 * Also includes static data for SBT, events, gacha, and ecosystem stats
 */

// ─── Card Type ───
export interface Card {
  id: string;
  itemId: string;
  tokenId: string;
  name: string;
  setName: string;
  set: string;
  price: number;
  fmv: number;
  buyback: number;
  spread: number;
  spreadPct: number;
  imgUrl: string;
  grade: string;
  gradingCompany: string;
  year: number;
  language: string;
  cardNumber: string;
  serial: string;
  vaultLocation: string;
  ownerUsername: string;
  ebaySearchUrl: string;
}

// ─── Ecosystem Stats ───
export const ecosystemStats = {
  totalUsers: 28500,
  totalVolume: 1250000,
  totalCards: 3880,
  holders: 4200,
};

// ─── Timeline Events ───
export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  source: string;
  sourceUrl: string;
  hasSbt: boolean;
  type: string;
  sourceType?: string;
  sbtInfo?: string;
  sbtInfoEn?: string;
}

export const timelineEvents: TimelineEvent[] = [
  {
    id: 'evt-1',
    date: '2025-03-10',
    title: 'Renaiss Protocol 开放 Beta 测试',
    titleEn: 'Renaiss Protocol Open Beta Launch',
    description: 'Renaiss Protocol 正式开放公测，用户可以在市场中交易 PSA 评级的宝可梦卡牌 NFT。',
    descriptionEn: 'Renaiss Protocol officially launches open beta, allowing users to trade PSA-graded Pokemon card NFTs on the marketplace.',
    source: 'Renaiss Official',
    sourceUrl: 'https://x.com/renaissxyz',
    hasSbt: true,
    type: 'twitter',
  },
  {
    id: 'evt-2',
    date: '2025-02-28',
    title: 'Gacha 系统上线 - Omega Pack',
    titleEn: 'Gacha System Launch - Omega Pack',
    description: '全新抽卡系统上线，Omega Pack 包含多种稀有卡牌，支持链上随机开包。',
    descriptionEn: 'New gacha system launches with Omega Pack containing various rare cards with on-chain random pack opening.',
    source: 'Renaiss Official',
    sourceUrl: 'https://www.renaiss.xyz/gacha',
    hasSbt: false,
    type: 'twitter',
  },
  {
    id: 'evt-3',
    date: '2025-02-15',
    title: 'One Piece 卡牌系列加入市场',
    titleEn: 'One Piece Card Series Added to Marketplace',
    description: 'Renaiss 市场新增 One Piece 卡牌交易支持，扩展收藏品种类。',
    descriptionEn: 'Renaiss marketplace adds One Piece card trading support, expanding collectible categories.',
    source: 'Renaiss Official',
    sourceUrl: 'https://x.com/renaissxyz',
    hasSbt: false,
    type: 'twitter',
  },
  {
    id: 'evt-4',
    date: '2025-01-20',
    title: 'AOCN 社区分析平台发布',
    titleEn: 'AOCN Community Analytics Platform Launch',
    description: 'AOCN 作为 Renaiss 生态的社区驱动分析平台正式发布，提供套利分析和市场洞察。',
    descriptionEn: 'AOCN launches as a community-driven analytics platform for the Renaiss ecosystem.',
    source: 'AOCN',
    sourceUrl: 'https://x.com/Aocn_renaiss',
    hasSbt: true,
    type: 'twitter',
  },
  {
    id: 'evt-5',
    date: '2025-01-05',
    title: 'Renaiss 借贷功能即将上线',
    titleEn: 'Renaiss Lending Feature Coming Soon',
    description: '用户将可以使用 NFT 卡牌作为抵押品进行借贷，释放收藏品的流动性价值。',
    descriptionEn: 'Users will be able to use NFT cards as collateral for lending, unlocking liquidity from collectibles.',
    source: 'Renaiss Official',
    sourceUrl: 'https://x.com/renaissxyz',
    hasSbt: false,
    type: 'news',
  },
  {
    id: 'evt-6',
    date: '2024-12-15',
    title: 'Renaiss 与 PSA 合作验证系统',
    titleEn: 'Renaiss Partners with PSA for Verification',
    description: '所有市场中的卡牌均通过 PSA 官方验证，确保评级真实性和卡牌品质。',
    descriptionEn: 'All marketplace cards are verified through PSA official channels, ensuring grade authenticity.',
    source: 'Renaiss Official',
    sourceUrl: 'https://x.com/renaissxyz',
    hasSbt: false,
    type: 'news',
  },
];

// ─── Gacha Packs ───
export interface GachaPack {
  id: string;
  name: string;
  price: number;
  ev: number;
  evPct: number;
  tiers: { tier: number; probability: number; avgValue: number }[];
}

export const gachaPacks: GachaPack[] = [
  {
    id: 'omega',
    name: 'Omega Pack',
    price: 50,
    ev: 62.5,
    evPct: 25,
    tiers: [
      { tier: 1, probability: 60, avgValue: 30 },
      { tier: 2, probability: 25, avgValue: 75 },
      { tier: 3, probability: 10, avgValue: 150 },
      { tier: 4, probability: 4, avgValue: 350 },
      { tier: 5, probability: 1, avgValue: 800 },
    ],
  },
  {
    id: 'alpha',
    name: 'Alpha Pack',
    price: 100,
    ev: 118,
    evPct: 18,
    tiers: [
      { tier: 1, probability: 50, avgValue: 60 },
      { tier: 2, probability: 28, avgValue: 130 },
      { tier: 3, probability: 14, avgValue: 250 },
      { tier: 4, probability: 6, avgValue: 500 },
      { tier: 5, probability: 2, avgValue: 1200 },
    ],
  },
];

// ─── SBT Data ───
export interface SbtItem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  howToGet: string;
  howToGetEn: string;
  category: string;
  rarity: string;
  available: boolean;
  holders: number;
  imgUrl: string;
  relatedEventId?: string;
  whyAwarded?: string;
  whyAwardedEn?: string;
  benefits?: string;
  benefitsEn?: string;
}

export interface SbtCatalogItem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  category: string;
  available: boolean;
  status: '✅' | '❌' | '⭕';
  holders: number;
  availableLabel?: string;
  howToGet?: string;
  howToGetEn?: string;
}

export const sbtItems: SbtItem[] = [
  { id: 'sbt-1', name: 'OG 成员', nameEn: 'OG Member', description: '早期社区成员专属 SBT', descriptionEn: 'Exclusive SBT for early community members', howToGet: '参与早期社区活动', howToGetEn: 'Participate in early community events', category: 'community', rarity: 'Rare', available: false, holders: 500, imgUrl: '' },
  { id: 'sbt-2', name: '首次交易者', nameEn: 'First Trader', description: '完成首笔交易获得', descriptionEn: 'Earned by completing first trade', howToGet: '在市场完成一笔交易', howToGetEn: 'Complete a trade on marketplace', category: 'trading', rarity: 'Common', available: true, holders: 2800, imgUrl: '' },
  { id: 'sbt-3', name: '抽卡达人', nameEn: 'Gacha Master', description: '抽卡次数达到一定数量', descriptionEn: 'Reached certain number of gacha pulls', howToGet: '完成 50 次抽卡', howToGetEn: 'Complete 50 gacha pulls', category: 'gacha', rarity: 'Uncommon', available: true, holders: 1200, imgUrl: '' },
  { id: 'sbt-4', name: 'Discord 活跃者', nameEn: 'Discord Active', description: 'Discord 社区活跃成员', descriptionEn: 'Active Discord community member', howToGet: '在 Discord 达到 Level 10', howToGetEn: 'Reach Level 10 on Discord', category: 'social', rarity: 'Common', available: true, holders: 3500, imgUrl: '' },
  { id: 'sbt-5', name: '黑客松参与者', nameEn: 'Hackathon Participant', description: '参与 Renaiss 黑客松活动', descriptionEn: 'Participated in Renaiss Hackathon', howToGet: '提交黑客松项目', howToGetEn: 'Submit a hackathon project', category: 'event', rarity: 'Rare', available: false, holders: 150, imgUrl: '' },
  { id: 'sbt-6', name: '收藏大师', nameEn: 'Collection Master', description: '收藏卡牌达到一定数量', descriptionEn: 'Collected certain number of cards', howToGet: '持有 20 张以上卡牌', howToGetEn: 'Hold 20+ cards', category: 'trading', rarity: 'Uncommon', available: true, holders: 800, imgUrl: '' },
  { id: 'sbt-7', name: 'Beta 测试者', nameEn: 'Beta Tester', description: '参与 Beta 测试的用户', descriptionEn: 'Users who participated in Beta testing', howToGet: '在 Beta 期间注册并使用平台', howToGetEn: 'Register and use platform during Beta', category: 'special', rarity: 'Rare', available: true, holders: 4200, imgUrl: '' },
  { id: 'sbt-8', name: '推荐达人', nameEn: 'Referral Champion', description: '成功推荐多位新用户', descriptionEn: 'Successfully referred multiple new users', howToGet: '推荐 10 位新用户注册', howToGetEn: 'Refer 10 new users', category: 'social', rarity: 'Uncommon', available: true, holders: 600, imgUrl: '' },
];

export const sbtCatalog: SbtCatalogItem[] = sbtItems.map(item => ({
  id: item.id,
  name: item.name,
  nameEn: item.nameEn,
  description: item.description,
  descriptionEn: item.descriptionEn,
  category: item.category,
  available: item.available,
  status: item.available ? '✅' as const : '❌' as const,
  holders: item.holders,
  availableLabel: item.available ? '✅' : '❌',
  howToGet: item.howToGet,
  howToGetEn: item.howToGetEn,
}));

// ─── Live Card Data (fetched from server API) ───
// These will be populated by the API and used as initial/fallback data

// Placeholder arrays - will be replaced by API data in components
export const arbitrageCards: Card[] = [];
export const overpricedCards: Card[] = [];
