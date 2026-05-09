import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  setDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { differenceInSeconds, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const AIManagerContext = createContext();

export const AIManagerProvider = ({ children }) => {
  const { user } = useAuth();
  const { state: dataState } = useData();
  
  const [aiAlerts, setAiAlerts] = useState([]);
  const [aiState, setAiState] = useState({
    lastScanTime: null,
    nextScanTime: null,
    status: 'IDLE'
  });
  const [loading, setLoading] = useState(true);

  // 1. Sync AI State (Last/Next Scan Times)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const unsub = onSnapshot(doc(db, 'aiState', 'primary_ai_engine'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const parseDate = (val) => {
          if (!val) return null;
          if (val.toDate) return val.toDate();
          if (typeof val === 'string') return new Date(val);
          return null;
        };
        setAiState({
          lastScanTime: parseDate(data.lastScanTime),
          nextScanTime: parseDate(data.nextScanTime),
          status: data.status || 'ACTIVE'
        });
      }
    }, (error) => {
      console.error('AI State sync error:', error);
    });

    return () => unsub();
  }, [user]);

  // 2. Sync AI Alerts (Real-time)
  useEffect(() => {
    // 🛡️ Silent Guard: Stop if no user or restricted role
    if (!user || (user.role !== 'admin' && user.role !== 'agent')) {
      setLoading(false);
      return;
    }

    // Filter alerts by role
    let q;
    try {
      if (user.role === 'admin') {
        q = query(
          collection(db, 'aiAlerts'), 
          where('resolved', '==', false),
          where('dismissed', '==', false),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'aiAlerts'),
          where('targetRole', '==', 'both'),
          where('resolved', '==', false),
          where('dismissed', '==', false),
          orderBy('createdAt', 'desc')
        );
      }

      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAiAlerts(data);
        setLoading(false);
      }, (error) => {
        console.warn('AI Alerts sync inhibited:', error.message);
        setLoading(false);
        
        // 🤫 Only show toast if user is an ADMIN and NOT on the login page
        const isLoginPage = window.location.pathname.includes('/login');
        if (user?.role === 'admin' && !isLoginPage) {
          toast.error('AI synchronization slow or interrupted');
        }
      });

      return () => unsub();
    } catch (e) {
      console.error('AI Query setup error:', e);
      setLoading(false);
    }
  }, [user]);

  // 3. AI Engine loop removed (migrated to Cloud Functions)
  useEffect(() => {
    setLoading(false);
  }, []);

  // --- Actions ---

  const runManualScan = async () => {
    const toastId = toast.loading('AI Engine running deep scan...');
    try {
      const functions = getFunctions();
      const sweep = httpsCallable(functions, 'manualOperationsSweep');
      await sweep();
      toast.success('AI scan complete!', { id: toastId });
    } catch (err) {
      console.error('AI manual sweep error:', err);
      toast.error('AI scan failed: ' + (err.message || 'Unknown error'), { id: toastId });
    }
  };

  const resolveAlert = async (id) => {
    try {
      await updateDoc(doc(db, 'aiAlerts', id), { 
        resolved: true, 
        resolvedAt: serverTimestamp(),
        resolvedBy: user.username 
      });
      toast.success('Alert marked as resolved');
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const dismissAlert = async (id) => {
    try {
      await updateDoc(doc(db, 'aiAlerts', id), { 
        dismissed: true,
        dismissedAt: serverTimestamp()
      });
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const markAlertRead = async (id) => {
    try {
      await updateDoc(doc(db, 'aiAlerts', id), { read: true });
    } catch (err) {
      // Background update, no toast
    }
  };

  // --- Derived State ---
  const unresolvedCount = aiAlerts.length;
  const criticalCount = aiAlerts.filter(a => a.type === 'CRITICAL').length;

  const value = {
    aiAlerts,
    unresolvedCount,
    criticalCount,
    engineStatus: aiState.status,
    lastScanTime: aiState.lastScanTime,
    nextScanTime: aiState.nextScanTime,
    loading,
    runManualScan,
    resolveAlert,
    dismissAlert,
    markAlertRead
  };

  return (
    <AIManagerContext.Provider value={value}>
      {children}
    </AIManagerContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIManagerContext);
  if (!context) throw new Error('useAI must be used within AIManagerProvider');
  return context;
};
