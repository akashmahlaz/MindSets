import { createContext, useContext } from 'react';
import { chatClient, videoClient } from '../services/stream';

interface StreamContextType {
  chatClient: any;
  videoClient: any;
  isStreamConnected: boolean;
}

export const StreamContext = createContext<StreamContextType | null>(null);

export const StreamProvider = ({ children }: { children: React.ReactNode }) => {
  // Stream connection is now handled in AuthContext to prevent duplicates
  // This provider just gives access to the clients
  
  const value = {
    chatClient,
    videoClient,
    isStreamConnected: !!chatClient.userID,
  };

  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  );
};

export const useStream = () => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStream must be used within a StreamProvider');
  }
  return context;
};
