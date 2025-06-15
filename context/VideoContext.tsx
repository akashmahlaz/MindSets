import { 
  StreamVideo, 
  StreamVideoClient,
  StreamCall,
  useCalls,
  RingingCallContent
} from '@stream-io/video-react-native-sdk';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { createVideoClient } from '../services/stream';
import { useAuth } from './AuthContext';

interface VideoContextType {
  videoClient: StreamVideoClient | null;
  isVideoConnected: boolean;
}

const VideoContext = createContext<VideoContextType | null>(null);

// Component to handle ringing calls
const RingingCalls = () => {
  // collect all ringing kind of calls managed by the SDK
  const calls = useCalls().filter((c) => c.ringing);
  // for simplicity, we only take the first one but
  // there could be multiple calls ringing at the same time
  const ringingCall = calls[0];
  
  if (!ringingCall) return null;
  
  return (
    <StreamCall call={ringingCall}>
      <SafeAreaView style={StyleSheet.absoluteFill}>
        <RingingCallContent />
      </SafeAreaView>
    </StreamCall>
  );
};

export const VideoProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [isVideoConnected, setIsVideoConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initVideoClient = async () => {
      console.log('VideoContext: initVideoClient called');
      console.log('VideoContext: user available:', !!user);
      console.log('VideoContext: existing videoClient:', !!videoClient);
      console.log('VideoContext: isInitializing:', isInitializing);
      
      if (user && !videoClient && !isInitializing) {
        try {
          setIsInitializing(true);
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
        } finally {
          setIsInitializing(false);
        }
      } else if (!user && videoClient) {
        console.log('VideoContext: No user, clearing video client');
        setVideoClient(null);
        setIsVideoConnected(false);
        setIsInitializing(false);
      }
    };

    initVideoClient();
  }, [user?.uid]); // Only depend on user ID changes

  const value = {
    videoClient,
    isVideoConnected,
  };  return (
    <VideoContext.Provider value={value}>
      {videoClient ? (
        <StreamVideo client={videoClient}>
          {children}
          <RingingCalls />
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
