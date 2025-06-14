import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { getStreamToken } from '../services/stream';
import { useAuth } from './AuthContext';

interface ChatContextType {
  chatClient: StreamChat | null;
  isChatConnected: boolean;
  isConnecting: boolean;
  connectToChat: () => Promise<void>;
  disconnectFromChat: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

// Initialize Stream Chat client
const STREAM_API_KEY = 'egq2n55kb4yn';
const chatClient = StreamChat.getInstance(STREAM_API_KEY);

// Configure client options
chatClient.setBaseURL('https://chat.stream-io-api.com');
chatClient.recoverStateOnReconnect = true;

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectToChat = async () => {
    if (!user || isConnecting || isChatConnected) {
      console.log('Cannot connect to chat:', { 
        hasUser: !!user, 
        isConnecting, 
        isChatConnected,
        currentUserId: chatClient.userID 
      });
      return;
    }

    try {
      setIsConnecting(true);
      console.log('Connecting to Stream Chat for user:', user.uid);

      // Get Stream token
      const token = await getStreamToken(user.uid);
      if (!token) {
        throw new Error('Failed to get Stream token');
      }

      // Connect user to Stream Chat
      await chatClient.connectUser(
        {
          id: user.uid,
          name: user.displayName || user.email || 'Anonymous',
          image: user.photoURL || `https://getstream.io/random_png/?name=${user.displayName || user.email}`,
        },
        token
      );

      setIsChatConnected(true);
      console.log('Successfully connected to Stream Chat');
    } catch (error) {
      console.error('Error connecting to Stream Chat:', error);
      setIsChatConnected(false);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromChat = async () => {
    if (chatClient.userID && isChatConnected) {
      try {
        console.log('Disconnecting from Stream Chat');
        await chatClient.disconnectUser();
        setIsChatConnected(false);
        console.log('Successfully disconnected from Stream Chat');
      } catch (error) {
        console.error('Error disconnecting from Stream Chat:', error);
      }
    }
  };

  // Auto-connect when user is available
  useEffect(() => {
    if (user && !isChatConnected && !isConnecting) {
      connectToChat().catch(error => {
        console.error('Auto-connect to chat failed:', error);
      });
    } else if (!user && isChatConnected) {
      disconnectFromChat();
    }
  }, [user?.uid]);

  const value: ChatContextType = {
    chatClient: isChatConnected ? chatClient : null,
    isChatConnected,
    isConnecting,
    connectToChat,
    disconnectFromChat,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
