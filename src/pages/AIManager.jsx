import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Search, 
  Filter, 
  History, 
  Settings, 
  CheckCircle2, 
  AlertTriangle,
  LayoutGrid,
  List,
  ShieldCheck,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useAI } from '../contexts/AIManagerContext';
import { AlertCard } from '../components/ai/AlertCard';
import { EngineStatusPanel } from '../components/ai/EngineStatusPanel';
import { DailyBriefingCard } from '../components/ai/DailyBriefingCard';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const AIManager = () => {
  const navigate = useNavigate();
  const { 
    aiAlerts = [], 
    unresolvedCount = 0, 
    criticalCount = 0,
    engineStatus = 'IDLE',
    lastScanTime = null,
    nextScanTime = null,
    loading = true,
    runManualScan = () => {},
    resolveAlert = () => {},
    dismissAlert = () => {},
    markAlertRead = () => {}
  } = useAI() || {};

  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Find daily briefing
  const dailyBriefing = useMemo(() => {
    return aiAlerts.find(a => a.moduleSource === 'DailyBriefingEngine' && !a.resolved);
  }, [aiAlerts]);

  // Filtered alerts excluding the briefing
  const filteredAlerts = useMemo(() => {
    return aiAlerts
      .filter(a => a.moduleSource !== 'DailyBriefingEngine')
      .filter(a => {
        if (filterType === 'All') return true;
        if (filterType === 'Critical') return a.type === 'CRITICAL';
        if (filterType === 'Fleet') return a.category === 'vehicle';
        if (filterType === 'Bookings') return a.category === 'booking';
        return true;
      })
      .filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [aiAlerts, filterType, searchQuery]);

  if (loading && aiAlerts.length === 0) {
    return (
      <PageWrapper title="AI Manager Hub">
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
          <BrainCircuit size={48} className="text-safari-gold animate-pulse" />
          <p className="text-safari-earthy animate-pulse font-dm-sans">Initializing Intelligence...</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper 
      title="AI Manager Hub" 
      subtitle="Autonomous Operational Intelligence & Risk Assessment"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/admin/ai-logs')}>
            <History size={18} /> Activity Log
          </Button>
          <Button className="gap-2 bg-safari-primary hover:bg-safari-primary/90 text-white border-none shadow-lg" onClick={runManualScan}>
            <BrainCircuit size={18} /> Run Deep Scan
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Alerts Feed */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Daily Briefing (If active) */}
          {dailyBriefing && (
            <DailyBriefingCard alert={dailyBriefing} onResolve={resolveAlert} />
          )}

          {/* Alert Feed Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-dark-card p-4 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm">
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
               {['All', 'Critical', 'Fleet', 'Bookings'].map(t => (
                 <button
                   key={t}
                   onClick={() => setFilterType(t)}
                   className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                     filterType === t 
                       ? 'bg-safari-gold text-white shadow-md' 
                       : 'text-gray-400 hover:text-safari-gold hover:bg-safari-gold/5'
                   }`}
                 >
                   {t === 'All' ? `All Alerts (${filteredAlerts.length})` : t}
                 </button>
               ))}
             </div>
             
             <div className="relative w-full md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Search alerts..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-surface border-none rounded-xl text-sm focus:ring-2 focus:ring-safari-gold/20"
               />
             </div>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map(alert => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  onResolve={resolveAlert} 
                  onDismiss={dismissAlert}
                  onRead={markAlertRead}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-dark-card rounded-3xl border border-dashed border-gray-200 dark:border-dark-border">
                <div className="w-16 h-16 rounded-full bg-safari-success/10 flex items-center justify-center text-safari-success mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h4 className="text-xl font-playfair font-bold text-safari-primary dark:text-dark-text">System Optimal</h4>
                <p className="text-sm text-gray-500">No active alerts requiring your attention.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Engine Status & Insights */}
        <div className="lg:col-span-4 space-y-6">
          <EngineStatusPanel 
            status={engineStatus} 
            lastScanTime={lastScanTime} 
            nextScanTime={nextScanTime}
            onRunScan={runManualScan}
          />
          
          {/* Quick Stats/Insights */}
          <div className="bg-gradient-to-br from-safari-gold/10 to-transparent p-6 rounded-3xl border border-safari-gold/20">
             <div className="flex items-center gap-2 mb-4">
               <TrendingUp size={18} className="text-safari-gold" />
               <h4 className="text-sm font-bold text-safari-primary dark:text-dark-text uppercase tracking-widest">Growth Insight</h4>
             </div>
             <p className="text-xs text-safari-earthy dark:text-gray-400 leading-relaxed italic">
               "Fleet utilization is at 82% for the upcoming month. Consider opening 3 additional weekend safari slots to maximize revenue."
             </p>
             <Button variant="ghost" className="mt-4 p-0 h-auto text-[10px] font-bold text-safari-gold hover:text-safari-gold hover:bg-transparent uppercase tracking-wider">
               Explore Analysis <ChevronRight size={10} className="ml-1" />
             </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

const ChevronRight = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
