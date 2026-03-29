import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, MessageCircle, Trash2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../ui/Button';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

export const ChatList = ({ activeChatId, onSelectChat }) => {
  const { state, dispatch } = useData();
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  const chats = state.driverMessages || [];
  const drivers = state.drivers || [];

  // Filter out any chats that don't have a valid driver or are deleted
  const processedChats = chats.filter(c => !c.isDeleted).map(chat => {
    const driver = drivers.find(d => d.id === chat.id) || { name: chat.driverName || 'Unknown Driver' };
    return { ...chat, driver };
  }).sort((a, b) => {
    const timeA = a.lastTimestamp?.seconds || 0;
    const timeB = b.lastTimestamp?.seconds || 0;
    return timeB - timeA;
  });

  const handleDeleteChat = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'driverMessages', id));
      toast.success('Conversation purged');
      setConfirmDelete(null);
      if (activeChatId === id) {
        onSelectChat(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete conversation');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-card border-r border-gray-100 dark:border-white/5 w-80 lg:w-96 relative">
      <div className="p-6 border-b border-gray-100 dark:border-white/5">
        <h2 className="text-xl font-playfair font-bold text-safari-primary dark:text-dark-text mb-4">Fleet Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search drivers..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-safari-gold/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {processedChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40 p-8 text-center text-gray-500">
            <MessageCircle size={48} className="mb-4" />
            <p className="text-sm font-medium">No active conversations</p>
            <p className="text-[10px] uppercase font-black tracking-widest mt-2">Start a chat via Fleet Personnel</p>
          </div>
        ) : (
          processedChats.map(chat => (
            <div key={chat.id} className="group relative">
              <button
                onClick={() => onSelectChat(chat.id)}
                className={`w-full p-4 flex gap-4 items-center transition-all border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 ${activeChatId === chat.id ? 'bg-safari-gold/5 border-l-4 border-l-safari-gold' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-safari-primary/10 dark:bg-white/10 flex items-center justify-center text-safari-primary dark:text-safari-gold font-bold">
                    {chat.driver?.name?.[0] || 'D'}
                  </div>
                  {chat.status === 'online' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-dark-card rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-sm text-safari-primary dark:text-dark-text truncate pr-6">{chat.driver?.name}</h3>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                      {chat.lastTimestamp?.seconds 
                        ? formatDistanceToNow(chat.lastTimestamp.seconds * 1000, { addSuffix: false })
                        : ''}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'text-safari-primary dark:text-dark-text font-bold' : 'text-gray-400'}`}>
                    {chat.lastMessage?.senderId === 'admin' ? 'You: ' : ''}{chat.lastMessage || 'Sent an attachment'}
                  </p>
                </div>

                {chat.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-safari-gold rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-lg shadow-safari-gold/20">
                    {chat.unreadCount}
                  </div>
                )}
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(chat.id);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10"
                title="Delete Conversation"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/60 dark:bg-dark-bg/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white dark:bg-dark-card p-8 rounded-[32px] shadow-2xl border border-gray-100 dark:border-white/5 max-w-[280px] w-full text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                 <AlertCircle size={32} />
              </div>
              <h4 className="text-xl font-black text-safari-primary dark:text-white mb-2 uppercase tracking-tight">Purge Chat?</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 leading-relaxed font-medium">This will permanently erase all history with this unit.</p>
              <div className="flex flex-col gap-2">
                 <Button 
                   className="w-full bg-red-500 hover:bg-red-600 border-none text-white h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                   onClick={(e) => handleDeleteChat(e, confirmDelete)}
                 >
                    Confirm Delete
                 </Button>
                 <Button 
                   variant="ghost" 
                   className="w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400"
                   onClick={() => setConfirmDelete(null)}
                 >
                    Dismiss
                 </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
