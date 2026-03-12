/*
 * AOCN Main Layout — Clean theme with top banner
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

      {/* Main content — offset for top banner (30px) + navbar (56px) + mobile tabs */}
      <main className="container pt-28 md:pt-24 pb-8">
        {renderContent()}
      </main>

      <Footer />

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-40"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
