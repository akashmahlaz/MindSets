import { StreamVideoClient } from '@stream-io/video-react-native-sdk';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createVideoClient } from '../services/stream';
import { useAuth } from './AuthContext';

interface VideoContextType {
  videoClient: StreamVideoClient | null;
  isVideoConnected: boolean;
}

const VideoContext = createContext<VideoContextType | null>(null);

export const VideoProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [isVideoConnected, setIsVideoConnected] = useState(false);

  useEffect(() => {
    const initVideoClient = async () => {
      if (user && !videoClient) {
        try {
          // Get Stream token (you'll need to implement this)
          const response = await fetch('https://us-central1-mental-health-f7b7f.cloudfunctions.net/generateStreamToken', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await user.getIdToken()}`,
            },
            body: JSON.stringify({ userId: user.uid }),
          });
          const data = await response.json();
          const token = data.token;

          const client = createVideoClient(user, token);
          if (client) {
            setVideoClient(client);
            setIsVideoConnected(true);
            console.log('Video client initialized successfully');
          }
        } catch (error) {
          console.error('Error initializing video client:', error);
        }
      }
    };

    initVideoClient();

    // Cleanup on unmount or user change
    return () => {
      if (videoClient) {
        // Note: StreamVideoClient doesn't have a disconnect method like chat
        // It cleans up automatically when the component unmounts
        setVideoClient(null);
        setIsVideoConnected(false);
      }
    };
  }, [user]);

  const value = {
    videoClient,
    isVideoConnected,
  };

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};
