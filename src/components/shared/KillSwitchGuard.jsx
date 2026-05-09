import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, Lock, Info } from 'lucide-react';

export const KillSwitchGuard = ({ children }) => {
  const { user, loading } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Listen to the emergency lock document
    const unsub = onSnapshot(doc(db, 'system_config', 'emergency'), (doc) => {
      if (doc.exists()) {
        setIsLocked(doc.data().locked === true);
      }
      setChecking(false);
    }, (err) => {
      console.error('Lock Status Error:', err);
      setChecking(false);
    });

    return () => unsub();
  }, []);

  if (loading || checking) return children;

  // Admins can bypass the lock screen to fix things
  const canBypass = user?.role === 'admin';

  if (isLocked && !canBypass) {
    return (
      <div className="fixed inset-0 z-[9999] bg-safari-primary flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
          <ShieldAlert size={48} className="text-red-500" />
        </div>
        
        <h1 className="text-3xl font-playfair font-bold text-white mb-4">
          SYSTEM ACCESS SUSPENDED
        </h1>
        
        <div className="max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4 text-left">
            <div className="mt-1">
              <Lock size={20} className="text-safari-gold" />
            </div>
            <div>
              <p className="text-safari-gold font-bold mb-1 uppercase text-xs tracking-widest">Security Protocol Alpha</p>
              <p className="text-white/80 text-sm leading-relaxed">
                The Eastern Vacations system has been placed under emergency lockdown by the administrator. 
                All data access and operations are currently disabled to protect system integrity.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <div className="flex items-center justify-center gap-2 text-white/40 text-xs uppercase tracking-widest">
            <Info size={14} />
            Contact HQ for authorization
          </div>
        </div>
        
        {/* Subtle branding */}
        <div className="absolute bottom-8 text-white/20 font-playfair italic">
          Eastern Vacations & Safaris
        </div>
      </div>
    );
  }

  return children;
};
