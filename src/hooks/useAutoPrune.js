import { useEffect, useRef } from 'react';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

export const useAutoPrune = () => {
  const { user } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    // Only run once per session, and only for admins
    if (!user || user.role !== 'admin' || hasRun.current) return;
    
    const pruneOldBookings = async () => {
      hasRun.current = true;
      try {
        const bookingsRef = collection(db, 'bookings');
        
        // Define cutoff date: explicitly retain only bookings from July 1, 2026 onwards
        const cutoffString = '2026-07-01'; // Format: YYYY-MM-DD
        
        const q = query(bookingsRef, where('date', '<', cutoffString));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          logger.info('AutoPrune: No old bookings found to clean up.');
          return;
        }
        
        logger.info(`AutoPrune: Found ${snapshot.size} old bookings to delete.`);
        
        // Firestore batch max operations is 500
        const batches = [];
        let currentBatch = writeBatch(db);
        let count = 0;
        
        snapshot.docs.forEach((document) => {
          currentBatch.delete(document.ref);
          count++;
          if (count === 500) {
            batches.push(currentBatch.commit());
            currentBatch = writeBatch(db);
            count = 0;
          }
        });
        
        if (count > 0) {
          batches.push(currentBatch.commit());
        }
        
        await Promise.all(batches);
        logger.info(`AutoPrune: Successfully deleted ${snapshot.size} old bookings to prevent database congestion.`);
      } catch (err) {
        logger.error(`AutoPrune Failed`, { error: err.message });
      }
    };

    // Add a slight delay to ensure it doesn't block critical UI rendering on initial dashboard load
    const timer = setTimeout(() => {
      pruneOldBookings();
    }, 5000);

    return () => clearTimeout(timer);
  }, [user]);
};
