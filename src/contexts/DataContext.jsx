import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { initialData } from '../utils/seedData';
import { useAuth } from './AuthContext';
import { checkRateLimit } from '../utils/rateLimit';
import { logger } from '../utils/logger';

const DataContext = createContext();

const dataReducer = (state, action) => {
  switch (action.type) {
    case 'SET_DATA':
      return action.payload;
    case 'ADD_BOOKING':
      return { ...state, bookings: [action.payload, ...state.bookings] };
    case 'UPDATE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map(b => b.id === action.payload.id ? action.payload : b)
      };
    case 'DELETE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.filter(b => b.id !== action.payload)
      };
    case 'ADD_VEHICLE':
      return { ...state, vehicles: [action.payload, ...state.vehicles] };
    case 'UPDATE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.map(v => v.id === action.payload.id ? action.payload : v)
      };
    case 'ADD_DRIVER':
      return { ...state, drivers: [action.payload, ...state.drivers] };
    case 'UPDATE_DRIVER':
      return {
        ...state,
        drivers: state.drivers.map(d => d.id === action.payload.id ? action.payload : d)
      };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n)
      };
    default:
      return state;
  }
};

const STORAGE_KEY = 'tours_db_prod';

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(dataReducer, null, () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialData;
  });

  const secureDispatch = (action) => {
    // 🥶 GLOBAL SCRAPING DEFENSE: Throttle any state modification (ADD/UPDATE/DELETE)
    // Ensures a malicious web scraper or loop cannot perform more than 80 operations per minute
    if (action.type !== 'SET_DATA') {
        checkRateLimit('database_mutations', 80, 60 * 1000);
    }

    if (user && user.role !== 'admin') {
      const isDelete = action.type.startsWith('DELETE_');
      const isUpdate = action.type.startsWith('UPDATE_');
      
      if (isDelete || isUpdate) {
         let collectionName = '';
         if (action.type.includes('BOOKING')) collectionName = 'bookings';
         else if (action.type.includes('VEHICLE')) collectionName = 'vehicles';
         else if (action.type.includes('DRIVER')) collectionName = 'drivers';
         else if (action.type.includes('PACKAGE')) collectionName = 'packages';

         if (collectionName && state[collectionName]) {
            const idToMatch = isDelete ? action.payload : action.payload.id;
            const item = state[collectionName].find(i => i.id === idToMatch);
            
            if (item && item.createdById !== user.role) {
                logger.security(`IDOR SECURITY EXCEPTION: Cross-tenant mutation blocked on ${collectionName} ID: ${idToMatch}`, { collectionName, idToMatch, actingUser: user.role, owner: item.createdById });
                throw new Error("SECURITY EXCEPTION: You do not have permission to modify or delete this resource.");
            }
         }
      }

      if (action.type.startsWith('ADD_') && action.payload && !action.payload.createdById) {
        action.payload.createdById = user.role;
      }
    }

    dispatch(action);
  };

  useEffect(() => {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  return (
    <DataContext.Provider value={{ state, dispatch: secureDispatch }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
