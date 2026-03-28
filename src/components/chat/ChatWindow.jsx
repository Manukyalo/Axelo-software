import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  MoreVertical, 
  Check, 
  CheckCheck,
  Loader2,
  XCircle,
  AlertCircle,
  Trash2,
  X
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const ChatWindow = ({ chatId }) => {
  const { user } = useAuth();
  const { state, dispatch } = useData();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const scrollRef = useRef();

  const chat = state.driverMessages?.find(c => c.id === chatId);
  const driver = state.drivers?.find(d => d.id === chatId) || { name: chat?.driverName || 'Driver' };

  // Real-time messages listener
  useEffect(() => {
    if (!chatId) return;
    
    setLoading(true);
    const q = query(
      collection(db, 'driverMessages', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setLoading(false);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);

      // Mark messages as read if sent by driver
      const unread = msgs.filter(m => m.senderRole !== 'admin' && !m.read);
      if (unread.length > 0) {
        unread.forEach(m => {
          updateDoc(doc(db, 'driverMessages', chatId, 'messages', m.id), { read: true });
        });

        // Update chat unreadCount
        updateDoc(doc(db, 'driverMessages', chatId), { unreadCount: 0 });
      }
    });

    return () => unsubscribe();
  }, [chatId, user.uid]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    const textSnapshot = inputText;
    setInputText(''); // Optimistic clear

    try {
      const messageData = {
        text: textSnapshot,
        senderId: user.uid,
        senderRole: 'admin',
        timestamp: serverTimestamp(),
        status: 'sent',
        type: 'text'
      };

      await addDoc(collection(db, 'driverMessages', chatId, 'messages'), messageData);
      
      // Update last message in chat metadata
      await updateDoc(doc(db, 'driverMessages', chatId), {
        lastMessage: textSnapshot,
        lastTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: 0,
        isDeleted: false
      });

    } catch (err) {
      console.error('Failed to send message:', err);
      setInputText(textSnapshot); // Restore on failure
      toast.error('Failed to send signal');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await deleteDoc(doc(db, 'driverMessages', chatId, 'messages', msgId));
      
      // Sync parent metadata if we want the sidebar to update
      await updateDoc(doc(db, 'driverMessages', chatId), {
        lastMessage: '🗑️ Content removed',
        updatedAt: serverTimestamp()
      });

      toast.success('Message deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleDeleteConversation = async () => {
    if (!chatId) return;
    try {
      await dispatch({ type: 'UPDATE_DRIVERMESSAGE', payload: { id: chatId, isDeleted: true } });
      toast.success('Conversation purged from log');
    } catch (err) {
      toast.error('Failed to purge conversation');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      try {
        setSending(true);
        const messageData = {
          image: base64,
          senderId: user.uid,
          senderRole: 'admin',
          timestamp: serverTimestamp(),
          status: 'sent',
          type: 'image'
        };

        await addDoc(collection(db, 'driverMessages', chatId, 'messages'), messageData);
        
        await updateDoc(doc(db, 'driverMessages', chatId), {
          lastMessage: '📷 Photo attachment',
          lastTimestamp: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isDeleted: false
        });
      } catch (err) {
        console.error('Image upload failed:', err);
        toast.error('Image transmission failed');
      } finally {
        setSending(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-dark-bg/50">
        <div className="w-24 h-24 bg-safari-primary/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
           <AlertCircle size={40} className="text-safari-primary dark:text-safari-gold opacity-40" />
        </div>
        <h3 className="text-2xl font-playfair font-bold text-safari-primary dark:text-dark-text mb-2 text-center">Your Fleet Inbox</h3>
        <p className="text-sm text-gray-500 max-w-xs text-center">Select a conversation from the list or start a new message from the Fleet Personnel section.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-dark-card overflow-hidden">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-safari-primary/10 dark:bg-white/10 flex items-center justify-center text-safari-primary dark:text-safari-gold font-bold">
            {driver.name[0]}
          </div>
          <div>
            <h3 className="font-bold text-safari-primary dark:text-dark-text">{driver.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Secure Signal Establishment</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={handleDeleteConversation}
            className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all group"
            title="Delete Conversation"
           >
              <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
           </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 no-scrollbar bg-gray-50/50 dark:bg-dark-bg/20"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-safari-gold" size={32} />
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderRole === 'admin';
            const showTime = i === 0 || (msg.timestamp?.seconds - messages[i-1].timestamp?.seconds > 300);

            return (
              <div key={msg.id} className="space-y-2 group">
                {showTime && msg.timestamp && (
                  <div className="text-center">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 bg-white dark:bg-dark-card px-3 py-1 rounded-full border border-gray-50 dark:border-white/5">
                      {format(msg.timestamp.seconds * 1000, 'HH:mm • MMM d')}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] lg:max-w-[60%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="relative flex items-center gap-2">
                       {isMe && (
                         <button 
                           onClick={() => setDeleteId(msg.id)}
                           className="opacity-0 group-hover:opacity-100 p-1 text-red-300 hover:text-red-500 transition-all rounded-lg"
                         >
                            <Trash2 size={12} />
                         </button>
                       )}
                       <div className={`
                        p-4 rounded-3xl shadow-sm text-sm font-dm-sans leading-relaxed
                        ${isMe 
                          ? 'bg-safari-primary text-white rounded-tr-none' 
                          : 'bg-white dark:bg-dark-bg border border-gray-100 dark:border-white/5 text-safari-primary dark:text-dark-text rounded-tl-none'}
                      `}>
                        {msg.type === 'image' ? (
                          <img 
                            src={msg.image} 
                            alt="Attachment" 
                            className="rounded-xl max-h-64 object-cover cursor-zoom-in hover:brightness-110 transition-all" 
                          />
                        ) : (
                          msg.text
                        )}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                        {msg.timestamp ? format(msg.timestamp.seconds * 1000, 'HH:mm') : 'Syncing...'}
                      </span>
                      {isMe && (
                        msg.status === 'read' 
                          ? <CheckCheck size={12} className="text-safari-gold" /> 
                          : <Check size={12} className="text-gray-300" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 lg:p-6 bg-white dark:bg-dark-card border-t border-gray-100 dark:border-white/5">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 lg:gap-4 bg-gray-50 dark:bg-dark-bg/50 p-2 lg:p-3 rounded-2xl lg:rounded-3xl border border-gray-50 dark:border-white/5 focus-within:ring-2 focus-within:ring-safari-gold/20 transition-all">
          <label className="p-2 lg:p-3 text-gray-400 hover:text-safari-gold hover:bg-white dark:hover:bg-white/10 rounded-xl lg:rounded-2xl transition-all cursor-pointer">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <ImageIcon size={20} />
          </label>
          <button type="button" className="hidden lg:block p-3 text-gray-400 hover:text-safari-gold hover:bg-white dark:hover:bg-white/10 rounded-2xl transition-all">
            <Paperclip size={20} />
          </button>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Secure message to unit..."
            className="flex-1 bg-transparent border-none text-sm lg:text-base text-safari-primary dark:text-dark-text focus:ring-0 placeholder:text-gray-400 font-dm-sans"
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || sending}
            className={`
              p-3 lg:p-4 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all shadow-lg
              ${inputText.trim() && !sending 
                ? 'bg-safari-gold text-white shadow-safari-gold/30 hover:scale-105 active:scale-95' 
                : 'bg-gray-200 dark:bg-white/5 text-gray-400 grayscale cursor-not-allowed shadow-none'}
            `}
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
      </div>

      {/* Delete Confirmation Overlay */}
      {deleteId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/40 dark:bg-dark-bg/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-dark-card p-6 rounded-[24px] shadow-2xl border border-gray-100 dark:border-white/5 max-w-xs w-full text-center">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Trash2 size={24} />
              </div>
              <h4 className="text-lg font-bold text-safari-primary dark:text-white mb-2">Delete Message?</h4>
              <p className="text-xs text-gray-500 mb-6">This message will be removed for everyone in this conversation.</p>
              <div className="flex gap-2">
                 <Button variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>Keep</Button>
                 <Button className="flex-1 bg-red-500 hover:bg-red-600 border-none text-white" onClick={() => handleDeleteMessage(deleteId)}>Delete</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
