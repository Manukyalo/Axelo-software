import React from 'react';
import { X, Bell, AlertCircle, Info, CheckCircle, ShieldAlert, UserPlus, Zap, Trash2 } from 'lucide-react';
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
  const { aiAlerts, resolveAlert } = useAI();

  if (!isOpen) return null;

  // Safer filtering
  const myNotifications = (state?.notifications || [])
    .filter(n => {
      if (!n) return false;
      return !n.targetRole || n.targetRole === user?.role || n.targetRole === 'both';
    })
    .sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : (a.date ? new Date(a.date) : 0);
      const dateB = b.date?.toDate ? b.date.toDate() : (b.date ? new Date(b.date) : 0);
      return dateB - dateA;
    });

  const internalUnread = myNotifications.filter(n => !n.read).length;
  const criticalAiAlerts = (user?.role === 'admin' ? aiAlerts : []) || [];
  const totalUnread = internalUnread + criticalAiAlerts.length;

  const markRead = (id) => {
    if (!id) return;
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  };

  const handleClearAll = () => {
    try {
      myNotifications.forEach(n => {
        dispatch({ type: 'DELETE_NOTIFICATION', payload: n.id });
      });
      toast.success('Inbox purged');
    } catch (err) {
      toast.error('Failed to clear notifications');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'SOS': return <ShieldAlert className="text-red-500 animate-pulse" size={18} />;
      case 'REGISTRATION': return <UserPlus className="text-safari-gold" size={18} />;
      case 'CRITICAL': return <AlertCircle className="text-red-500" size={18} />;
      case 'WARNING': return <ShieldAlert className="text-safari-warning" size={18} />;
      case 'SUCCESS': return <CheckCircle className="text-safari-success" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  const formatSafeDate = (date) => {
    if (!date) return 'Recently';
    try {
      if (date.toDate) return formatDistanceToNow(date.toDate(), { addSuffix: true });
      if (typeof date === 'string') return formatDistanceToNow(parseISO(date), { addSuffix: true });
      return 'Recently';
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white/95 dark:bg-[#111B15]/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col border-l border-white/10">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-safari-gold/10 rounded-xl flex items-center justify-center text-safari-gold shadow-lg shadow-safari-gold/5">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-safari-primary dark:text-white uppercase tracking-tight">System Alerts</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
                {totalUnread} Unresolved Signals
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          
          {/* AI Critical Section */}
          {criticalAiAlerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-safari-gold flex items-center gap-2">
                  <Zap size={10} className="fill-current" /> AI Neural Defense
                </h3>
                <button 
                  onClick={() => {
                    criticalAiAlerts.forEach(a => resolveAlert(a.id));
                    toast.success('All AI signals resolved');
                  }}
                  className="text-[8px] font-black uppercase tracking-widest text-safari-gold/60 hover:text-safari-gold border border-safari-gold/20 px-2 py-1 rounded-md transition-all"
                >
                  Resolve All
                </button>
              </div>
              {criticalAiAlerts.map((a) => (
                <div 
                  key={a.id} 
                  className="p-5 rounded-[20px] bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 shadow-sm transition-all cursor-pointer hover:bg-red-500/10"
                  onClick={() => resolveAlert(a.id)}
                >
                   <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-200 dark:shadow-none">
                        <ShieldAlert size={16} />
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-1">
                         <p className="text-sm font-black text-safari-primary dark:text-white leading-tight uppercase tracking-tight">{a.title}</p>
                         <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap ml-2">
                            {formatSafeDate(a.createdAt)}
                         </span>
                       </div>
                       <p className="text-xs text-gray-500 font-medium leading-relaxed mb-3 line-clamp-3">{a.message}</p>
                       <div className="flex items-center gap-2">
                         <Badge className="bg-red-500 text-[8px] px-2 py-0 border-none uppercase font-black">Urgent</Badge>
                         <span className="text-[9px] font-black text-safari-gold dark:text-safari-gold uppercase tracking-widest italic animate-pulse">Acknowledge Signal</span>
                       </div>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          )}

          {/* Regular Notifications */}
          <div className="space-y-3">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 px-2">
              Operation Signals
            </h3>
            {myNotifications.length > 0 ? (
              myNotifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`group p-5 rounded-[24px] border transition-all cursor-pointer ${n.read ? 'bg-transparent border-gray-100 dark:border-white/5 opacity-50' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 shadow-xl shadow-safari-primary/5'}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className="flex gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.read ? 'bg-gray-100 dark:bg-white/5' : 'bg-safari-gold/10 text-safari-gold'}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm font-black uppercase tracking-tight truncate pr-4 ${n.read ? 'text-gray-500' : 'text-safari-primary dark:text-white'}`}>{n.title}</p>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">
                           {formatSafeDate(n.date)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed mb-3">{n.message}</p>
                      <div className="flex items-center gap-2">
                         {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-safari-gold animate-pulse" />}
                         <Badge variant="outline" className="text-[8px] px-2 py-0 uppercase font-black tracking-[0.2em] border-gray-100 dark:border-white/10 text-gray-400">{n.type || 'SIGNAL'}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : criticalAiAlerts.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center opacity-40 space-y-4">
                <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[32px] flex items-center justify-center text-gray-300">
                   <Bell size={40} />
                </div>
                <p className="font-black text-xs uppercase tracking-[0.3em] text-center">Status: All Clear</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 gap-3 bg-gray-50/50 dark:bg-white/5">
          <Button 
            variant="ghost" 
            className="flex-1 h-12 rounded-2xl text-[10px] uppercase font-black tracking-widest text-safari-primary dark:text-white hover:bg-white dark:hover:bg-white/10"
            onClick={() => {
              myNotifications.forEach(n => !n.read && markRead(n.id));
              toast.success('All marked as read');
            }}
          >
            Acknowledge All
          </Button>
          <Button 
            variant="outline"
            className="flex-1 h-12 rounded-2xl text-[10px] uppercase font-black tracking-widest text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
            onClick={handleClearAll}
          >
            <Trash2 size={12} className="mr-2" /> Purge Inbox
          </Button>
        </div>
      </div>
    </div>
  );
};
