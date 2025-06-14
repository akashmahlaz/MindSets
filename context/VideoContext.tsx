import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-native-sdk';
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
      console.log('VideoContext: initVideoClient called');
      console.log('VideoContext: user available:', !!user);
      console.log('VideoContext: existing videoClient:', !!videoClient);
      
      if (user && !videoClient) {
        try {
          console.log('VideoContext: Initializing video client for user:', user.uid);
          
          // Get Stream token
          const response = await fetch('https://us-central1-mental-health-f7b7f.cloudfunctions.net/generateStreamToken', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await user.getIdToken()}`,
            },
            body: JSON.stringify({ userId: user.uid }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to get token: ${response.status}`);
          }
          
          const data = await response.json();
          const token = data.token;
          
          console.log('VideoContext: Token received, creating video client');
          
          const client = createVideoClient(user, token);
          if (client) {
            setVideoClient(client);
            setIsVideoConnected(true);
            console.log('VideoContext: Video client initialized successfully');
          } else {
            console.error('VideoContext: Failed to create video client');
          }
        } catch (error) {
          console.error('VideoContext: Error initializing video client:', error);
        }
      } else if (!user) {
        console.log('VideoContext: No user, clearing video client');
        setVideoClient(null);
        setIsVideoConnected(false);
      }
    };

    initVideoClient();

    // Cleanup on unmount or user change
    return () => {
      if (videoClient) {
        console.log('VideoContext: Cleaning up video client');
        // Note: StreamVideoClient doesn't have a disconnect method like chat
        // It cleans up automatically when the component unmounts
        setVideoClient(null);
        setIsVideoConnected(false);
      }
    };
  }, [user]); // Only depend on user changes

  const value = {
    videoClient,
    isVideoConnected,
  };
  return (
    <VideoContext.Provider value={value}>
      {videoClient ? (
        <StreamVideo client={videoClient}>
          {children}
        </StreamVideo>
      ) : (
        children
      )}
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
