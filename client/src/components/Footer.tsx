/*
 * Design: AOCN Footer — Ice Blue + Violet
 * 包含所有社交链接、快速导航、作者信息、免责声明
 */
import { useLang } from '@/contexts/LanguageContext';
import { ExternalLink, Heart } from 'lucide-react';

const socialLinks = [
  { label: '作者', labelEn: 'Author', name: '@chen1904o', url: 'https://x.com/chen1904o' },
  { label: 'AOCN', labelEn: 'AOCN', name: '@Aocn_renaiss', url: 'https://x.com/Aocn_renaiss' },
  { label: 'Renaiss', labelEn: 'Renaiss', name: '@renaissxyz', url: 'https://x.com/renaissxyz' },
  { label: 'Renaiss CN', labelEn: 'Renaiss CN', name: '@Renaiss_CN', url: 'https://x.com/Renaiss_CN' },
  { label: 'Discord', labelEn: 'Discord', name: 'Renaiss DC', url: 'https://discord.com/invite/renaiss' },
];

const resourceLinks = [
  { label: '官网', labelEn: 'Website', url: 'https://www.renaiss.xyz' },
  { label: '市场', labelEn: 'Marketplace', url: 'https://www.renaiss.xyz/marketplace' },
  { label: '抽卡', labelEn: 'Gacha', url: 'https://www.renaiss.xyz/gacha' },
  { label: '监控工具', labelEn: 'Monitor Tool', url: 'https://renaiss77.xyz' },
];

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="border-t border-white/[0.06] mt-20">
      <div className="container py-10">
        {/* Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h4 className="text-[13px] font-semibold text-white/50 mb-3">{t('关于 AOCN', 'About AOCN')}</h4>
            <p className="text-[12px] text-white/25 leading-relaxed">
              {t(
                'AOCN（Auranaiss Omni-Collectible Nexus）是 Renaiss 生态的社区驱动分析平台，提供套利分析、SBT 图鉴、新手指南等一站式服务。',
                'AOCN (Auranaiss Omni-Collectible Nexus) is a community-driven analytics platform for the Renaiss ecosystem, offering arbitrage analysis, SBT atlas, beginner guides, and more.'
              )}
            </p>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-[13px] font-semibold text-white/50 mb-3">{t('社交链接', 'Social Links')}</h4>
            <div className="space-y-2">
              {socialLinks.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[12px] text-white/30 hover:text-ice transition-colors"
                >
                  <span className="text-white/15">{t(link.label, link.labelEn)}</span>
                  {link.name}
                  <ExternalLink className="w-3 h-3 opacity-40" />
                </a>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[13px] font-semibold text-white/50 mb-3">{t('资源链接', 'Resources')}</h4>
            <div className="space-y-2">
              {resourceLinks.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[12px] text-white/30 hover:text-ice transition-colors"
                >
                  {t(link.label, link.labelEn)}
                  <ExternalLink className="w-3 h-3 opacity-40" />
                </a>
              ))}
            </div>
          </div>
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
        <div className="mt-6 flex items-center gap-1.5 text-[11px] text-white/15">
          <span>© 2026 AOCN.</span>
          <span>Built with</span>
          <Heart className="w-3 h-3 text-rose-500/30" />
          <span>for the Renaiss Ecosystem.</span>
        </div>
      </div>
    </footer>
  );
}
