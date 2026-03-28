import React, { useState } from 'react';
import { 
  Bell, 
  Sun, 
  Moon, 
  Search,
  Settings,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useAI } from '../../contexts/AIManagerContext';
import { NotificationDrawer } from '../shared/NotificationDrawer';

export const Header = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const { state } = useData();
  const { criticalCount } = useAI();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Null-safe notification filtering
  const myNotifications = (state?.notifications || []).filter(n => {
    if (!n) return false;
    return !n.targetRole || n.targetRole === user?.role || n.targetRole === 'both';
  });
  
  const internalUnread = myNotifications.filter(n => !n.read).length;
  const totalUnread = internalUnread + (user?.role === 'admin' ? (criticalCount || 0) : 0);
  const hasCritical = user?.role === 'admin' && (criticalCount || 0) > 0;

  return (
    <header className="h-20 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-gray-100 dark:border-dark-border px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search bookings, vehicles, drivers..." 
          className="w-full bg-gray-50 dark:bg-dark-surface border-none rounded-button py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-safari-gold/20 outline-none font-dm-sans text-sm transition-all"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleDarkMode}
          className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-card rounded-button text-gray-500 transition-colors"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(true)}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-dark-card rounded-button text-gray-500 transition-colors relative"
          >
            <Bell size={20} />
            {totalUnread > 0 && (
              <span className={`
                absolute top-2.5 right-2.5 w-4 h-4 text-white text-[9px] font-bold rounded-full border-2 border-white dark:border-dark-bg flex items-center justify-center
                ${hasCritical ? 'bg-red-500 animate-pulse' : 'bg-safari-warning'}
              `}>
                {totalUnread}
              </span>
            )}
          </button>
          
          <NotificationDrawer 
            isOpen={showNotifications} 
            onClose={() => setShowNotifications(false)} 
          />
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 pl-3 pr-2 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-card rounded-button transition-colors"
          >
            <div className="w-9 h-9 bg-safari-gold/20 text-safari-gold rounded-full flex items-center justify-center font-bold font-dm-sans">
              {user?.role === 'admin' ? 'AD' : 'RE'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold font-dm-sans text-safari-primary dark:text-dark-text">
                {user?.role === 'admin' ? 'Administrator' : 'Reservations Agent'}
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                Level 1 Access
              </p>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-card rounded-card shadow-xl border border-gray-100 dark:border-dark-border py-2 animate-fade-in">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-safari-gold/5 hover:text-safari-gold transition-colors text-left">
                <User size={18} /> Profile Settings
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-safari-gold/5 hover:text-safari-gold transition-colors text-left">
                <Settings size={18} /> System Config
              </button>
              <div className="h-px bg-gray-100 dark:bg-dark-border my-2" />
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-safari-warning hover:bg-safari-warning/5 transition-colors text-left font-bold"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
