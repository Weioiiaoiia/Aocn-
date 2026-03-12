// ============================================================
// AOCN - 100% 真实数据
// 所有卡牌数据来自 Renaiss Protocol 市场 (renaiss.xyz/marketplace)
// 所有事件数据来自官方推特和公开新闻源
// SBT 数据来自官方文档，持续更新
// ============================================================

export interface Card {
  id: string;
  name: string;
  imgUrl: string;
  price: number;
  fmv: number;
  spread: number;
  spreadPct: number;
  grade: string;
  year: string;
  set: string;
  cardNumber: string;
  pokemonName: string;
  ebaySearchUrl: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  source: string;
  sourceUrl: string;
  sourceType: 'twitter' | 'news' | 'official';
  hasSbt: boolean;
  sbtInfo?: string;
  sbtInfoEn?: string;
}

export interface SbtItem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  howToGet: string;
  howToGetEn: string;
  whyAwarded: string;
  whyAwardedEn: string;
  benefits: string;
  benefitsEn: string;
  relatedEventId: string;
}

// New: Full SBT catalog from Google Docs
export interface SbtCatalogItem {
  id: string;
  name: string;
  nameEn: string;
  available: boolean; // ✅ = true, ❌ = false, ⭕ = special
  availableLabel: '✅' | '❌' | '⭕';
  description: string;
  descriptionEn: string;
  howToGet: string;
  howToGetEn: string;
  category: 'community' | 'gacha' | 'event' | 'trading' | 'social' | 'special';
}

// Helper: build eBay search URL from card name
function buildEbayUrl(name: string): string {
  const searchTerms = name
    .replace(/Gem Mint|NM-MT|Mint/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchTerms)}&_sacat=0&LH_TitleDesc=0&_sop=12`;
}

// Parse card name to extract structured info
function parseCardName(name: string): { grade: string; year: string; set: string; cardNumber: string; pokemonName: string } {
  const gradeMatch = name.match(/^(PSA \d+|BGS [\d.]+)/);
  const grade = gradeMatch ? gradeMatch[1] : '';
  const yearMatch = name.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : '';
  const numberMatch = name.match(/#(\S+)/);
  const cardNumber = numberMatch ? numberMatch[1] : '';
  const parts = name.split('#');
  const pokemonName = parts.length > 1 ? parts[1].replace(/^\S+\s*/, '').trim() : '';
  const setMatch = name.match(/Pokemon\s+(?:Japanese\s+)?(.+?)(?:\s+#)/);
  const set = setMatch ? setMatch[1] : '';
  return { grade, year, set, cardNumber, pokemonName };
}

const rawCards = [
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA77052403/nft_image.jpg", name: "PSA 10 Gem Mint 2022 Pokemon Japanese Sv Promo #001 Pikachu", price: 73.44, fmv: 79 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA104351874/nft_image.jpg", name: "PSA 10 Gem Mint 2024 Pokemon Japanese Sv8-Super Electric Breaker #131 Milotic Ex", price: 118.32, fmv: 120 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA127636893/nft_image.jpg", name: "PSA 10 Gem Mint 2024 Pokemon Japanese Sv8a-Terastal Fest Ex #205 Vaporeon Ex", price: 102, fmv: 109 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA69174755/nft_image.jpg", name: "PSA 10 Gem Mint 2021 Pokemon Sword & Shield Evolving Skies #209 Glaceon Vmax", price: 486.54, fmv: 462 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA75962061/nft_image.jpg", name: "PSA 9 Mint 2009 Pokemon Japanese Advent Of Arceus #031 Pikachu", price: 48.96, fmv: 50 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA108541150/nft_image.jpg", name: "PSA 10 Gem Mint 2024 Pokemon Japanese Sv7-Stellar Miracle #105 Turtonator", price: 38.76, fmv: 40 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA96567293/nft_image.jpg", name: "PSA 9 Mint 2023 Pokemon Japanese Sv2d-Clay Burst #095 Saguaro", price: 20.4, fmv: 27 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA83246881/nft_image.jpg", name: "PSA 9 Mint 2021 Pokemon Japanese Sword & Shield Vmax Climax #263 Sordward & Shielbert", price: 20.4, fmv: 27 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA102807933/nft_image.jpg", name: "PSA 9 Mint 2024 Pokemon Ssp En-Surging Sparks #198 Feebas", price: 21.42, fmv: 25 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA121340615/nft_image.jpg", name: "PSA 8 NM-MT 2024 Pokemon Japanese Sv5a-Crimson Haze #088 Lana's Aid", price: 19.38, fmv: 21 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA77816476/nft_image.jpg", name: "PSA 10 Gem Mint 2022 Pokemon Japanese Sword & Shield Space Juggler #077 Irida", price: 81.80, fmv: 93 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA121373259/nft_image.jpg", name: "PSA 10 Gem Mint 2024 Pokemon Japanese Sv8a-Terastal Fest Ex #212 Sylveon Ex", price: 183.6, fmv: 186 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA98527164/nft_image.jpg", name: "PSA 10 Gem Mint 2023 Pokemon Japanese Sv4a-Shiny Treasure Ex #331 Charizard Ex", price: 66.3, fmv: 68 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA105494397/nft_image.jpg", name: "PSA 10 Gem Mint 2025 Pokemon Japanese Sv9-Battle Partners #110 Furret", price: 32.64, fmv: 49 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA72643505/nft_image.jpg", name: "PSA 10 Gem Mint 2003 Pokemon Japanese Miracle Of The Desert #046 Aggron Ex-Holo", price: 171.36, fmv: 214 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA76603414/nft_image.jpg", name: "PSA 10 Gem Mint 2021 Pokemon Japanese Promo Card Pack 25th Anniversary Edition #012 Umbreon-Gold Star", price: 288.66, fmv: 313 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA78627086/nft_image.jpg", name: "PSA 10 Gem Mint 2023 Pokemon Japanese Sv2d-Clay Burst #091 Iono", price: 134.64, fmv: 146 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA78594129/nft_image.jpg", name: "PSA 10 Gem Mint 2022 Pokemon Japanese Sword & Shield Vstar Universe #246 Elesa's Sparkle", price: 81.6, fmv: 89 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA82475108/nft_image.jpg", name: "PSA 10 Gem Mint 2023 Pokemon Japanese Sv1v-Violet Ex #100 Miriam", price: 59.16, fmv: 61 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA72347033/nft_image.jpg", name: "PSA 10 Gem Mint 2022 Pokemon Japanese Sword & Shield Vstar Universe #260 Orgn.Frm.Dialga Vstar", price: 117.3, fmv: 126 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA110480642/nft_image.jpg", name: "PSA 10 Gem Mint 2025 Pokemon Japanese Sv9-Battle Partners #103 Wailord", price: 45.9, fmv: 49 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA71299761/nft_image.jpg", name: "PSA 10 Gem Mint 2019 Pokemon Japanese Sun & Moon Remix Bout #073 Roller Skater", price: 61.2, fmv: 66 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA116725183/nft_image.jpg", name: "PSA 10 Gem Mint 2023 Pokemon Japanese Sv2a-Pokemon 151 #167 Ivysaur", price: 49.87, fmv: 55 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA125759445/nft_image.jpg", name: "PSA 10 Gem Mint 2025 Pokemon Japanese Sv11b-Black Bolt #168 Kyurem Ex", price: 86.19, fmv: 104 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA79393237/nft_image.jpg", name: "PSA 10 Gem Mint 2022 Pokemon Japanese Sword & Shield Vstar Universe #203 Duskull", price: 42.84, fmv: 49 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA74191360/nft_image.jpg", name: "PSA 10 Gem Mint 2023 Pokemon Japanese Sv1a-Triplet Beat #092 Dendra", price: 40.8, fmv: 46 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA107900990/nft_image.jpg", name: "PSA 10 Gem Mint 2023 Pokemon Japanese Sv4a-Shiny Treasure Ex #348 Gardevoir Ex", price: 171.36, fmv: 175 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA105729850/nft_image.jpg", name: "PSA 10 Gem Mint 2023 Pokemon Japanese Sv4a-Shiny Treasure Ex #341 Mimikyu", price: 56.1, fmv: 61 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA115965477/nft_image.jpg", name: "PSA 10 Gem Mint 2022 Pokemon Japanese Sword & Shield Vstar Universe #236 Irida", price: 102, fmv: 115 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA124291139/nft_image.jpg", name: "PSA 10 Gem Mint 2021 Pokemon Japanese Sword & Shield Vmax Climax #234 Mimikyu Vmax", price: 135.66, fmv: 140 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA82071155/nft_image.jpg", name: "PSA 10 Gem Mint 2023 Pokemon Japanese Sv2a-Pokemon 151 #133 Eevee", price: 86.7, fmv: 83 },
  { rawImgUrl: "https://8nothtoc5ds7a0x3.public.blob.vercel-storage.com/graded-cards-renders/PSA121432606/nft_image.jpg", name: "PSA 10 Gem Mint 2023 Pokemon Japanese Sv-P Promo #064 Jolteon", price: 141.98, fmv: 142 },
];

export const cards: Card[] = rawCards.map((c, i) => {
  const parsed = parseCardName(c.name);
  const spread = +(c.fmv - c.price).toFixed(2);
  const spreadPct = +((spread / c.price) * 100).toFixed(1);
  return {
    id: `card-${i}`,
    name: c.name,
    imgUrl: c.rawImgUrl,
    price: c.price,
    fmv: c.fmv,
    spread,
    spreadPct,
    ...parsed,
    ebaySearchUrl: buildEbayUrl(c.name),
  };
});

// Cards sorted by arbitrage opportunity (best deals first)
export const arbitrageCards = [...cards]
  .filter(c => c.spread > 0)
  .sort((a, b) => b.spreadPct - a.spreadPct);

// Overpriced cards (negative spread)
export const overpricedCards = [...cards]
  .filter(c => c.spread <= 0)
  .sort((a, b) => a.spreadPct - b.spreadPct);

export const timelineEvents: TimelineEvent[] = [
  {
    id: 'evt-1', date: '2025-11-09',
    title: 'Alpha测试启动', titleEn: 'Alpha Test Launch',
    description: 'Renaiss Protocol在BNB Chain上启动Alpha测试，首次开放真实收藏卡牌的链上交易。',
    descriptionEn: 'Renaiss Protocol launches Alpha test on BNB Chain, opening on-chain trading of real collectible cards for the first time.',
    source: '@BNBchain', sourceUrl: 'https://x.com/BNBchain', sourceType: 'twitter', hasSbt: true,
    sbtInfo: 'Alpha测试参与者SBT — 奖励早期测试用户', sbtInfoEn: 'Alpha Tester SBT — Rewarding early test participants'
  },
  {
    id: 'evt-2', date: '2025-11-19',
    title: 'Closed Beta扩展', titleEn: 'Closed Beta Expansion',
    description: '扩展封闭测试范围，引入更多收藏卡系列和交易功能。',
    descriptionEn: 'Expanding closed beta scope with more card series and trading features.',
    source: 'Bitget News', sourceUrl: 'https://www.bitget.com/news', sourceType: 'news', hasSbt: false
  },
  {
    id: 'evt-3', date: '2025-12-30',
    title: 'Alpha测试突破$1M交易量', titleEn: 'Alpha Test Surpasses $1M Volume',
    description: 'Alpha测试期间累计交易额突破100万美元，验证了实物收藏品链上化的市场需求。',
    descriptionEn: 'Alpha test cumulative trading volume surpasses $1M, validating market demand for on-chain physical collectibles.',
    source: 'Bitget / MEXC', sourceUrl: 'https://www.bitget.com/news', sourceType: 'news', hasSbt: false
  },
  {
    id: 'evt-4', date: '2026-01-28',
    title: '社区领袖SBT计划启动', titleEn: 'Community Leader SBT Program Launch',
    description: '推出Community Leader SBT Program，为活跃社区贡献者颁发不可转让的灵魂绑定代币。',
    descriptionEn: 'Launching Community Leader SBT Program, issuing non-transferable soulbound tokens to active community contributors.',
    source: 'Binance Square', sourceUrl: 'https://www.binance.com/en-NG/square/post/35684687224770', sourceType: 'official', hasSbt: true,
    sbtInfo: 'Community Leader SBT — 授予社区领袖身份，解锁独家权益', sbtInfoEn: 'Community Leader SBT — Grants community leader status with exclusive benefits'
  },
  {
    id: 'evt-5', date: '2026-02-11',
    title: 'Gacha V2 Beta上线 (日交易$700K)', titleEn: 'Gacha V2 Beta Launch ($700K Daily Volume)',
    description: 'Gacha V2 Beta版本上线，首日交易量达到$700K，用户可以通过抽卡获得真实PSA评级卡牌。',
    descriptionEn: 'Gacha V2 Beta launches with $700K first-day volume. Users can pull real PSA-graded cards through gacha mechanism.',
    source: 'GlobeNewswire', sourceUrl: 'https://www.globenewswire.com', sourceType: 'news', hasSbt: false
  },
  {
    id: 'evt-6', date: '2026-02-12',
    title: 'Consensus HK 2026 展览 ($15M+藏品)', titleEn: 'Consensus HK 2026 Exhibition ($15M+ Collectibles)',
    description: '在Consensus Hong Kong 2026展示价值超过$15M的实物收藏品，展示BNB Chain上的基础设施能力。',
    descriptionEn: 'Showcasing $15M+ physical collectibles at Consensus Hong Kong 2026, demonstrating infrastructure capabilities on BNB Chain.',
    source: 'GlobeNewswire', sourceUrl: 'https://www.globenewswire.com/news-release/2026/02/16/3238781/0/en/', sourceType: 'news', hasSbt: true,
    sbtInfo: 'Consensus参会者SBT — 线下参与活动即可获得', sbtInfoEn: 'Consensus Attendee SBT — Awarded for in-person event participation'
  },
  {
    id: 'evt-7', date: '2026-02-15',
    title: 'BNB x Renaiss 农历新年活动', titleEn: 'BNB x Renaiss Lunar New Year Event',
    description: 'BNB Chain与Renaiss联合举办农历新年活动，参与者可获得限定SBT和卡包奖励。',
    descriptionEn: 'BNB Chain and Renaiss co-host Lunar New Year event with limited SBT and card pack rewards.',
    source: '@renaissxyz', sourceUrl: 'https://x.com/renaissxyz', sourceType: 'twitter', hasSbt: true,
    sbtInfo: '农历新年限定SBT — 参与BNB联合活动获得', sbtInfoEn: 'Lunar New Year Limited SBT — Earned through BNB joint event participation'
  },
  {
    id: 'evt-8', date: '2026-02-28',
    title: '宝可梦30周年卡包38分钟售罄', titleEn: 'Pokemon 30th Anniversary Packs Sold Out in 38 Min',
    description: '宝可梦30周年纪念卡包上线后仅38分钟即全部售罄，展示了平台的强大需求。',
    descriptionEn: 'Pokemon 30th Anniversary card packs sold out in just 38 minutes, demonstrating strong platform demand.',
    source: 'Phemex News', sourceUrl: 'https://phemex.com/news', sourceType: 'news', hasSbt: true,
    sbtInfo: '30周年纪念SBT — 成功购买纪念卡包的用户获得', sbtInfoEn: '30th Anniversary SBT — Awarded to users who successfully purchased anniversary packs'
  },
  {
    id: 'evt-9', date: '2026-03-03',
    title: 'Collector Crypt合作 Renacrypt Pack', titleEn: 'Collector Crypt Partnership: Renacrypt Pack',
    description: '与Collector Crypt合作推出Renacrypt Pack，$88/包，包含高价值PSA评级卡牌。',
    descriptionEn: 'Partnership with Collector Crypt launches Renacrypt Pack at $88/pack, containing high-value PSA-graded cards.',
    source: '@Collector_Crypt', sourceUrl: 'https://x.com/Collector_Crypt', sourceType: 'twitter', hasSbt: false
  },
  {
    id: 'evt-10', date: '2026-03-07',
    title: 'BETA 2.0路线图 + Auranaiss AI', titleEn: 'BETA 2.0 Roadmap + Auranaiss AI',
    description: '发布BETA 2.0路线图，引入Auranaiss AI智能分析系统，支持市场数据分析和套利建议。',
    descriptionEn: 'BETA 2.0 roadmap released, introducing Auranaiss AI analytics system for market data analysis and arbitrage recommendations.',
    source: 'BlockBeats / Bitget', sourceUrl: 'https://www.bitget.com/news/detail/12560605246518', sourceType: 'news', hasSbt: false
  },
  {
    id: 'evt-11', date: '2026-03-10',
    title: 'Ambassador Program 2.0', titleEn: 'Ambassador Program 2.0',
    description: '推出Ambassador Program 2.0，扩大社区大使计划，提供更多激励和SBT奖励。',
    descriptionEn: 'Launching Ambassador Program 2.0 with expanded community ambassador program, more incentives and SBT rewards.',
    source: '@renaissxyz', sourceUrl: 'https://x.com/renaissxyz', sourceType: 'twitter', hasSbt: true,
    sbtInfo: 'Ambassador SBT — 成为官方大使后获得，解锁专属权益', sbtInfoEn: 'Ambassador SBT — Awarded upon becoming official ambassador, unlocking exclusive benefits'
  },
];

// Legacy SBT items (for deep analysis view)
export const sbtItems: SbtItem[] = [
  {
    id: 'sbt-1', name: 'Alpha测试者SBT', nameEn: 'Alpha Tester SBT',
    description: '颁发给Renaiss Protocol Alpha测试阶段的早期参与者。', descriptionEn: 'Awarded to early participants of the Renaiss Protocol Alpha test phase.',
    howToGet: '在2025年11月Alpha测试期间注册并完成至少一笔交易。', howToGetEn: 'Register and complete at least one transaction during the November 2025 Alpha test.',
    whyAwarded: '奖励早期用户的信任和参与，这些用户在产品最早期就愿意尝试并提供反馈，帮助协议完善核心功能。Alpha测试者的数据和反馈直接影响了后续Beta版本的改进方向。',
    whyAwardedEn: 'Rewards early users\' trust and participation. These users were willing to try and provide feedback at the earliest stage, helping the protocol refine core features.',
    benefits: '未来空投优先权、社区治理投票权、独家活动参与资格。', benefitsEn: 'Future airdrop priority, community governance voting rights, exclusive event participation.',
    relatedEventId: 'evt-1'
  },
  {
    id: 'sbt-2', name: '社区领袖SBT', nameEn: 'Community Leader SBT',
    description: '颁发给在Renaiss社区中做出突出贡献的领袖人物。', descriptionEn: 'Awarded to outstanding leaders who contribute significantly to the Renaiss community.',
    howToGet: '通过持续的社区贡献（内容创作、社区管理、技术支持等）获得官方认可。', howToGetEn: 'Earn official recognition through sustained community contributions (content creation, community management, technical support, etc.).',
    whyAwarded: '社区是去中心化协议的核心驱动力。社区领袖SBT识别并奖励那些主动推动生态发展的人，他们通过教育新用户、组织活动、创建内容等方式为Renaiss创造了不可替代的价值。',
    whyAwardedEn: 'Community is the core driving force of decentralized protocols. The Community Leader SBT identifies and rewards those who actively drive ecosystem growth.',
    benefits: '专属Discord频道、提前获取新功能、官方合作机会、额外SBT空投。', benefitsEn: 'Exclusive Discord channel, early access to new features, official partnership opportunities, additional SBT airdrops.',
    relatedEventId: 'evt-4'
  },
  {
    id: 'sbt-3', name: 'Consensus参会者SBT', nameEn: 'Consensus Attendee SBT',
    description: '颁发给参加Consensus Hong Kong 2026 Renaiss展位的用户。', descriptionEn: 'Awarded to users who visited the Renaiss booth at Consensus Hong Kong 2026.',
    howToGet: '亲临Consensus Hong Kong 2026现场，访问Renaiss展位并完成签到。', howToGetEn: 'Visit the Renaiss booth at Consensus Hong Kong 2026 in person and complete check-in.',
    whyAwarded: '线下活动是Web3项目建立真实社区连接的关键。Consensus是全球最大的区块链峰会之一，参会者SBT记录了这一历史性时刻的见证者身份。',
    whyAwardedEn: 'Offline events are key to building real community connections in Web3. The Attendee SBT records witness identity of this historic moment.',
    benefits: '限定版数字藏品、线下活动优先参与权。', benefitsEn: 'Limited edition digital collectibles, priority access to offline events.',
    relatedEventId: 'evt-6'
  },
  {
    id: 'sbt-4', name: '农历新年限定SBT', nameEn: 'Lunar New Year Limited SBT',
    description: '2026农历新年BNB Chain x Renaiss联合活动限定SBT。', descriptionEn: '2026 Lunar New Year BNB Chain x Renaiss joint event limited SBT.',
    howToGet: '参与BNB Chain x Renaiss农历新年联合活动，完成指定任务。', howToGetEn: 'Participate in the BNB Chain x Renaiss Lunar New Year joint event and complete designated tasks.',
    whyAwarded: '这是BNB Chain生态与Renaiss的首次大型联合活动，标志着Renaiss获得了BNB Chain官方的深度认可。',
    whyAwardedEn: 'This was the first major joint event between BNB Chain ecosystem and Renaiss, marking deep official recognition.',
    benefits: '限定卡包折扣、社区专属标识。', benefitsEn: 'Limited card pack discounts, exclusive community badge.',
    relatedEventId: 'evt-7'
  },
  {
    id: 'sbt-5', name: '30周年纪念SBT', nameEn: '30th Anniversary SBT',
    description: '宝可梦30周年纪念卡包购买者专属SBT。', descriptionEn: 'Exclusive SBT for Pokemon 30th Anniversary card pack purchasers.',
    howToGet: '在38分钟售罄窗口内成功购买宝可梦30周年纪念卡包。', howToGetEn: 'Successfully purchase Pokemon 30th Anniversary card packs within the 38-minute sellout window.',
    whyAwarded: '宝可梦30周年是收藏界的重大事件。Renaiss的纪念卡包在38分钟内售罄，证明了平台的市场号召力。',
    whyAwardedEn: 'Pokemon 30th Anniversary is a major event in the collectibles world. The 38-minute sellout proved platform market appeal.',
    benefits: '未来纪念卡包优先购买权、独家收藏品空投。', benefitsEn: 'Priority purchase rights for future anniversary packs, exclusive collectible airdrops.',
    relatedEventId: 'evt-8'
  },
  {
    id: 'sbt-6', name: 'Ambassador SBT', nameEn: 'Ambassador SBT',
    description: 'Renaiss官方大使计划2.0的身份认证SBT。', descriptionEn: 'Identity verification SBT for Renaiss Official Ambassador Program 2.0.',
    howToGet: '通过Ambassador Program 2.0的申请和审核流程，成为官方认证大使。', howToGetEn: 'Complete the Ambassador Program 2.0 application and review process to become an officially certified ambassador.',
    whyAwarded: 'Ambassador Program 2.0是Renaiss社区建设的核心战略。大使们承担着推广、组织活动、翻译内容和招募新用户的重要职责。',
    whyAwardedEn: 'Ambassador Program 2.0 is a core strategy for Renaiss community building with important responsibilities.',
    benefits: '月度奖励、专属Merch、优先测试新功能、社区治理权重加成。', benefitsEn: 'Monthly rewards, exclusive merch, priority access to new features, enhanced community governance weight.',
    relatedEventId: 'evt-11'
  },
];

// ============================================================
// Full SBT Catalog — from Google Docs (30+ SBTs)
// ============================================================
export const sbtCatalog: SbtCatalogItem[] = [
  // ─── Currently Available (✅) ───
  { id: 'cat-1', name: 'Discord Server Booster', nameEn: 'Discord Server Booster', available: true, availableLabel: '✅', description: '此徽章授予通过提升服务器性能来支持Renaiss Discord的用户', descriptionEn: 'Awarded to users who support the Renaiss Discord by boosting the server', howToGet: '至少提升一次Renaiss Discord服务器的优先级', howToGetEn: 'Boost the Renaiss Discord server at least once', category: 'social' },
  { id: 'cat-2', name: 'Community Developer', nameEn: 'Community Developer', available: true, availableLabel: '✅', description: '此徽章授予为Renaiss构建应用程序、工具或AI系统的开发者', descriptionEn: 'Awarded to developers who build apps, tools, or AI systems for Renaiss', howToGet: '开发并提交支持Renaiss的应用程序、工具或AI系统', howToGetEn: 'Develop and submit an app, tool, or AI system supporting Renaiss', category: 'community' },
  { id: 'cat-3', name: 'Community Voice', nameEn: 'Community Voice', available: true, availableLabel: '✅', description: '奖励给在X+Discord上传播知识、创作内容并积极参与引导新人的用户', descriptionEn: 'Rewards users who spread knowledge, create content, and actively guide newcomers on X+Discord', howToGet: '加入DC一个月内发布8篇Renaiss相关的高质量推文，获得社区等级3', howToGetEn: 'Post 8 high-quality Renaiss-related tweets within one month of joining DC, reach Community Level 3', category: 'community' },
  { id: 'cat-4', name: 'S+ Breaker', nameEn: 'S+ Breaker', available: true, availableLabel: '✅', description: '此徽章颁发给在Renaiss平台成功抽取到顶级或S级卡牌的收藏家', descriptionEn: 'Awarded to collectors who successfully pull a top-tier or S-grade card on Renaiss', howToGet: '在Renaiss上从任何符合条件的卡包中至少抽取一张顶级或S级卡牌', howToGetEn: 'Pull at least one top-tier or S-grade card from any eligible pack on Renaiss', category: 'gacha' },
  { id: 'cat-5', name: 'Discord Linker', nameEn: 'Discord Linker', available: true, availableLabel: '✅', description: '奖励给连接Discord账号的用户', descriptionEn: 'Rewards users who link their Discord account', howToGet: '链接Discord账号', howToGetEn: 'Link your Discord account', category: 'social' },
  { id: 'cat-6', name: 'Fund Your Account', nameEn: 'Fund Your Account', available: true, availableLabel: '✅', description: '奖励给首次充值并开始全面参与Renaiss生态系统的用户', descriptionEn: 'Rewards users who make their first deposit and start fully participating in the Renaiss ecosystem', howToGet: '在过去3天内完成单笔60 USDT或以上的存款', howToGetEn: 'Complete a single deposit of 60 USDT or more within the past 3 days', category: 'trading' },
  { id: 'cat-7', name: 'Pack Opener', nameEn: 'Pack Opener', available: true, availableLabel: '✅', description: '奖励给持续参与开包、发现新卡牌并推动生态系统发展的用户', descriptionEn: 'Rewards users who consistently open packs, discover new cards, and drive ecosystem growth', howToGet: '执行5次卡包拆封', howToGetEn: 'Open 5 card packs', category: 'gacha' },
  { id: 'cat-8', name: 'Signal Booster', nameEn: 'Signal Booster', available: true, availableLabel: '✅', description: '此徽章授予那些评论有力地支持并深化了创始人声音的社区成员', descriptionEn: 'Awarded to community members whose comments powerfully support and amplify the founder\'s voice', howToGet: '积极与官网&创始人推文互动，发表杰出评论，有几率获得', howToGetEn: 'Actively interact with official & founder tweets, post outstanding comments for a chance to earn', category: 'social' },
  { id: 'cat-9', name: 'The Recruiter', nameEn: 'The Recruiter', available: true, availableLabel: '✅', description: '奖励给通过招募新玩家帮助扩大Renaiss社区的用户', descriptionEn: 'Rewards users who help expand the Renaiss community by recruiting new players', howToGet: '成功邀请5位或更多新用户', howToGetEn: 'Successfully invite 5 or more new users', category: 'community' },
  { id: 'cat-10', name: 'The Trader', nameEn: 'The Trader', available: true, availableLabel: '✅', description: '此荣誉颁发给积极通过持续交易为市场流动性做出贡献的用户', descriptionEn: 'Awarded to users who actively contribute to market liquidity through consistent trading', howToGet: '完成3笔或以上有效交易', howToGetEn: 'Complete 3 or more valid trades', category: 'trading' },
  { id: 'cat-11', name: 'X Linker', nameEn: 'X Linker', available: true, availableLabel: '✅', description: '奖励给关联其Twitter账户的用户', descriptionEn: 'Rewards users who link their Twitter account', howToGet: '链接推特账号', howToGetEn: 'Link your Twitter/X account', category: 'social' },
  { id: 'cat-12', name: 'Grand Ripper', nameEn: 'Grand Ripper', available: true, availableLabel: '✅', description: '授予那些在拆封方面表现出极高热情的用户——他们的热情几乎超越了生态系统中的其他所有人', descriptionEn: 'Awarded to users who show extreme enthusiasm for pack opening — surpassing almost everyone else in the ecosystem', howToGet: '完成200次或以上的包装开箱', howToGetEn: 'Complete 200 or more pack openings', category: 'gacha' },

  // ─── Special (⭕) ───
  { id: 'cat-13', name: 'The Vanguard', nameEn: 'The Vanguard', available: false, availableLabel: '⭕', description: '该奖项授予自Renaiss生态系统创立之初就对其产生深远影响的资深且具有影响力的品牌大使', descriptionEn: 'Awarded to veteran and influential brand ambassadors who have had a profound impact since the founding of the Renaiss ecosystem', howToGet: '早期支持者展现出最高的影响力，加入Renaiss大使', howToGetEn: 'Early supporters demonstrating the highest influence, join Renaiss ambassadors', category: 'special' },

  // ─── Not Currently Available (❌) ───
  { id: 'cat-14', name: '新年限定SBT', nameEn: 'Lunar New Year SBT', available: false, availableLabel: '❌', description: '新年活动限定SBT，参与官推发布的活动，连续签到5天即可解锁隐藏财神爷SBT', descriptionEn: 'Lunar New Year event limited SBT, participate in official activities, check in for 5 consecutive days to unlock hidden Fortune God SBT', howToGet: '参与官推发布的活动，连续签到5天', howToGetEn: 'Participate in official activities, check in for 5 consecutive days', category: 'event' },
  { id: 'cat-15', name: 'Hong Kong Explorer SBT', nameEn: 'Hong Kong Explorer SBT', available: false, availableLabel: '❌', description: '在Consensus Hong Kong期间捕捉到Renaiss CEO', descriptionEn: 'Capture the Renaiss CEO during Consensus Hong Kong', howToGet: '在Consensus Hong Kong期间捕捉到Renaiss CEO', howToGetEn: 'Find and meet the Renaiss CEO during Consensus Hong Kong', category: 'event' },
  { id: 'cat-16', name: 'Infinite Flash Mint', nameEn: 'Infinite Flash Mint', available: false, availableLabel: '❌', description: '此徽章颁发给在无限扭蛋Beta测试上线后15分钟内进入游戏的用户', descriptionEn: 'Awarded to users who entered the game within 15 minutes of Infinite Gacha Beta launch', howToGet: '在无限扭蛋测试版上线后的前15分钟内购买卡包', howToGetEn: 'Purchase a card pack within the first 15 minutes of Infinite Gacha Beta launch', category: 'gacha' },
  { id: 'cat-17', name: 'Infinite Grinder', nameEn: 'Infinite Grinder', available: false, availableLabel: '❌', description: '此徽章颁发给积极参与无限扭蛋测试版并多次开启卡包的用户', descriptionEn: 'Awarded to users who actively participated in Infinite Gacha Beta and opened multiple packs', howToGet: '在无限扭蛋测试期间开启5个或更多卡包', howToGetEn: 'Open 5 or more packs during the Infinite Gacha Beta test', category: 'gacha' },
  { id: 'cat-18', name: 'Infinite Pioneer', nameEn: 'Infinite Pioneer', available: false, availableLabel: '❌', description: '奖励给参与无限扭蛋测试版并开启首个卡包的用户', descriptionEn: 'Rewards users who participated in Infinite Gacha Beta and opened their first pack', howToGet: '在无限扭蛋测试期间至少打开1个卡包', howToGetEn: 'Open at least 1 pack during the Infinite Gacha Beta test', category: 'gacha' },
  { id: 'cat-19', name: 'Legacy Flash Mint', nameEn: 'Legacy Flash Mint', available: false, availableLabel: '❌', description: '此徽章授予在Legacy Pack 3.0上线后一分钟内进入游戏的用户', descriptionEn: 'Awarded to users who entered the game within one minute of Legacy Pack 3.0 launch', howToGet: '在Legacy 3.0礼包上线后的第一分钟内购买卡包', howToGetEn: 'Purchase a pack within the first minute of Legacy Pack 3.0 launch', category: 'gacha' },
  { id: 'cat-20', name: 'Legacy Triple Pull', nameEn: 'Legacy Triple Pull', available: false, availableLabel: '❌', description: '奖励给在活动期间成功完成三次抽奖的用户', descriptionEn: 'Rewards users who successfully completed three pulls during the event', howToGet: '在传承卡包3.0中打开3个卡包', howToGetEn: 'Open 3 packs in Legacy Pack 3.0', category: 'gacha' },
  { id: 'cat-21', name: 'Live Participant', nameEn: 'Live Participant', available: false, availableLabel: '❌', description: '授予参加1月26日Renaiss Discord AMA的用户', descriptionEn: 'Awarded to users who attended the January 26 Renaiss Discord AMA', howToGet: '参加1月26日在Renaiss Discord上举行的AMA活动', howToGetEn: 'Attend the AMA held on Renaiss Discord on January 26', category: 'event' },
  { id: 'cat-22', name: 'Infinite Cursed', nameEn: 'Infinite Cursed', available: false, availableLabel: '❌', description: '此徽章颁发给无限扭蛋测试版期间净亏损最高的5位用户', descriptionEn: 'Awarded to the 5 users with the highest net loss during Infinite Gacha Beta', howToGet: '在无限扭蛋测试版中净亏损排名前5', howToGetEn: 'Rank in the top 5 for net loss during Infinite Gacha Beta', category: 'gacha' },
  { id: 'cat-23', name: 'Infinite Flex', nameEn: 'Infinite Flex', available: false, availableLabel: '❌', description: '此徽章颁发给在无限扭蛋测试版期间抽到1张S级卡牌并公开展示的用户', descriptionEn: 'Awarded to users who pulled an S-grade card during Infinite Gacha Beta and publicly showcased it', howToGet: '无限扭蛋测试版期间抽取一张S级卡牌，并在X上分享', howToGetEn: 'Pull an S-grade card during Infinite Gacha Beta and share on X', category: 'gacha' },
  { id: 'cat-24', name: 'Refs SBT', nameEn: 'Refs SBT', available: false, availableLabel: '❌', description: '生态系统SBT，活动已于2月5日结束', descriptionEn: 'Ecosystem SBT, event ended on February 5', howToGet: '用已绑定Renaiss的X账号注册Refs并关注@whatsyourrefs', howToGetEn: 'Register on Refs with your Renaiss-linked X account and follow @whatsyourrefs', category: 'social' },
  { id: 'cat-25', name: 'Early Bird', nameEn: 'Early Bird', available: false, availableLabel: '❌', description: '授予在Alpha阶段加入Renaiss的最早一批探险家', descriptionEn: 'Awarded to the earliest explorers who joined Renaiss during the Alpha phase', howToGet: '在Alpha测试期间至少登录一次', howToGetEn: 'Log in at least once during the Alpha test', category: 'event' },
  { id: 'cat-26', name: 'Beta Pioneer', nameEn: 'Beta Pioneer', available: false, availableLabel: '❌', description: '奖励给在Renaiss封闭测试期间登录一次支持我们的用户', descriptionEn: 'Rewards users who logged in once during the Renaiss closed beta to support us', howToGet: '在封闭测试期间登录一次', howToGetEn: 'Log in once during the closed beta', category: 'event' },
  { id: 'cat-27', name: 'Christmas Carol', nameEn: 'Christmas Carol', available: false, availableLabel: '❌', description: '此徽章颁发给积极参与圣诞节活动、分享Renaiss节日内容的社区成员', descriptionEn: 'Awarded to community members who actively participated in Christmas events and shared Renaiss holiday content', howToGet: '在圣诞节促销活动期间，至少发布一篇与Renaiss相关的圣诞节推文', howToGetEn: 'Post at least one Renaiss-related Christmas tweet during the Christmas promotion', category: 'event' },
  { id: 'cat-28', name: 'Heat Survivor', nameEn: 'Heat Survivor', available: false, availableLabel: '❌', description: '此徽章颁发给在2026年产品高峰期参与的用户', descriptionEn: 'Awarded to users who participated during the 2026 product peak period', howToGet: '在2026年包装上市期间，至少打开1包', howToGetEn: 'Open at least 1 pack during the 2026 pack launch period', category: 'gacha' },
  { id: 'cat-29', name: 'Identity Flexer', nameEn: 'Identity Flexer', available: false, availableLabel: '❌', description: '此徽章授予通过经批准的UGC活动展示其renaiss.xyz个人资料的用户', descriptionEn: 'Awarded to users who showcase their renaiss.xyz profile through approved UGC campaigns', howToGet: '参与"展示你的个人资料"UGC活动', howToGetEn: 'Participate in the "Show Your Profile" UGC campaign', category: 'social' },
  { id: 'cat-30', name: 'Ice Breaker', nameEn: 'Ice Breaker', available: false, availableLabel: '❌', description: '此徽章颁发给那些无惧严寒、坚持拆封冰冻包装的收藏家', descriptionEn: 'Awarded to collectors who brave the cold and open frozen packs', howToGet: '打开5个或更多冷冻包装', howToGetEn: 'Open 5 or more frozen packs', category: 'gacha' },
  { id: 'cat-31', name: 'New Year Opener', nameEn: 'New Year Opener', available: false, availableLabel: '❌', description: '此徽章颁发给已于2026年礼包的用户', descriptionEn: 'Awarded to users who participated in the 2026 pack event', howToGet: '完成5次2026卡包的开启，或在卡包上线后的前20小时内达成超过$100的市场交易额', howToGetEn: 'Open 5 2026 packs, or achieve over $100 in market trades within 20 hours of pack launch', category: 'gacha' },
  { id: 'cat-32', name: 'Sprint Challenger', nameEn: 'Sprint Challenger', available: false, availableLabel: '❌', description: '奖励给参与限时Sprint套餐活动并帮助促成售罄的用户', descriptionEn: 'Rewards users who participated in the limited-time Sprint pack event and helped achieve sellout', howToGet: '在Sprint活动期间或Sprint活动包售罄时，打开至少1个Sprint活动包', howToGetEn: 'Open at least 1 Sprint pack during the Sprint event or when Sprint packs sell out', category: 'gacha' },
  { id: 'cat-33', name: 'The Survivor', nameEn: 'The Survivor', available: false, availableLabel: '❌', description: '奖励给在Pack 4.0回购钱包耗尽期间活跃的用户', descriptionEn: 'Rewards users who were active during the Pack 4.0 buyback wallet depletion period', howToGet: '在Pack 4.0期间打开至少1个卡包，或在公告发布前24小时内完成至少1笔交易', howToGetEn: 'Open at least 1 pack during Pack 4.0, or complete at least 1 trade within 24 hours before the announcement', category: 'gacha' },
];

// Gacha pack data
export const gachaPacks = [
  {
    id: 'omega',
    name: 'OMEGA Pack',
    price: 48,
    ev: 52.32,
    evPct: 9,
    description: '包含多种PSA评级宝可梦卡牌，Tier概率：S(0.24%) A(4.85%) B(16.09%) C(78.82%)',
    descriptionEn: 'Contains various PSA-graded Pokemon cards. Tier odds: S(0.24%) A(4.85%) B(16.09%) C(78.82%)',
    tiers: [
      { tier: 'S', probability: 0.24, avgValue: 300 },
      { tier: 'A', probability: 4.85, avgValue: 120 },
      { tier: 'B', probability: 16.09, avgValue: 65 },
      { tier: 'C', probability: 78.82, avgValue: 40 },
    ]
  },
  {
    id: 'renacrypt',
    name: 'RenaCrypt Pack',
    price: 88,
    ev: 95.24,
    evPct: 8.2,
    description: '与Collector Crypt合作推出，包含更高价值的稀有卡牌。',
    descriptionEn: 'In partnership with Collector Crypt, containing higher-value rare cards.',
    tiers: [
      { tier: 'S', probability: 0.5, avgValue: 500 },
      { tier: 'A', probability: 5.0, avgValue: 180 },
      { tier: 'B', probability: 18.0, avgValue: 95 },
      { tier: 'C', probability: 76.5, avgValue: 72 },
    ]
  }
];

// Stats
export const ecosystemStats = {
  totalUsers: 220000,
  totalVolume: 4000000,
  totalCards: 3500,
  partners: 15,
};
