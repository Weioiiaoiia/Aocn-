/*
 * Design: Obsidian Glass — 收藏模拟器
 * Gacha概率模拟 + 投资回报计算器
 */
import { useLang } from '@/contexts/LanguageContext';
import { gachaPacks } from '@/lib/data';
import { Dice6, Calculator, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';

const GACHA_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663427415692/ByMrgW2BXPeym8jL7YKc6Z/gacha-machine-b7xgWxf6UqEFYU4Rfez3Bm.webp';

interface SimResult {
  tier: string;
  value: number;
  profit: number;
}

export default function Simulator() {
  const { t } = useLang();
  const [selectedPack, setSelectedPack] = useState(gachaPacks[0]);
  const [budget, setBudget] = useState(500);
  const [results, setResults] = useState<SimResult[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  // ROI Calculator
  const [buyPrice, setBuyPrice] = useState(100);
  const [sellPrice, setSellPrice] = useState(130);
  const platformFee = 0.05; // 5% fee

  const simulate = useCallback(() => {
    const numPacks = Math.floor(budget / selectedPack.price);
    const newResults: SimResult[] = [];
    let spent = 0;
    let value = 0;

    for (let i = 0; i < numPacks; i++) {
      const roll = Math.random() * 100;
      let cumulative = 0;
      for (const tier of selectedPack.tiers) {
        cumulative += tier.probability;
        if (roll <= cumulative) {
          const variance = 0.7 + Math.random() * 0.6; // 70%-130% of avg
          const cardValue = +(tier.avgValue * variance).toFixed(2);
          newResults.push({
            tier: tier.tier,
            value: cardValue,
            profit: +(cardValue - selectedPack.price).toFixed(2),
          });
          spent += selectedPack.price;
          value += cardValue;
          break;
        }
      }
    }

    setResults(newResults);
    setTotalSpent(spent);
    setTotalValue(+value.toFixed(2));
  }, [budget, selectedPack]);

  const roi = sellPrice > 0 ? +(((sellPrice * (1 - platformFee) - buyPrice) / buyPrice) * 100).toFixed(1) : 0;
  const netProfit = +(sellPrice * (1 - platformFee) - buyPrice).toFixed(2);

  const tierColors: Record<string, string> = {
    S: 'text-amber-400 bg-amber-500/15 border-amber-500/25',
    A: 'text-purple-400 bg-purple-500/15 border-purple-500/25',
    B: 'text-blue-400 bg-blue-500/15 border-blue-500/25',
    C: 'text-white/50 bg-white/[0.05] border-white/[0.08]',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white/90 mb-2">{t('收藏模拟器', 'Collection Simulator')}</h1>
        <p className="text-sm text-white/40">
          {t(
            '基于真实Tier概率分布模拟开包结果，计算投资回报率。',
            'Simulate pack openings based on real tier probability distributions and calculate ROI.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gacha Simulator */}
        <div>
          <h2 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
            <Dice6 className="w-4 h-4 text-emerald-400/60" />
            {t('抽卡模拟', 'Gacha Simulator')}
          </h2>

          <div className="glass-card rounded-xl p-5">
            {/* Pack selection */}
            <div className="flex gap-2 mb-4">
              {gachaPacks.map(pack => (
                <button
                  key={pack.id}
                  onClick={() => { setSelectedPack(pack); setResults([]); }}
                  className={`flex-1 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                    selectedPack.id === pack.id
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.05]'
                  }`}
                >
                  {pack.name} (${pack.price})
                </button>
              ))}
            </div>

            {/* Budget input */}
            <div className="mb-4">
              <label className="text-[11px] text-white/35 mb-1 block">{t('预算 (USD)', 'Budget (USD)')}</label>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm bg-white/[0.04] border border-white/[0.06] text-white/70 focus:outline-none focus:border-emerald-500/30"
              />
              <p className="text-[10px] text-white/25 mt-1">
                {t(`可开 ${Math.floor(budget / selectedPack.price)} 包`, `Can open ${Math.floor(budget / selectedPack.price)} packs`)}
              </p>
            </div>

            {/* Simulate button */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={simulate}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
              >
                {t('开始模拟', 'Simulate')}
              </button>
              <button
                onClick={() => setResults([])}
                className="px-3 py-2.5 rounded-lg text-sm bg-white/[0.05] text-white/40 hover:bg-white/[0.08] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg bg-white/[0.03] p-3">
                    <div className="text-[10px] text-white/30">{t('总投入', 'Total Spent')}</div>
                    <div className="text-lg font-mono font-bold text-white/70">${totalSpent}</div>
                  </div>
                  <div className={`rounded-lg p-3 ${totalValue > totalSpent ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    <div className="text-[10px] text-white/30">{t('总价值', 'Total Value')}</div>
                    <div className={`text-lg font-mono font-bold ${totalValue > totalSpent ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${totalValue}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-white/30 mb-2">
                  {t('模拟结果', 'Simulation Results')} ({results.length} {t('包', 'packs')})
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-1 rounded bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${tierColors[r.tier]}`}>
                          {r.tier}
                        </span>
                        <span className="text-[11px] text-white/40">#{i + 1}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-white/50">${r.value}</span>
                        <span className={`text-[10px] font-mono ${r.profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {r.profit > 0 ? '+' : ''}{r.profit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.length === 0 && (
              <div className="text-center py-6">
                <img src={GACHA_IMG} alt="Gacha" className="w-28 mx-auto rounded-xl mb-3 opacity-30" />
                <p className="text-[11px] text-white/25">{t('设置预算后点击"开始模拟"', 'Set budget and click "Simulate"')}</p>
              </div>
            )}
          </div>
        </div>

        {/* ROI Calculator */}
        <div>
          <h2 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400/60" />
            {t('投资回报计算器', 'ROI Calculator')}
          </h2>

          <div className="glass-card rounded-xl p-5">
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-white/35 mb-1 block">{t('买入价格 (USD)', 'Buy Price (USD)')}</label>
                <input
                  type="number"
                  value={buyPrice}
                  onChange={e => setBuyPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white/[0.04] border border-white/[0.06] text-white/70 focus:outline-none focus:border-emerald-500/30"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/35 mb-1 block">{t('目标卖出价格 (USD)', 'Target Sell Price (USD)')}</label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={e => setSellPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white/[0.04] border border-white/[0.06] text-white/70 focus:outline-none focus:border-emerald-500/30"
                />
              </div>

              <div className="border-t border-white/[0.04] pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-white/40">{t('平台手续费 (5%)', 'Platform Fee (5%)')}</span>
                  <span className="text-[12px] font-mono text-red-400">-${(sellPrice * platformFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-white/40">{t('净收入', 'Net Revenue')}</span>
                  <span className="text-[12px] font-mono text-white/60">${(sellPrice * (1 - platformFee)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-white/40">{t('净利润', 'Net Profit')}</span>
                  <span className={`text-lg font-mono font-bold ${netProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {netProfit > 0 ? '+' : ''}${netProfit}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/[0.04]">
                  <span className="text-[12px] font-semibold text-white/50">ROI</span>
                  <span className={`text-2xl font-mono font-bold ${roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {roi > 0 ? '+' : ''}{roi}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="glass-card rounded-xl p-5 mt-4">
            <h3 className="text-[12px] font-semibold text-white/50 mb-3">{t('风险评估指南', 'Risk Assessment Guide')}</h3>
            <div className="space-y-2">
              {[
                { level: t('低风险', 'Low Risk'), color: 'text-emerald-400 bg-emerald-500/10', desc: t('FMV价差 > 15%，高流动性卡牌（Charizard, Pikachu等）', 'FMV spread > 15%, high liquidity cards (Charizard, Pikachu, etc.)') },
                { level: t('中风险', 'Medium Risk'), color: 'text-amber-400 bg-amber-500/10', desc: t('FMV价差 5-15%，中等流动性，需要一定持有时间', 'FMV spread 5-15%, moderate liquidity, requires holding period') },
                { level: t('高风险', 'High Risk'), color: 'text-red-400 bg-red-500/10', desc: t('FMV价差 < 5% 或负价差，低流动性或冷门卡牌', 'FMV spread < 5% or negative, low liquidity or niche cards') },
              ].map(item => (
                <div key={item.level} className="flex items-start gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${item.color} shrink-0 mt-0.5`}>{item.level}</span>
                  <span className="text-[11px] text-white/35">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
