/*
 * AOCN Navbar — Ice Blue + Violet theme
 * 固定顶部导航，可切换7大模块
 */
import { useLang } from '@/contexts/LanguageContext';
import { Globe, ExternalLink } from 'lucide-react';

const LOGO_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663427415692/ByMrgW2BXPeym8jL7YKc6Z/aocn-logo_b94bea11.png';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', zh: '首页', en: 'Home' },
  { id: 'arbitrage', zh: '套利分析', en: 'Arbitrage' },
  { id: 'events', zh: '事件中心', en: 'Events' },
  { id: 'sbt', zh: 'SBT分析', en: 'SBT' },
  { id: 'simulator', zh: '模拟器', en: 'Simulator' },
  { id: 'openclaw', zh: 'Open Claw', en: 'Open Claw' },
  { id: 'hackathon', zh: '黑客松', en: 'Hackathon' },
];

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { lang, toggleLang, t } = useLang();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05]"
      style={{ background: 'rgba(8,8,16,0.85)', backdropFilter: 'blur(24px)' }}>
      <div className="container flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img src={LOGO_URL} alt="AOCN" className="w-8 h-8 rounded-lg" />
          <span className="text-[15px] font-bold tracking-wide text-gradient">AOCN</span>
        </div>

        {/* Tabs */}
        <div className="hidden md:flex items-center gap-0.5 mx-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`nav-link text-[13px] px-3 py-1.5 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? 'active text-white bg-white/[0.06]'
                  : 'text-white/40 hover:text-white/65 hover:bg-white/[0.03]'
              }`}
            >
              {lang === 'zh' ? tab.zh : tab.en}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://www.renaiss.xyz/marketplace"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-[12px] text-white/35 hover:text-ice transition-colors"
          >
            {t('市场', 'Market')}
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] text-white/45 hover:text-white/75 hover:bg-white/[0.04] transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'zh' ? 'EN' : '中文'}
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden flex overflow-x-auto gap-0.5 px-4 pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`whitespace-nowrap text-[12px] px-3 py-1.5 rounded-md transition-all ${
              activeTab === tab.id
                ? 'text-white bg-white/[0.07]'
                : 'text-white/35 hover:text-white/55'
            }`}
          >
            {lang === 'zh' ? tab.zh : tab.en}
          </button>
        ))}
      </div>
    </nav>
  );
}
