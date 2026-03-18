import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { initialData } from '../utils/seedData';

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

const STORAGE_KEY = 'toursdb_v1';

export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, null, () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialData;
  });

  useEffect(() => {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
