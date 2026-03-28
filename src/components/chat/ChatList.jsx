import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, User, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ChatList = ({ activeChatId, onSelectChat }) => {
  const { state } = useData();
  const chats = state.driverMessages || [];
  const drivers = state.drivers || [];

  // Filter out any chats that don't have a valid driver
  const processedChats = chats.map(chat => {
    const driver = drivers.find(d => d.id === chat.id) || { name: chat.driverName || 'Unknown Driver' };
    return { ...chat, driver };
  }).sort((a, b) => {
    const timeA = a.lastTimestamp?.seconds || 0;
    const timeB = b.lastTimestamp?.seconds || 0;
    return timeB - timeA;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-card border-r border-gray-100 dark:border-white/5 w-80 lg:w-96">
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
            <button
              key={chat.id}
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
                  <h3 className="font-bold text-sm text-safari-primary dark:text-dark-text truncate">{chat.driver?.name}</h3>
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                    {chat.lastMessage?.timestamp?.seconds 
                      ? formatDistanceToNow(chat.lastMessage.timestamp.seconds * 1000, { addSuffix: false })
                      : ''}
                  </span>
                </div>
                <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'text-safari-primary dark:text-dark-text font-bold' : 'text-gray-400'}`}>
                  {chat.lastMessage?.senderId === 'admin' ? 'You: ' : ''}{chat.lastMessage?.text || 'Sent an attachment'}
                </p>
              </div>

              {chat.unreadCount > 0 && (
                <div className="w-5 h-5 bg-safari-gold rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-lg shadow-safari-gold/20">
                  {chat.unreadCount}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
