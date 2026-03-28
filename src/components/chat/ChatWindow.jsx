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
  AlertCircle
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';

export const ChatWindow = ({ chatId }) => {
  const { user } = useAuth();
  const { state } = useData();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef();

  const chat = state.chats?.find(c => c.id === chatId);
  const driver = state.drivers?.find(d => d.id === chat?.driverId) || { name: chat?.driverName || 'Driver' };

  // Real-time messages listener
  useEffect(() => {
    if (!chatId) return;
    
    setLoading(true);
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
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
      const unread = msgs.filter(m => m.senderId !== user.uid && m.status !== 'read');
      unread.forEach(m => {
        updateDoc(doc(db, 'chats', chatId, 'messages', m.id), { status: 'read' });
      });

      // Update chat unreadCount
      if (unread.length > 0) {
        updateDoc(doc(db, 'chats', chatId), { unreadCount: 0 });
      }
    });

    return () => unsubscribe();
  }, [chatId, user.uid]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      const messageData = {
        text: inputText,
        senderId: user.uid,
        senderRole: 'admin',
        timestamp: serverTimestamp(),
        status: 'sent',
        type: 'text'
      };

      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      
      // Update last message in chat metadata
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          text: inputText,
          senderId: user.uid,
          timestamp: new Date()
        },
        updatedAt: serverTimestamp()
      });

      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
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

        await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
        
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: {
            text: '📷 Photo sent',
            senderId: user.uid,
            timestamp: new Date()
          },
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Image upload failed:', err);
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
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Online</span>
            </div>
          </div>
        </div>
        <button className="p-2.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">
          <MoreVertical size={20} />
        </button>
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
            const isMe = msg.senderId === user.uid;
            const showTime = i === 0 || (msg.timestamp?.seconds - messages[i-1].timestamp?.seconds > 300);

            return (
              <div key={msg.id} className="space-y-2">
                {showTime && msg.timestamp && (
                  <div className="text-center">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 bg-white dark:bg-dark-card px-3 py-1 rounded-full border border-gray-50 dark:border-white/5">
                      {format(msg.timestamp.seconds * 1000, 'HH:mm • MMM d')}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] lg:max-w-[60%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
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
                    <div className={`flex items-center gap-1.5 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                        {msg.timestamp ? format(msg.timestamp.seconds * 1000, 'HH:mm') : 'Sending...'}
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
            placeholder="Type a message..."
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
    </div>
  );
};
