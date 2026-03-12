/*
 * Design: Obsidian Glass — 深色底部栏
 * 包含所有社交链接、作者信息、免责声明
 */
import { useLang } from '@/contexts/LanguageContext';
import { ExternalLink } from 'lucide-react';

const links = [
  { label: '作者', labelEn: 'Author', name: '@chen1904o', url: 'https://x.com/chen1904o' },
  { label: 'AOCN', labelEn: 'AOCN', name: '@Aocn_renaiss', url: 'https://x.com/Aocn_renaiss' },
  { label: 'Renaiss', labelEn: 'Renaiss', name: '@renaissxyz', url: 'https://x.com/renaissxyz' },
  { label: 'Discord', labelEn: 'Discord', name: 'Renaiss DC', url: 'https://discord.com/invite/renaiss' },
];

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="border-t border-white/[0.06] mt-20">
      <div className="container py-10">
        {/* Links */}
        <div className="flex flex-wrap gap-6 mb-8">
          {links.map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-emerald-400 transition-colors"
            >
              <span className="text-white/20">{t(link.label, link.labelEn)}</span>
              {link.name}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="border-t border-white/[0.04] pt-6">
          <h4 className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-3">
            {t('免责声明', 'Disclaimer')}
          </h4>
          <p className="text-[11px] leading-relaxed text-white/20 max-w-4xl">
            {t(
              'AOCN（Auranaiss Omni-Collectible Nexus）提供的所有信息仅供参考，不构成任何投资建议。所有卡牌数据、价格和FMV（公允市场价值）均来源于Renaiss Protocol官方市场的公开数据。套利分析仅为数据参考，市场价格随时波动，用户需自行承担所有交易风险。AOCN与Renaiss Protocol为独立项目，AOCN不对Renaiss平台的运营、安全性或任何交易结果承担责任。过往表现不代表未来收益。请在做出任何投资决策前进行独立研究。',
              'All information provided by AOCN (Auranaiss Omni-Collectible Nexus) is for reference only and does not constitute investment advice. All card data, prices, and FMV (Fair Market Value) are sourced from public data on the Renaiss Protocol official marketplace. Arbitrage analysis is for data reference only; market prices fluctuate constantly, and users bear all trading risks. AOCN and Renaiss Protocol are independent projects. AOCN is not responsible for Renaiss platform operations, security, or any transaction outcomes. Past performance does not guarantee future returns. Please conduct independent research before making any investment decisions.'
            )}
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-[11px] text-white/15">
          © 2026 AOCN. Built for the Renaiss Ecosystem.
        </div>
      </div>
    </footer>
  );
}
