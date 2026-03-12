/*
 * AOCN Navbar — Ice Blue + Violet theme
 * 固定顶部导航，可切换模块（含新手专区）
 */
import { useLang } from '@/contexts/LanguageContext';
import { Globe, ExternalLink, Sparkles, Menu, X } from 'lucide-react';
import { useState } from 'react';

const LOGO_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663427415692/ByMrgW2BXPeym8jL7YKc6Z/aocn-logo_b94bea11.png';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', zh: '首页', en: 'Home', highlight: false },
  { id: 'beginner', zh: '新手专区', en: 'Beginner', highlight: true },
  { id: 'arbitrage', zh: '套利分析', en: 'Arbitrage', highlight: false },
  { id: 'events', zh: '事件中心', en: 'Events', highlight: false },
  { id: 'sbt', zh: 'SBT 图鉴', en: 'SBT Atlas', highlight: false },
  { id: 'simulator', zh: '模拟器', en: 'Simulator', highlight: false },
  { id: 'openclaw', zh: 'Open Claw', en: 'Open Claw', highlight: false },
  { id: 'hackathon', zh: '黑客松', en: 'Hackathon', highlight: false },
];

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { lang, toggleLang, t } = useLang();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05]"
      style={{ background: 'rgba(8,8,16,0.88)', backdropFilter: 'blur(24px)' }}>
      <div className="container flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => handleTabClick('dashboard')}>
          <img src={LOGO_URL} alt="AOCN" className="w-8 h-8 rounded-lg" />
          <span className="text-[15px] font-bold tracking-wide text-gradient">AOCN</span>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden lg:flex items-center gap-0.5 mx-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`nav-link text-[13px] px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'active text-white bg-white/[0.06]'
                  : tab.highlight
                    ? 'text-ice/60 hover:text-ice hover:bg-ice/[0.05]'
                    : 'text-white/40 hover:text-white/65 hover:bg-white/[0.03]'
              }`}
            >
              {tab.highlight && <Sparkles className="w-3 h-3" />}
              {lang === 'zh' ? tab.zh : tab.en}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
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
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-white/50 hover:text-white/80 hover:bg-white/[0.05] transition-all"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile tabs - horizontal scroll */}
      <div className="lg:hidden flex overflow-x-auto gap-0.5 px-4 pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`whitespace-nowrap text-[12px] px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
              activeTab === tab.id
                ? 'text-white bg-white/[0.07]'
                : tab.highlight
                  ? 'text-ice/50 hover:text-ice'
                  : 'text-white/35 hover:text-white/55'
            }`}
          >
            {tab.highlight && <Sparkles className="w-2.5 h-2.5" />}
            {lang === 'zh' ? tab.zh : tab.en}
          </button>
        ))}
      </div>
    </nav>
  );
}
