/*
 * AOCN Simulator — Collection Simulator with accurate data
 * Uses real card data from Renaiss API for collection value estimation
 */
import { useLang } from '@/contexts/LanguageContext';
import { gachaPacks, type Card } from '@/lib/data';
import { fetchCards } from '@/lib/api';
import { Dice6, Calculator, RotateCcw, Wallet, Plus, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

const GACHA_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663427415692/ByMrgW2BXPeym8jL7YKc6Z/gacha-machine-b7xgWxf6UqEFYU4Rfez3Bm.webp';

interface SimResult { tier: string; value: number; profit: number; }
interface CollectionItem { name: string; quantity: number; currentPrice: number; fmv: number; }

export default function Simulator() {
  const { t } = useLang();
  const [selectedPack, setSelectedPack] = useState(gachaPacks[0]);
  const [budget, setBudget] = useState(500);
  const [results, setResults] = useState<SimResult[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [buyPrice, setBuyPrice] = useState(100);
  const [sellPrice, setSellPrice] = useState(130);
  const platformFee = 0.05;
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [marketCards, setMarketCards] = useState<Card[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(true);

  // Fetch real market data for collection estimator
  useEffect(() => {
    fetchCards({ offset: 0, limit: 50, sortBy: 'fmv', sortOrder: 'desc', listedOnly: true })
      .then(resp => {
        setMarketCards(resp.cards);
        // Pre-fill collection with top 3 real cards
        if (resp.cards.length >= 3) {
          setCollection([
            { name: resp.cards[0].name.split('#').pop()?.trim() || resp.cards[0].name, quantity: 1, currentPrice: resp.cards[0].price, fmv: resp.cards[0].fmv },
            { name: resp.cards[1].name.split('#').pop()?.trim() || resp.cards[1].name, quantity: 1, currentPrice: resp.cards[1].price, fmv: resp.cards[1].fmv },
            { name: resp.cards[2].name.split('#').pop()?.trim() || resp.cards[2].name, quantity: 1, currentPrice: resp.cards[2].price, fmv: resp.cards[2].fmv },
          ]);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMarket(false));
  }, []);

  const simulate = useCallback(() => {
    const numPacks = Math.floor(budget / selectedPack.price);
    const newResults: SimResult[] = [];
    let spent = 0, value = 0;
    for (let i = 0; i < numPacks; i++) {
      const roll = Math.random() * 100;
      let cumulative = 0;
      for (const tier of selectedPack.tiers) {
        cumulative += tier.probability;
        if (roll <= cumulative) {
          const variance = 0.7 + Math.random() * 0.6;
          const cardValue = +(tier.avgValue * variance).toFixed(2);
          newResults.push({
            tier: `T${tier.tier}`,
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
  const collectionTotal = collection.reduce((sum, item) => sum + item.quantity * item.currentPrice, 0);
  const collectionFmvTotal = collection.reduce((sum, item) => sum + item.quantity * item.fmv, 0);

  const addCollectionItem = () => setCollection([...collection, { name: '', quantity: 1, currentPrice: 0, fmv: 0 }]);
  const removeCollectionItem = (index: number) => setCollection(collection.filter((_, i) => i !== index));
  const updateCollectionItem = (index: number, field: keyof CollectionItem, value: string | number) => {
    const updated = [...collection];
    (updated[index] as any)[field] = value;
    setCollection(updated);
  };
  const autoFillFromMarket = () => {
    const items = marketCards.slice(0, 5).map(c => ({
      name: c.name.split('#').pop()?.trim() || c.name,
      quantity: 1,
      currentPrice: c.price,
      fmv: c.fmv,
    }));
    setCollection(items);
  };

  const tierColors: Record<string, string> = {
    T1: 'text-muted-foreground bg-secondary border-border',
    T2: 'text-blue-500 bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/25',
    T3: 'text-purple-500 bg-purple-50 dark:bg-purple-500/15 border-purple-200 dark:border-purple-500/25',
    T4: 'text-amber-500 bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/25',
    T5: 'text-red-500 bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/25',
  };

  const inputClass = "w-full px-3 py-2 rounded-lg text-sm bg-secondary dark:bg-white/[0.04] border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">{t('收藏模拟器', 'Collection Simulator')}</h1>
        <p className="text-sm text-muted-foreground">
          {t(
            '基于真实Tier概率分布模拟开包结果，使用实时市场数据计算投资回报率和收藏总价值。',
            'Simulate pack openings based on real tier probability distributions, calculate ROI using live market data.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Gacha Simulator */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Dice6 className="w-4 h-4 text-purple-500" /> {t('抽卡模拟', 'Gacha Simulator')}
            </h2>
            <div className="glass-card rounded-xl p-5">
              <div className="flex gap-2 mb-4">
                {gachaPacks.map(pack => (
                  <button
                    key={pack.id}
                    onClick={() => { setSelectedPack(pack); setResults([]); }}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedPack.id === pack.id
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
                    }`}
                  >
                    {pack.name} (${pack.price})
                  </button>
                ))}
              </div>

              {/* Pack details */}
              <div className="rounded-lg bg-secondary dark:bg-white/[0.03] p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-foreground">{selectedPack.name}</span>
                  <span className="text-[10px] text-green-500 font-bold">EV: +{selectedPack.evPct}%</span>
                </div>
                <div className="flex gap-1">
                  {selectedPack.tiers.map(tier => (
                    <div key={tier.tier} className="flex-1 text-center">
                      <div className={`text-[9px] font-bold px-1 py-0.5 rounded ${tierColors[`T${tier.tier}`]} border mb-0.5`}>T{tier.tier}</div>
                      <div className="text-[9px] text-muted-foreground">{tier.probability}%</div>
                      <div className="text-[9px] text-muted-foreground/60">${tier.avgValue}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[11px] text-muted-foreground mb-1 block">{t('预算 (USD)', 'Budget (USD)')}</label>
                <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} className={inputClass} />
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {t(`可开 ${Math.floor(budget / selectedPack.price)} 包 | 期望值: $${(Math.floor(budget / selectedPack.price) * selectedPack.ev).toFixed(0)}`,
                    `Can open ${Math.floor(budget / selectedPack.price)} packs | EV: $${(Math.floor(budget / selectedPack.price) * selectedPack.ev).toFixed(0)}`)}
                </p>
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={simulate} className="flex-1 btn-primary px-4 py-2.5 rounded-lg text-sm">{t('开始模拟', 'Simulate')}</button>
                <button onClick={() => setResults([])} className="px-3 py-2.5 rounded-lg text-sm bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {results.length > 0 && (
                <div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="rounded-lg bg-secondary dark:bg-white/[0.03] p-3">
                      <div className="text-[10px] text-muted-foreground">{t('总投入', 'Total Spent')}</div>
                      <div className="text-lg font-mono font-bold text-foreground">${totalSpent}</div>
                    </div>
                    <div className={`rounded-lg p-3 ${totalValue > totalSpent ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                      <div className="text-[10px] text-muted-foreground">{t('总价值', 'Total Value')}</div>
                      <div className={`text-lg font-mono font-bold ${totalValue > totalSpent ? 'text-green-500' : 'text-red-500'}`}>${totalValue}</div>
                    </div>
                    <div className={`rounded-lg p-3 ${totalValue - totalSpent > 0 ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                      <div className="text-[10px] text-muted-foreground">ROI</div>
                      <div className={`text-lg font-mono font-bold ${totalValue - totalSpent > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {totalSpent > 0 ? `${(((totalValue - totalSpent) / totalSpent) * 100).toFixed(1)}%` : '0%'}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-2">{t('模拟结果', 'Results')} ({results.length} {t('包', 'packs')})</div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {results.map((r, i) => (
                      <div key={i} className="flex items-center justify-between px-2 py-1 rounded bg-secondary dark:bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${tierColors[r.tier] || tierColors['T1']}`}>{r.tier}</span>
                          <span className="text-[11px] text-muted-foreground">#{i + 1}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-foreground">${r.value}</span>
                          <span className={`text-[10px] font-mono ${r.profit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {r.profit > 0 ? '+' : ''}{r.profit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Tier distribution summary */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-[10px] text-muted-foreground mb-1">{t('Tier分布', 'Tier Distribution')}</div>
                    <div className="flex gap-2">
                      {selectedPack.tiers.map(tier => {
                        const count = results.filter(r => r.tier === `T${tier.tier}`).length;
                        const pct = results.length > 0 ? ((count / results.length) * 100).toFixed(0) : '0';
                        return (
                          <div key={tier.tier} className="flex-1 text-center">
                            <div className={`text-[9px] font-bold px-1 py-0.5 rounded ${tierColors[`T${tier.tier}`]} border`}>T{tier.tier}</div>
                            <div className="text-[10px] font-mono text-foreground mt-0.5">{count}</div>
                            <div className="text-[9px] text-muted-foreground">{pct}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {results.length === 0 && (
                <div className="text-center py-6">
                  <img src={GACHA_IMG} alt="Gacha" className="w-28 mx-auto rounded-xl mb-3 opacity-25" />
                  <p className="text-[11px] text-muted-foreground">{t('设置预算后点击"开始模拟"', 'Set budget and click "Simulate"')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Collection Value Estimator */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" /> {t('收藏估值 (实时数据)', 'Collection Value (Live Data)')}
            </h2>
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-muted-foreground">{t('基于Renaiss实时市场数据估算', 'Based on live Renaiss market data')}</p>
                <button onClick={autoFillFromMarket} disabled={loadingMarket} className="text-[10px] text-primary hover:underline transition-colors flex items-center gap-1">
                  {loadingMarket ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  {t('从市场填充', 'Fill from Market')}
                </button>
              </div>

              {loadingMarket ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="ml-2 text-xs text-muted-foreground">{t('加载市场数据...', 'Loading market data...')}</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    <div className="grid grid-cols-[1fr_50px_80px_80px_30px] gap-1 text-[9px] text-muted-foreground px-1 mb-1">
                      <span>{t('卡牌', 'Card')}</span>
                      <span className="text-center">{t('数量', 'Qty')}</span>
                      <span className="text-center">{t('挂牌价', 'Price')}</span>
                      <span className="text-center">FMV</span>
                      <span></span>
                    </div>
                    {collection.map((item, i) => (
                      <div key={i} className="grid grid-cols-[1fr_50px_80px_80px_30px] gap-1 items-center">
                        <input type="text" value={item.name} onChange={e => updateCollectionItem(i, 'name', e.target.value)} placeholder={t('卡牌名称', 'Card name')}
                          className="px-2 py-1.5 rounded-lg text-[11px] bg-secondary dark:bg-white/[0.03] border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/20" />
                        <input type="number" value={item.quantity} onChange={e => updateCollectionItem(i, 'quantity', Number(e.target.value))}
                          className="px-2 py-1.5 rounded-lg text-[11px] bg-secondary dark:bg-white/[0.03] border border-border text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary/20" min={1} />
                        <input type="number" value={item.currentPrice} onChange={e => updateCollectionItem(i, 'currentPrice', Number(e.target.value))}
                          className="px-2 py-1.5 rounded-lg text-[11px] bg-secondary dark:bg-white/[0.03] border border-border text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary/20" step={0.01} />
                        <input type="number" value={item.fmv} onChange={e => updateCollectionItem(i, 'fmv', Number(e.target.value))}
                          className="px-2 py-1.5 rounded-lg text-[11px] bg-secondary dark:bg-white/[0.03] border border-border text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary/20" step={0.01} />
                        <button onClick={() => removeCollectionItem(i)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={addCollectionItem} className="w-full flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] text-muted-foreground bg-secondary hover:bg-accent border border-dashed border-border transition-colors mb-4">
                    <Plus className="w-3 h-3" /> {t('添加卡牌', 'Add Card')}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 text-center">
                      <div className="text-[11px] text-muted-foreground mb-1">{t('挂牌总价值', 'Listed Value')}</div>
                      <div className="text-2xl font-mono font-bold text-foreground">${collectionTotal.toFixed(2)}</div>
                    </div>
                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 text-center">
                      <div className="text-[11px] text-muted-foreground mb-1">{t('FMV总价值', 'FMV Value')}</div>
                      <div className="text-2xl font-mono font-bold text-primary">${collectionFmvTotal.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 mt-2 text-center">
                    {t(`共 ${collection.reduce((s, i) => s + i.quantity, 0)} 张卡牌 | 数据来源: Renaiss 实时市场`,
                      `${collection.reduce((s, i) => s + i.quantity, 0)} cards total | Source: Renaiss Live Market`)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: ROI + Risk */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" /> {t('投资回报计算器', 'ROI Calculator')}
            </h2>
            <div className="glass-card rounded-xl p-5">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">{t('买入价格 (USD)', 'Buy Price (USD)')}</label>
                  <input type="number" value={buyPrice} onChange={e => setBuyPrice(Number(e.target.value))} className={inputClass} />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">{t('目标卖出价格 (USD)', 'Target Sell Price (USD)')}</label>
                  <input type="number" value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))} className={inputClass} />
                </div>
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{t('平台手续费 (5%)', 'Platform Fee (5%)')}</span>
                    <span className="text-xs font-mono text-red-500">-${(sellPrice * platformFee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{t('净收入', 'Net Revenue')}</span>
                    <span className="text-xs font-mono text-foreground">${(sellPrice * (1 - platformFee)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{t('净利润', 'Net Profit')}</span>
                    <span className={`text-lg font-mono font-bold ${netProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {netProfit > 0 ? '+' : ''}${netProfit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-xs font-semibold text-foreground">ROI</span>
                    <span className={`text-2xl font-mono font-bold ${roi > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {roi > 0 ? '+' : ''}{roi}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-xs font-semibold text-foreground/70 mb-3">{t('风险评估指南', 'Risk Assessment Guide')}</h3>
            <div className="space-y-2">
              {[
                { level: t('低风险', 'Low Risk'), color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10', desc: t('FMV价差 > 15%，高流动性卡牌', 'FMV spread > 15%, high liquidity cards') },
                { level: t('中风险', 'Medium Risk'), color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10', desc: t('FMV价差 5-15%，中等流动性', 'FMV spread 5-15%, moderate liquidity') },
                { level: t('高风险', 'High Risk'), color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10', desc: t('FMV价差 < 5% 或负价差', 'FMV spread < 5% or negative') },
              ].map(item => (
                <div key={item.level} className="flex items-start gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${item.color} shrink-0 mt-0.5`}>{item.level}</span>
                  <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Renaiss Ecosystem Stats */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-xs font-semibold text-foreground/70 mb-3">{t('Renaiss 生态数据', 'Renaiss Ecosystem')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{t('注册用户', 'Registered Users')}</span>
                <span className="text-xs font-mono font-bold text-foreground">220,000+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{t('总交易数', 'Total Transactions')}</span>
                <span className="text-xs font-mono font-bold text-foreground">4,000,000+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{t('平台手续费', 'Platform Fee')}</span>
                <span className="text-xs font-mono font-bold text-foreground">5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{t('区块链', 'Blockchain')}</span>
                <span className="text-xs font-mono font-bold text-foreground">BNB Chain</span>
              </div>
              <div className="text-[9px] text-muted-foreground/50 mt-2 pt-2 border-t border-border">
                {t('数据来源: Renaiss Official (@renaissxyz)', 'Source: Renaiss Official (@renaissxyz)')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
