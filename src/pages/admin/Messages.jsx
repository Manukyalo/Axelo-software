import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { ChatList } from '../../components/chat/ChatList';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { useLocation } from 'react-router-dom';

export const Messages = () => {
  const location = useLocation();
  const [activeChatId, setActiveChatId] = useState(null);

  // Handle opening a specific chat via navigation state (from Drivers page)
  useEffect(() => {
    if (location.state?.chatId) {
      setActiveChatId(location.state.chatId);
    }
  }, [location.state]);

  return (
    <PageWrapper title="Fleet Communications Hub">
      <div className="h-[calc(100vh-180px)] mt-2 bg-white dark:bg-dark-card rounded-3xl overflow-hidden flex border border-gray-100 dark:border-white/5 shadow-2xl shadow-safari-primary/5">
        <ChatList 
          activeChatId={activeChatId} 
          onSelectChat={setActiveChatId} 
        />
        <ChatWindow 
          chatId={activeChatId} 
        />
      </div>
    </PageWrapper>
  );
};
