import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { checkRateLimit } from '../utils/rateLimit';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Real-time Database Snapshot Cache
  const [state, setState] = useState({
    bookings: [],
    vehicles: [],
    drivers: [],
    packages: [],
    notifications: [],
    driverAuth: [],
    porters: [],
    driverLocations: [],
    sosAlerts: [],
    tripUpdates: [],
    driverMessages: []
  });

  // Attach asynchronous remote Firestore synchronizers dynamically
  useEffect(() => {
    if (!user) return; // Disconnect polling if unauthenticated

    const unsubs = [];
    const collections = ['bookings', 'vehicles', 'drivers', 'packages', 'notifications', 'driverAuth', 'porters', 'driverLocations', 'sosAlerts', 'tripUpdates', 'driverMessages'];

    collections.forEach(col => {
      const q = collection(db, col);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(document => ({ id: document.id, ...document.data() }));
        setState(prev => ({ ...prev, [col]: data }));
      }, (err) => {
         logger.error(`Firestore Network Sync Exception on [${col}]`, { message: err.message });
      });
      unsubs.push(unsubscribe);
    });

    // Cleanup active tunnel connections on unmount
    return () => unsubs.forEach(unsub => unsub());
  }, [user]);

  // Redux-Translator: Converts local component dispatched events into physical cloud writes
  const dispatch = async (action) => {
    // 🥶 Throttler Proxy Overlay
    if (action.type !== 'SET_DATA') {
        checkRateLimit('database_mutations', 80, 60 * 1000);
    }

    try {
      const type = action.type;
      const isAdd = type.startsWith('ADD_');
      const isUpdate = type.startsWith('UPDATE_');
      const isDelete = type.startsWith('DELETE_');

      let col = '';
      if (type.includes('BOOKING')) col = 'bookings';
      else if (type.includes('VEHICLE')) col = 'vehicles';
      else if (type.includes('DRIVER')) col = 'drivers';
      else if (type.includes('PACKAGE')) col = 'packages';
      else if (type.includes('NOTIFICATION')) col = 'notifications';
      else if (type.includes('DRIVERAUTH')) col = 'driverAuth';
      else if (type.includes('PORTER')) col = 'porters';
      else if (type.includes('DRIVERLOCATION')) col = 'driverLocations';
      else if (type.includes('SOSALERT')) col = 'sosAlerts';
      else if (type.includes('TRIPUPDATE')) col = 'tripUpdates';
      else if (type.includes('CHAT') || type.includes('DRIVER_MESSAGE')) col = 'driverMessages';

      if (!col) return;

      // ---- 🛡️ IDOR Cloud Access Control ----
      if ((isUpdate || isDelete) && user.role !== 'admin') {
         const targetId = isDelete ? action.payload : action.payload.id;
         const item = state[col].find(i => i.id === targetId);
         if (item && item.createdById !== user.role) {
             logger.security(`IDOR EXCEPTION: Intercepted cross-tenant boundary mutation on ${col}`, { targetId, actingUser: user.role });
             throw new Error("SECURITY EXCEPTION: You do not have absolute permission to modify or delete this resource.");
         }
      }

      // ---- Cloud Execution Engine ----
      if (isAdd) {
         const payload = { ...action.payload };
         if (!payload.createdById) payload.createdById = user.role;
         delete payload.id; // Allow Google Firestore to strictly auto-generate UUIDs natively
         
         await addDoc(collection(db, col), payload);
         logger.info(`Firestore Document Synthesized in [${col}]`);
      } 
      else if (isUpdate) {
         const { id, ...payload } = action.payload;
         await updateDoc(doc(db, col, id), payload);
         logger.info(`Firestore Document Mutated in [${col}]`, { id });
      } 
      else if (isDelete) {
         const id = action.payload;
         await deleteDoc(doc(db, col, id));
         logger.info(`Firestore Document Severed from [${col}]`, { id });
      }
    } catch (err) {
       logger.error('Firestore Dispatch Kernel Exception', { error: err.message });
       toast.error(err.message);
    }
  };

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be consumed within a DataProvider Context Layer');
  return context;
};
