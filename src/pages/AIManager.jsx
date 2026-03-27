import React from 'react';
import { 
  Hammer, 
  HardHat, 
  Info, 
  ShieldCheck, 
  BrainCircuit 
} from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const AIManager = () => {
  const navigate = useNavigate();
  
  return (
    <PageWrapper 
      title="AI Manager Hub" 
      subtitle="Operational Intelligence & Safari Watchdog"
    >
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="relative mb-8">
          {/* Animated Background Glow */}
          <div className="absolute -inset-4 bg-safari-gold/20 rounded-full blur-2xl animate-pulse" />
          
          <div className="relative w-24 h-24 bg-white dark:bg-dark-card rounded-3xl shadow-xl flex items-center justify-center text-safari-gold border border-safari-gold/20">
            <Hammer size={48} className="animate-bounce" />
          </div>
        </div>
        
        <h2 className="text-3xl font-playfair font-bold text-safari-primary dark:text-dark-text mb-4">
          Intelligence Hub <span className="text-safari-gold">Under Construction</span>
        </h2>
        
        <p className="max-w-md text-gray-500 dark:text-gray-400 font-dm-sans mb-8 leading-relaxed">
          We are currently upgrading the AI Manager with advanced neural-sync and real-time behavioral tracking. Advanced Operation Intelligence will be restored in the next version.
        </p>
        
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm flex flex-col items-center group hover:border-safari-success/30 transition-colors">
             <div className="w-10 h-10 rounded-full bg-safari-success/10 text-safari-success flex items-center justify-center mb-3">
               <ShieldCheck size={20} />
             </div>
             <p className="text-xs font-bold text-safari-primary dark:text-dark-text uppercase tracking-widest">Active Protection</p>
             <p className="text-[10px] text-gray-400 mt-1">Watchdog running in background</p>
          </div>
          
          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm flex flex-col items-center group hover:border-safari-gold/30 transition-colors">
             <div className="w-10 h-10 rounded-full bg-safari-gold/10 text-safari-gold flex items-center justify-center mb-3">
               <HardHat size={20} />
             </div>
             <p className="text-xs font-bold text-safari-primary dark:text-dark-text uppercase tracking-widest">System Upgrade</p>
             <p className="text-[10px] text-gray-400 mt-1">UI refactor in progress</p>
          </div>
          
          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm flex flex-col items-center group hover:border-safari-primary/30 transition-colors">
             <div className="w-10 h-10 rounded-full bg-safari-primary/10 text-safari-primary flex items-center justify-center mb-3">
               <BrainCircuit size={20} />
             </div>
             <p className="text-xs font-bold text-safari-primary dark:text-dark-text uppercase tracking-widest">Version 2.0</p>
             <p className="text-[10px] text-gray-400 mt-1">Deployment Phase 7</p>
          </div>
        </div>

        <div className="mt-12 flex gap-4">
          <Button 
            variant="outline" 
            className="border-safari-gold text-safari-gold hover:bg-safari-gold hover:text-white px-8 h-12 rounded-xl font-bold"
            onClick={() => navigate('/admin')}
          >
            Return to Dashboard
          </Button>
        </div>
        
        <div className="mt-8 flex items-center gap-2 text-gray-400 text-[10px] uppercase font-bold tracking-[0.2em]">
           <Info size={12} className="text-safari-gold" /> Estimated Restoration: Coming Soon
        </div>
      </div>
    </PageWrapper>
  );
};
