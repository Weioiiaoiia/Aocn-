/*
 * AOCN Arbitrage — Card style matching reference image 2
 * Large card images, green arbitrage badges, profit display, search/filter
 */
import { useLang } from '@/contexts/LanguageContext';
import { arbitrageCards, overpricedCards, gachaPacks, type Card } from '@/lib/data';
import { TrendingUp, TrendingDown, ExternalLink, Search, Filter, Package, ArrowUpDown, Share2, Sparkles, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';

type SortKey = 'spreadPct' | 'price' | 'fmv' | 'grade';
type SortDir = 'asc' | 'desc';

function shareToTwitter(card: Card) {
  const text = encodeURIComponent(
    `Found a ${card.spreadPct > 0 ? '+' : ''}${card.spreadPct}% arbitrage opportunity on @renaissxyz!\n\n` +
    `${card.name}\nListed: $${card.price} | FMV: $${card.fmv}\n\n` +
    `Analyzed by @Aocn_renaiss #AOCN #Renaiss #TCG`
  );
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

function gradeToNum(grade: string): number {
  const m = grade.match(/\d+/);
  return m ? parseInt(m[0]) : 0;
}

function CardDetail({ card, onClose }: { card: Card; onClose: () => void }) {
  const { t } = useLang();
  const isPositive = card.spread > 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-background overflow-hidden shadow-2xl"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex flex-col md:flex-row">
          {/* Card Image */}
          <div className="md:w-64 shrink-0 bg-secondary dark:bg-[#111118] p-6 flex items-center justify-center relative">
            <img src={card.imgUrl} alt={card.name} className="max-h-72 object-contain rounded-lg" />
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 dark:bg-black/50 backdrop-blur-sm">
              <div className="live-dot" />
              <span className="text-[9px] text-muted-foreground">LIVE</span>
            </div>
          </div>
          {/* Info */}
          <div className="flex-1 p-6">
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="mb-4">
              <span className="inline-block badge-grade px-2 py-0.5 rounded-md text-[10px] mb-2">
                {card.grade}
              </span>
              <h3 className="text-sm font-semibold text-foreground leading-relaxed">{card.name}</h3>
            </div>

            {/* Price comparison */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-secondary dark:bg-white/[0.04] p-3">
                <div className="text-[10px] text-muted-foreground mb-1">{t('挂牌价', 'Listed Price')}</div>
                <div className="text-lg font-mono font-bold text-foreground">${card.price}</div>
              </div>
              <div className="rounded-xl bg-secondary dark:bg-white/[0.04] p-3">
                <div className="text-[10px] text-muted-foreground mb-1">FMV</div>
                <div className="text-lg font-mono font-bold text-primary">${card.fmv}</div>
              </div>
              <div className={`rounded-xl p-3 ${isPositive ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                <div className="text-[10px] text-muted-foreground mb-1">{t('套利空间', 'Spread')}</div>
                <div className={`text-lg font-mono font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{card.spreadPct}%
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="rounded-xl bg-secondary dark:bg-white/[0.03] p-4 mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">{t('套利逻辑分析', 'Arbitrage Analysis')}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isPositive
                  ? t(
                      `该卡牌当前挂牌价 $${card.price} 低于公允市场价值(FMV) $${card.fmv}，存在 $${card.spread} 的价差空间（${card.spreadPct}%）。买入后以FMV价格卖出可获得约 ${card.spreadPct}% 的利润。建议关注市场流动性和卖出时间成本。`,
                      `This card is listed at $${card.price}, below its Fair Market Value (FMV) of $${card.fmv}, presenting a $${card.spread} spread (${card.spreadPct}%). Buying and reselling at FMV could yield approximately ${card.spreadPct}% profit.`
                    )
                  : t(
                      `该卡牌当前挂牌价 $${card.price} 高于公允市场价值(FMV) $${card.fmv}，溢价 ${Math.abs(card.spreadPct)}%。不建议在当前价格买入。`,
                      `This card is listed at $${card.price}, above its FMV of $${card.fmv}, with a ${Math.abs(card.spreadPct)}% premium. Not recommended at current price.`
                    )
                }
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <a
                href={`https://www.renaiss.xyz/marketplace`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold btn-primary"
              >
                {t('查看详情', 'View Details')} <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => shareToTwitter(card)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <a
                href={card.ebaySearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium btn-secondary"
              >
                <Search className="w-3.5 h-3.5" />
                eBay
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Arbitrage() {
  const { t } = useLang();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('positive');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('spreadPct');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filteredCards = useMemo(() => {
    let cards = filter === 'positive' ? arbitrageCards
      : filter === 'negative' ? overpricedCards
      : [...arbitrageCards, ...overpricedCards];

    if (searchQuery) {
      cards = cards.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return [...cards].sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case 'spreadPct': diff = a.spreadPct - b.spreadPct; break;
        case 'price': diff = a.price - b.price; break;
        case 'fmv': diff = a.fmv - b.fmv; break;
        case 'grade': diff = gradeToNum(a.grade) - gradeToNum(b.grade); break;
      }
      return sortDir === 'desc' ? -diff : diff;
    });
  }, [filter, searchQuery, sortKey, sortDir]);

  return (
    <div>
      <AnimatePresence>
        {selectedCard && <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />}
      </AnimatePresence>

      {/* Header — matching reference image 2 style */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">{t('市场扫描', 'Market Scanner')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('发现低于市场价的宝可梦卡牌', 'Discover Pokemon cards listed below market value')}
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('搜索卡片名称...', 'Search card name...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-secondary dark:bg-white/[0.04] border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter(filter === 'positive' ? 'all' : 'positive')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              filter === 'positive'
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-secondary dark:bg-white/[0.04] text-muted-foreground border-border hover:border-primary/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {t('仅显示套利机会', 'Arbitrage Only')}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-secondary dark:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            {t('刷新', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Gacha EV Section */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-500" />
          {t('抽卡正期望值分析', 'Gacha Positive EV Analysis')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gachaPacks.map(pack => (
            <div key={pack.id} className="glass-card p-5 card-positive">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">{pack.name}</h3>
                <span className="badge-arb px-2.5 py-1 rounded-full text-[11px]">
                  +{pack.evPct}% EV
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-[10px] text-muted-foreground">{t('包价', 'Pack Price')}</div>
                  <div className="text-xl font-mono font-bold text-foreground">${pack.price}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">{t('期望值', 'Expected Value')}</div>
                  <div className="text-xl font-mono font-bold text-green-500">${pack.ev}</div>
                </div>
              </div>
              <div className="flex gap-1.5">
                {pack.tiers.map(tier => (
                  <div key={tier.tier} className="flex-1 rounded-lg bg-secondary dark:bg-white/[0.04] p-2 text-center">
                    <div className="text-[10px] font-bold text-foreground">Tier {tier.tier}</div>
                    <div className="text-[10px] text-muted-foreground">{tier.probability}%</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sort + Filter tabs */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5">
          {[
            { id: 'positive' as const, label: t('低于FMV', 'Below FMV'), icon: TrendingUp },
            { id: 'negative' as const, label: t('高于FMV', 'Above FMV'), icon: TrendingDown },
            { id: 'all' as const, label: t('全部', 'All'), icon: Filter },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent'
              }`}
            >
              <f.icon className="w-3 h-3" />
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
          {[
            { key: 'spreadPct' as SortKey, label: t('涨幅', 'Spread') },
            { key: 'price' as SortKey, label: t('价格', 'Price') },
            { key: 'fmv' as SortKey, label: 'FMV' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => toggleSort(s.key)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                sortKey === s.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label} {sortKey === s.key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Card count */}
      <div className="text-xs text-muted-foreground mb-4">
        {t(`共 ${filteredCards.length} 张卡牌`, `${filteredCards.length} cards total`)}
      </div>

      {/* Cards Grid — Reference image 2 style: 3 columns, large images */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCards.map((card, i) => {
          const isPositive = card.spread > 0;
          return (
            <motion.div
              key={card.id}
              className="glass-card overflow-hidden cursor-pointer group"
              onClick={() => setSelectedCard(card)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.5) }}
            >
              {/* Image area */}
              <div className="aspect-[4/5] bg-secondary dark:bg-[#111118] relative overflow-hidden">
                <img
                  src={card.imgUrl}
                  alt={card.name}
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {/* Grade badge top-left */}
                <div className="absolute top-3 left-3 badge-grade px-2.5 py-1 rounded-lg text-xs font-bold">
                  {card.grade}
                </div>
                {/* Arbitrage badge top-right */}
                {isPositive && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    {t('套利机会', 'Arbitrage')}
                  </div>
                )}
                {!isPositive && (
                  <div className="absolute top-3 right-3 bg-red-500/80 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    {t('溢价', 'Overpriced')}
                  </div>
                )}
                {/* Renaiss watermark */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/70 dark:bg-black/50 backdrop-blur-sm">
                  <div className="live-dot" />
                  <span className="text-[9px] text-muted-foreground font-medium">renaiss</span>
                </div>
                {/* Heart/favorite */}
                <button className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-background/70 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors" onClick={e => e.stopPropagation()}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
              </div>

              {/* Card info */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-foreground line-clamp-2 mb-1 leading-snug">{card.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{card.set}</p>

                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-[10px] text-muted-foreground">{t('挂牌价', 'Listed')}</div>
                    <div className="text-xl font-bold font-mono text-foreground">${card.price.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">{t('参考价', 'FMV')}</div>
                    <div className="text-xl font-bold font-mono text-muted-foreground">${card.fmv.toFixed(2)}</div>
                  </div>
                </div>

                {/* Profit bar */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${isPositive ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                  <span className="text-xs text-muted-foreground">{t('潜在利润', 'Potential Profit')}</span>
                  <span className={`text-sm font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{card.spreadPct}% (${isPositive ? '+' : ''}{card.spread.toFixed(2)})
                  </span>
                </div>

                {/* Suggestion text */}
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  {isPositive
                    ? t('建议等待更多市场数据后再做决策。', 'Recommend waiting for more market data before deciding.')
                    : t('当前价格高于市场价，不建议买入。', 'Currently overpriced, not recommended to buy.')
                  }
                </p>

                {/* View details button */}
                <a
                  href="https://www.renaiss.xyz/marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold btn-primary"
                  onClick={e => e.stopPropagation()}
                >
                  {t('查看详情', 'View Details')} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Data source note */}
      <div className="mt-8 text-center text-xs text-muted-foreground/50">
        {t('数据来源: Renaiss Protocol 官方市场 (renaiss.xyz) | 实时监控中', 'Data source: Renaiss Protocol Official Marketplace (renaiss.xyz) | Live monitoring')}
      </div>
    </div>
  );
}
