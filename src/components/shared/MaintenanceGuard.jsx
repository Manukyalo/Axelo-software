import React, { useState, useEffect } from 'react';
import { Settings, Wrench, Clock, Mail, Info } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

export const MaintenanceGuard = ({ children }) => {
  const { user, loading } = useAuth();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Listen to the maintenance mode document in Firestore for real-time toggling
    const unsub = onSnapshot(doc(db, 'system_config', 'maintenance'), (docSnap) => {
      if (docSnap.exists()) {
        setIsMaintenanceMode(docSnap.data().active === true);
      } else {
        // Fallback to locked if document doesn't exist
        setIsMaintenanceMode(true);
      }
      setChecking(false);
    }, (err) => {
      console.error('Maintenance Status Error:', err);
      // Fail-safe: if network is down or Firebase is blocked, lock the system
      setIsMaintenanceMode(true);
      setChecking(false);
    });

    return () => unsub();
  }, []);

  if (loading || checking) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-safari-bg dark:bg-dark-bg">
        <div className="w-16 h-16 border-4 border-safari-gold/20 border-t-safari-gold rounded-full animate-spin mb-4" />
        <p className="font-playfair font-bold text-safari-primary dark:text-white animate-pulse tracking-widest uppercase text-sm">
          Verifying System Status...
        </p>
      </div>
    );
  }

  // Optional: Allow admins to bypass maintenance to test the system
  const canBypass = user?.role === 'admin';

  if (isMaintenanceMode && !canBypass) {
    return (
      <div className="fixed inset-0 z-[9999] bg-safari-bg dark:bg-dark-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-safari-gold/20 rounded-full animate-ping"></div>
          <div className="w-24 h-24 bg-safari-gold/10 rounded-full flex items-center justify-center relative z-10 border border-safari-gold/30">
            <Settings size={48} className="text-safari-gold animate-[spin_4s_linear_infinite]" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-dark-surface rounded-full flex items-center justify-center shadow-lg border border-safari-gold/20">
            <Wrench size={20} className="text-safari-primary dark:text-gray-300" />
          </div>
        </div>
        
        <h1 className="text-4xl font-playfair font-bold text-safari-primary dark:text-white mb-4 tracking-wide">
          Scheduled Maintenance
        </h1>
        
        <div className="max-w-md w-full bg-white dark:bg-dark-surface shadow-xl rounded-2xl p-8 mb-8 border border-gray-100 dark:border-gray-800">
          <div className="space-y-6 text-left">
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-safari-gold/10 rounded-lg">
                <Info size={20} className="text-safari-gold" />
              </div>
              <div>
                <h3 className="font-bold text-safari-primary dark:text-white mb-1">System Upgrade</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  We are currently performing scheduled maintenance to upgrade our systems and improve your experience. 
                  The ToursPro platform is temporarily unavailable.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-safari-gold/10 rounded-lg">
                <Clock size={20} className="text-safari-gold" />
              </div>
              <div>
                <h3 className="font-bold text-safari-primary dark:text-white mb-1">Estimated Completion</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Our engineering team is working diligently. We expect all services to be restored shortly.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-safari-gold/10 rounded-lg">
                <Mail size={20} className="text-safari-gold" />
              </div>
              <div>
                <h3 className="font-bold text-safari-primary dark:text-white mb-1">Urgent Support</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  For urgent reservations or SOS alerts, please contact our 24/7 duty manager at <a href="mailto:support@easternvacations.com" className="text-safari-gold hover:underline">support@easternvacations.com</a>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle branding */}
        <div className="absolute bottom-8 flex flex-col items-center">
          <div className="text-gray-400 dark:text-gray-600 font-playfair italic mb-1 text-lg">
            Eastern Vacations & Safaris
          </div>
          <div className="text-gray-400/50 dark:text-gray-600/50 text-xs uppercase tracking-widest">
            ToursPro Operating System
          </div>
        </div>
      </div>
    );
  }

  return children;
};
