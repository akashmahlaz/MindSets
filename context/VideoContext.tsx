import {
  RingingCallContent,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  StreamVideoRN,
  useCalls
} from '@stream-io/video-react-native-sdk';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { createVideoClient } from '../services/stream';
import { useAuth } from './AuthContext';

interface VideoContextType {
  videoClient: StreamVideoClient | null;
  isVideoConnected: boolean;
  createCall: (callId: string, members: string[], isVideo?: boolean) => Promise<any | null>;
  joinCall: (callType: string, callId: string) => Promise<any | null>;
  currentCall: any | null;
  isCreatingCall: boolean;
}

const VideoContext = createContext<VideoContextType | null>(null);

// Component to handle incoming ringing calls for receivers
const RingingCalls = () => {
  const { user } = useAuth();
  // collect all ringing kind of calls managed by the SDK
  const calls = useCalls().filter((c) => c.ringing);
  
  // Add debugging
  console.log('RingingCalls: Current user:', user?.uid);
  console.log('RingingCalls: All calls:', useCalls().length);
  console.log('RingingCalls: Ringing calls:', calls.length);
  calls.forEach((call, index) => {
    console.log(`RingingCalls: Call ${index}:`, call.cid, 'ringing:', call.ringing);
    console.log(`RingingCalls: Call ${index} custom data:`, call.state.custom);
  });
  
  // for simplicity, we only take the first one but
  // there could be multiple calls ringing at the same time
  const ringingCall = calls[0];
  
  if (!ringingCall || !user) return null;
  
  // Check if current user is the creator of the call
  const callCreator = ringingCall.state.custom?.createdBy;
  const isCallCreatedByMe = callCreator === user.uid;
  
  console.log('RingingCalls: Call creator:', callCreator, 'Current user:', user.uid, 'Is creator:', isCallCreatedByMe);

  // If user is the creator, they should already be in the call screen
  // so don't show ringing interface
  if (isCallCreatedByMe) {
    console.log('RingingCalls: User is creator, not showing ringing interface');
    return null;
  }

  console.log('RingingCalls: Showing ringing interface for incoming call');
  
  return (
    <StreamCall call={ringingCall}>
      <SafeAreaView style={StyleSheet.absoluteFill}>
        {/* Only show incoming call interface for receivers */}
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
  const [currentCall, setCurrentCall] = useState<any | null>(null);
  const [isCreatingCall, setIsCreatingCall] = useState(false);

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
          
          console.log('VideoContext: Token received, creating video client');          const client = createVideoClient(user, token);
          if (client) {
            setVideoClient(client);
            setIsVideoConnected(true);
            console.log('VideoContext: Video client initialized successfully');
            
            // Add some debugging for push notifications
            console.log('VideoContext: User should be able to receive video call notifications');
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
        setCurrentCall(null);
      }
    };

    initVideoClient();
  }, [user?.uid]); // Only depend on user ID changes  // Create a new call and auto-join the creator, send ring to others
  const createCall = async (callId: string, members: string[], isVideo: boolean = true) => {
    if (!videoClient || !user) {
      console.error('Video client not initialized or user not available');
      return null;
    }

    try {
      setIsCreatingCall(true);
      console.log('Creating call:', callId, 'with members:', members, 'isVideo:', isVideo);
      
      const call = videoClient.call('default', callId);
      
      // Include current user in members
      const allMembers = [
        { user_id: user.uid },
        ...members.map(memberId => ({ user_id: memberId }))
      ];      // Use getOrCreate with ring: true to ensure proper ringing
      await call.getOrCreate({
        ring: true, // This ensures ringing notifications are sent
        video: isVideo,
        data: {
          members: allMembers,
          custom: {
            isVideo,
            createdAt: new Date().toISOString(),
            createdBy: user.uid, // Track who created the call
          },
        },
      });

      console.log('VideoContext: Call created with ring=true');
      console.log('VideoContext: Members who should receive ringing:', members);

      // Creator automatically joins the call
      await call.join();
      setCurrentCall(call);

      console.log('Call created with ringing, creator joined:', call.cid);
      return call;
    } catch (err) {
      console.error('Error creating call:', err);
      return null;
    } finally {
      setIsCreatingCall(false);
    }
  };

  // Join an existing call
  const joinCall = async (callType: string, callId: string) => {
    if (!videoClient) {
      console.error('Video client not initialized');
      return null;
    }

    try {
      console.log('Joining call:', callType, callId);
      const call = videoClient.call(callType, callId);
      await call.join();
      setCurrentCall(call);
      console.log('Joined call successfully:', call.cid);
      return call;
    } catch (err) {
      console.error('Error joining call:', err);
      return null;
    }
  };
  const value = {
    videoClient,
    isVideoConnected,
    createCall,
    joinCall,
    currentCall,
    isCreatingCall,
  };
  return (
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
