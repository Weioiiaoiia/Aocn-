/*
 * Design: Obsidian Glass — 套利分析中心
 * 真实Renaiss市场卡牌 + eBay一键搜索 + 套利逻辑分析
 */
import { useLang } from '@/contexts/LanguageContext';
import { arbitrageCards, overpricedCards, gachaPacks, type Card } from '@/lib/data';
import { TrendingUp, TrendingDown, ExternalLink, Search, Filter, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

function CardDetail({ card, onClose }: { card: Card; onClose: () => void }) {
  const { t } = useLang();
  const isPositive = card.spread > 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-2xl rounded-2xl border border-white/[0.08] overflow-hidden"
        style={{ background: 'rgba(16,16,20,0.95)' }}
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex flex-col md:flex-row">
          {/* Card Image */}
          <div className="md:w-64 shrink-0 bg-black/40 p-6 flex items-center justify-center">
            <img src={card.imgUrl} alt={card.name} className="max-h-72 object-contain rounded-lg" />
          </div>
          {/* Info */}
          <div className="flex-1 p-6">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60 text-lg">✕</button>
            <div className="mb-3">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 mb-2">
                {card.grade}
              </span>
              <h3 className="text-sm font-medium text-white/85 leading-relaxed">{card.name}</h3>
            </div>

            {/* Price comparison */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-white/[0.03] p-3">
                <div className="text-[10px] text-white/30 mb-1">{t('挂牌价', 'Listed Price')}</div>
                <div className="text-lg font-mono font-bold text-white/80">${card.price}</div>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3">
                <div className="text-[10px] text-white/30 mb-1">FMV</div>
                <div className="text-lg font-mono font-bold text-emerald-400">${card.fmv}</div>
              </div>
              <div className={`rounded-lg p-3 ${isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                <div className="text-[10px] text-white/30 mb-1">{t('套利空间', 'Spread')}</div>
                <div className={`text-lg font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{card.spreadPct}%
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="rounded-lg bg-white/[0.03] p-3 mb-4">
              <h4 className="text-[11px] font-semibold text-white/50 mb-2">{t('套利逻辑分析', 'Arbitrage Analysis')}</h4>
              <p className="text-[11px] text-white/40 leading-relaxed">
                {isPositive
                  ? t(
                      `该卡牌当前挂牌价 $${card.price} 低于公允市场价值(FMV) $${card.fmv}，存在 $${card.spread} 的价差空间（${card.spreadPct}%）。买入后以FMV价格卖出可获得约 ${card.spreadPct}% 的利润。建议关注市场流动性和卖出时间成本。`,
                      `This card is listed at $${card.price}, below its Fair Market Value (FMV) of $${card.fmv}, presenting a $${card.spread} spread (${card.spreadPct}%). Buying and reselling at FMV could yield approximately ${card.spreadPct}% profit. Consider market liquidity and time-to-sell.`
                    )
                  : t(
                      `该卡牌当前挂牌价 $${card.price} 高于公允市场价值(FMV) $${card.fmv}，溢价 ${Math.abs(card.spreadPct)}%。不建议在当前价格买入，建议等待价格回调或寻找其他套利机会。`,
                      `This card is listed at $${card.price}, above its FMV of $${card.fmv}, with a ${Math.abs(card.spreadPct)}% premium. Not recommended to buy at current price. Wait for price correction or seek other opportunities.`
                    )
                }
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <a
                href={card.ebaySearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                {t('在eBay上搜索此卡', 'Search on eBay')}
              </a>
              <a
                href="https://www.renaiss.xyz/marketplace"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-medium bg-white/[0.06] text-white/70 hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Renaiss
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

  const displayCards = filter === 'positive' ? arbitrageCards
    : filter === 'negative' ? overpricedCards
    : [...arbitrageCards, ...overpricedCards];

  const filteredCards = searchQuery
    ? displayCards.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : displayCards;

  return (
    <div>
      <AnimatePresence>
        {selectedCard && <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white/90 mb-2">{t('套利情报中心', 'Arbitrage Intel Center')}</h1>
        <p className="text-sm text-white/40">
          {t(
            '100% 真实数据来自 Renaiss Protocol 市场。点击卡牌查看详细分析和eBay对比价格。',
            '100% real data from Renaiss Protocol marketplace. Click any card for detailed analysis and eBay price comparison.'
          )}
        </p>
      </div>

      {/* Gacha EV Section */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-400/60" />
          {t('抽卡正期望值分析', 'Gacha Positive EV Analysis')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {gachaPacks.map(pack => (
            <div key={pack.id} className="glass-card rounded-xl p-4 card-arbitrage-positive">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/80">{pack.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                  +{pack.evPct}% EV
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-[10px] text-white/30">{t('包价', 'Pack Price')}</div>
                  <div className="text-lg font-mono font-bold text-white/70">${pack.price}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/30">{t('期望值', 'Expected Value')}</div>
                  <div className="text-lg font-mono font-bold text-emerald-400">${pack.ev}</div>
                </div>
              </div>
              <div className="flex gap-1.5">
                {pack.tiers.map(tier => (
                  <div key={tier.tier} className="flex-1 rounded-md bg-white/[0.03] p-2 text-center">
                    <div className="text-[10px] font-bold text-white/50">Tier {tier.tier}</div>
                    <div className="text-[10px] text-white/30">{tier.probability}%</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1.5">
          {[
            { id: 'positive' as const, label: t('低于FMV', 'Below FMV'), icon: TrendingUp },
            { id: 'negative' as const, label: t('高于FMV', 'Above FMV'), icon: TrendingDown },
            { id: 'all' as const, label: t('全部', 'All'), icon: Filter },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all ${
                filter === f.id
                  ? 'bg-white/[0.08] text-white/80 border border-white/[0.12]'
                  : 'text-white/35 hover:text-white/50 hover:bg-white/[0.03]'
              }`}
            >
              <f.icon className="w-3 h-3" />
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input
            type="text"
            placeholder={t('搜索卡牌名称...', 'Search card name...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg text-[12px] bg-white/[0.04] border border-white/[0.06] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/30"
          />
        </div>
      </div>

      {/* Card count */}
      <div className="text-[11px] text-white/25 mb-3">
        {t(`共 ${filteredCards.length} 张卡牌`, `${filteredCards.length} cards total`)}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredCards.map((card, i) => {
          const isPositive = card.spread > 0;
          return (
            <motion.div
              key={card.id}
              className={`glass-card rounded-xl overflow-hidden cursor-pointer ${isPositive ? 'card-arbitrage-positive' : 'card-arbitrage-negative'}`}
              onClick={() => setSelectedCard(card)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
              whileHover={{ y: -4 }}
            >
              <div className="aspect-square bg-black/30 relative overflow-hidden">
                <img
                  src={card.imgUrl}
                  alt={card.name}
                  className="w-full h-full object-contain p-2"
                  loading="lazy"
                />
                <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  isPositive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {isPositive ? '+' : ''}{card.spreadPct}%
                </div>
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/20">
                  {card.grade}
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-[10px] text-white/50 line-clamp-2 mb-2 leading-relaxed h-8">{card.pokemonName || card.name.split('#').pop()}</p>
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-mono font-semibold text-white/70">${card.price}</div>
                  <div className={`text-[11px] font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    FMV ${card.fmv}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Data source note */}
      <div className="mt-6 text-center text-[10px] text-white/15">
        {t('数据来源: Renaiss Protocol 官方市场 (renaiss.xyz) | 最后更新: 2026-03-13', 'Data source: Renaiss Protocol Official Marketplace (renaiss.xyz) | Last updated: 2026-03-13')}
      </div>
    </div>
  );
}
