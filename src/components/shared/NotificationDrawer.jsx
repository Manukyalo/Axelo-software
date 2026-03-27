import React from 'react';
import { X, Bell, AlertCircle, Info, CheckCircle, ShieldAlert } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useAI } from '../../contexts/AIManagerContext';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const NotificationDrawer = ({ isOpen, onClose }) => {
  const { state, dispatch } = useData();
  const { user } = useAuth();
  const { aiAlerts, resolveAlert, markAlertRead } = useAI();

  if (!isOpen) return null;

  const myNotifications = state.notifications.filter(n => !n.targetRole || n.targetRole === user?.role);
  const internalUnread = myNotifications.filter(n => !n.read).length;
  const criticalAiAlerts = user?.role === 'admin' ? aiAlerts : [];
  const totalUnread = internalUnread + criticalAiAlerts.length;

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
            {totalUnread > 0 && <Badge variant="gold">{totalUnread}</Badge>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-card rounded-full text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* AI System Alerts Section */}
          {criticalAiAlerts.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-safari-gold mb-2 flex items-center gap-2">
                <Zap size={12} className="fill-current" /> System Alerts (AI)
              </h3>
              {criticalAiAlerts.map((a) => (
                <div 
                  key={a.id} 
                  className="p-4 rounded-xl bg-safari-gold/5 border border-safari-gold/20 shadow-sm transition-all cursor-pointer hover:bg-safari-gold/10"
                  onClick={() => { resolveAlert(a.id); onClose(); }}
                >
                   <div className="flex gap-3">
                     <div className="mt-1 text-safari-gold"><AlertCircle size={18} /></div>
                     <div className="flex-1">
                       <div className="flex justify-between items-start mb-1">
                         <p className="text-sm font-bold text-safari-primary dark:text-dark-text leading-tight">{a.title}</p>
                         <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">
                            {a.createdAt?.toDate ? formatDistanceToNow(a.createdAt.toDate(), { addSuffix: true }) : 'now'}
                         </span>
                       </div>
                       <p className="text-[11px] text-gray-500 leading-relaxed mb-2 line-clamp-2">{a.message}</p>
                       <div className="flex items-center gap-2">
                         <Badge variant={a.type.toLowerCase()} className="text-[8px] px-1.5 py-0 uppercase font-black tracking-widest bg-opacity-10 border-none">{a.type}</Badge>
                         <span className="text-[9px] font-bold text-safari-gold uppercase italic">Click to resolve</span>
                       </div>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          )}

          {/* Internal Notifications Section */}
          <div className="space-y-3">
            {myNotifications.length > 0 && (
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
                Recent Notifications
              </h3>
            )}
            {myNotifications.length > 0 ? (
              myNotifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${n.read ? 'bg-transparent border-gray-50 dark:border-dark-border opacity-60' : 'bg-white dark:bg-dark-card border-gray-100 shadow-sm'}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">{getIcon(n.type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm font-bold ${n.read ? 'text-gray-600' : 'text-safari-primary dark:text-dark-text'}`}>{n.title}</p>
                        <span className="text-[9px] text-gray-400 font-medium">
                           {n.date ? formatDistanceToNow(parseISO(n.date), { addSuffix: true }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mb-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                         {!n.read && <Badge variant="gold" className="text-[8px] px-1.5 py-0 uppercase font-black">New</Badge>}
                         <Badge variant={n.type === 'CRITICAL' ? 'danger' : n.type === 'WARNING' ? 'warning' : 'info'} className="text-[10px] px-1.5 py-0 uppercase font-black tracking-widest bg-opacity-10 border-none px-2">{n.type}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : criticalAiAlerts.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center opacity-50 space-y-2">
                <Bell size={48} className="text-gray-300" />
                <p className="font-dm-sans text-sm">No notifications yet</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-dark-border">
          <Button variant="ghost" className="w-full text-xs uppercase font-bold tracking-widest text-safari-gold" onClick={() => toast.success('All notifications cleared')}>
            Mark all as read
          </Button>
        </div>
      </div>
    </div>
  );
};
