/*
 * Design: AOCN Main Layout — Ice Blue + Violet
 * 顶部导航切换 + 各模块渲染 + 底部Footer
 */
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Dashboard from '@/pages/Dashboard';
import Arbitrage from '@/pages/Arbitrage';
import Events from '@/pages/Events';
import SbtAnalysis from '@/pages/SbtAnalysis';
import Simulator from '@/pages/Simulator';
import OpenClaw from '@/pages/OpenClaw';
import Hackathon from '@/pages/Hackathon';
import BeginnerGuide from '@/pages/BeginnerGuide';
import { ArrowUp } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={handleTabChange} />;
      case 'beginner': return <BeginnerGuide />;
      case 'arbitrage': return <Arbitrage />;
      case 'events': return <Events />;
      case 'sbt': return <SbtAnalysis />;
      case 'simulator': return <Simulator />;
      case 'openclaw': return <OpenClaw />;
      case 'hackathon': return <Hackathon />;
      default: return <Dashboard onNavigate={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main content with top padding for fixed navbar */}
      <main className="container pt-20 md:pt-16 pb-8">
        {renderContent()}
      </main>

      <Footer />

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.1] transition-all z-40 backdrop-blur-sm"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
