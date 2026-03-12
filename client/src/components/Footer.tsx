/*
 * AOCN Footer — Clean dual-theme
 */
import { useLang } from '@/contexts/LanguageContext';
import { ExternalLink, Heart } from 'lucide-react';

const LOGO_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663427415692/ByMrgW2BXPeym8jL7YKc6Z/aocn-logo_b94bea11.png';

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
  { label: 'BscScan', labelEn: 'BscScan', url: 'https://bscscan.com/token/0xF8646A3Ca093e97Bb404c3b25e675C0394DD5b30' },
  { label: 'CryptoSlam', labelEn: 'CryptoSlam', url: 'https://www.cryptoslam.io/renaiss' },
];

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="border-t border-border bg-secondary/50 dark:bg-[#0a0a0f] mt-20">
      <div className="container py-10">
        {/* Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src={LOGO_URL} alt="AOCN" className="w-6 h-6 rounded-md" />
              <span className="text-sm font-bold text-foreground">AOCN</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                'AOCN（Auranaiss Omni-Collectible Nexus）是 Renaiss 生态的社区驱动分析平台，提供套利分析、SBT 图鉴、新手指南等一站式服务。',
                'AOCN (Auranaiss Omni-Collectible Nexus) is a community-driven analytics platform for the Renaiss ecosystem.'
              )}
            </p>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">{t('社交链接', 'Social Links')}</h4>
            <div className="space-y-2">
              {socialLinks.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <span className="text-muted-foreground/60">{t(link.label, link.labelEn)}</span>
                  {link.name}
                  <ExternalLink className="w-3 h-3 opacity-40" />
                </a>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">{t('资源链接', 'Resources')}</h4>
            <div className="space-y-2">
              {resourceLinks.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {t(link.label, link.labelEn)}
                  <ExternalLink className="w-3 h-3 opacity-40" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-border pt-6">
          <p className="text-[10px] leading-relaxed text-muted-foreground/60 max-w-4xl">
            {t(
              '免责声明: AOCN 提供的所有信息仅供参考，不构成任何投资建议。所有卡牌数据、价格和FMV均来源于Renaiss Protocol官方市场的公开数据。套利分析仅为数据参考，市场价格随时波动，用户需自行承担所有交易风险。链上数据来源: BscScan, CryptoSlam, Phemex, KuCoin。',
              'Disclaimer: All information provided by AOCN is for reference only and does not constitute investment advice. All card data, prices, and FMV are sourced from public data on the Renaiss Protocol official marketplace. On-chain data sources: BscScan, CryptoSlam, Phemex, KuCoin.'
            )}
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-6 flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
          <span>© 2026 AOCN.</span>
          <span>Built with</span>
          <Heart className="w-3 h-3 text-rose-500/40" />
          <span>by 小天才77Ouo, Kuromon, Nora</span>
        </div>
      </div>
    </footer>
  );
}
