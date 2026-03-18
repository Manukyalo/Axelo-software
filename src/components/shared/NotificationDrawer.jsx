import React from 'react';
import { X, Bell, AlertCircle, Info, CheckCircle, ShieldAlert } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { format, parseISO } from 'date-fns';

export const NotificationDrawer = ({ isOpen, onClose }) => {
  const { state, dispatch } = useData();

  if (!isOpen) return null;

  const markRead = (id) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'CRITICAL': return <AlertCircle className="text-red-500" size={18} />;
      case 'WARNING': return <ShieldAlert className="text-safari-warning" size={18} />;
      case 'SUCCESS': return <CheckCircle className="text-safari-success" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-dark-surface shadow-2xl animate-slide-in-right flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-safari-gold" />
            <h2 className="text-xl font-playfair font-bold text-safari-primary dark:text-dark-text">Notifications</h2>
            <Badge variant="gold">{state.notifications.filter(n => !n.read).length}</Badge>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-card rounded-full text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {state.notifications.length > 0 ? (
            state.notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 rounded-xl border transition-all cursor-pointer ${n.read ? 'bg-transparent border-gray-50 dark:border-dark-border opacity-60' : 'bg-safari-gold/5 border-safari-gold/20 shadow-sm'}`}
                onClick={() => markRead(n.id)}
              >
                <div className="flex gap-3">
                  <div className="mt-1">{getIcon(n.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className={`text-sm font-bold ${n.read ? 'text-gray-600' : 'text-safari-primary dark:text-dark-text'}`}>{n.title}</p>
                      <span className="text-[10px] text-gray-400 font-medium">12m ago</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">{n.message}</p>
                    {!n.read && <Badge variant="gold" className="text-[8px] px-1.5 py-0">NEW</Badge>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-2">
              <Bell size={48} className="text-gray-300" />
              <p className="font-dm-sans text-sm">No notifications yet</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-dark-border">
          <Button variant="ghost" className="w-full text-xs uppercase font-bold tracking-widest text-safari-gold">
            Mark all as read
          </Button>
        </div>
      </div>
    </div>
  );
};
