/*
 * AOCN Navbar — Clean style with top banner + theme toggle
 * Matches reference image 3: gradient top bar, clean nav, moon icon
 */
import { useLang } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Globe, ExternalLink, Sparkles, Menu, X, Sun, Moon, Radar } from 'lucide-react';
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
  { id: 'radar', zh: '实时雷达', en: 'Radar', highlight: true, icon: 'radar' },
  { id: 'simulator', zh: '模拟器', en: 'Simulator', highlight: false },
  { id: 'openclaw', zh: 'Open Claw', en: 'Open Claw', highlight: false },
  { id: 'hackathon', zh: '黑客松', en: 'Hackathon', highlight: false },
];

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { lang, toggleLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top gradient banner bar */}
      <div className="top-banner fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-4 px-4 py-1.5 text-xs font-medium">
        <span>{t('官方:', 'Official:')}</span>
        <a href="https://x.com/renaissxyz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
          <span className="font-bold">𝕏</span> Renaiss
        </a>
        <a href="https://x.com/renaiss_cn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
          <span className="font-bold">𝕏</span> {t('中文官方', 'Chinese')}
        </a>
        <a href="https://discord.gg/renaiss" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
          Discord
        </a>
        <span className="hidden sm:inline text-white/70">|</span>
        <a
          href="https://x.com/chen1904o"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline text-white/80 hover:underline hover:text-white cursor-pointer transition-colors"
        >
          {t('作者:', 'By:')} 小天才77Ouo
        </a>
      </div>

      {/* Main navbar */}
      <nav className="fixed top-[30px] left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => handleTabClick('dashboard')}>
            <img src={LOGO_URL} alt="AOCN" className="w-8 h-8 rounded-lg" />
            <span className="text-[15px] font-bold text-foreground">Renaiss {t('套利分析', 'Arbitrage')}</span>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden lg:flex items-center gap-0.5 mx-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`nav-link text-[13px] px-3 py-1.5 transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === tab.id ? 'active' : ''
                } ${tab.id === 'radar' ? 'text-emerald-400' : ''}`}
              >
                {tab.id === 'radar' && <Radar className="w-3 h-3" />}
                {tab.highlight && tab.id !== 'radar' && <Sparkles className="w-3 h-3" />}
                {lang === 'zh' ? tab.zh : tab.en}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground">
              <div className="live-dot" />
              {t('实时数据', 'Live Data')}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              title={theme === 'dark' ? t('切换浅色', 'Light mode') : t('切换暗黑', 'Dark mode')}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'zh' ? 'EN' : '中文'}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
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
              className={`whitespace-nowrap text-[12px] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === tab.id
                  ? 'text-primary bg-primary/5 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              } ${tab.id === 'radar' ? 'text-emerald-400' : ''}`}
            >
              {tab.id === 'radar' && <Radar className="w-2.5 h-2.5" />}
              {tab.highlight && tab.id !== 'radar' && <Sparkles className="w-2.5 h-2.5" />}
              {lang === 'zh' ? tab.zh : tab.en}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
