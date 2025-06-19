import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useVideo } from '@/context/VideoContext';
import { useColorScheme } from '@/lib/useColorScheme';
import {
    Call,
    CallContent,
    CallingState,
    StreamCall,
    useCallStateHooks,
    useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CallScreen() {
  const { callId, callType = 'default', isVideo = 'true' } = useLocalSearchParams<{ 
    callId: string; 
    callType?: string;
    isVideo?: string;
  }>();
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCallCreator, setIsCallCreator] = useState<boolean>(false);
  const client = useStreamVideoClient();
  const { videoClient, joinCall } = useVideo();
  const { user } = useAuth();
  const { isDarkColorScheme } = useColorScheme();  useEffect(() => {
    if (!client || !callId || !user) {
      setError('Missing client, call ID, or user');
      return;
    }

    const setupCall = async () => {
      try {
        console.log('Setting up call:', callId, callType);
        
        // Get the call
        const callToSetup = client.call(callType, callId);
        
        try {
          // Try to get existing call
          await callToSetup.get();
          console.log('Found existing call:', callToSetup.cid);
          
          // Check if current user is the creator
          const createdBy = callToSetup.state.custom?.createdBy;
          const isCreator = createdBy === user.uid;
          setIsCallCreator(isCreator);
          
          console.log('Is call creator:', isCreator, 'Created by:', createdBy, 'Current user:', user.uid);
          
        } catch (getError) {
          console.log('Call not found, this might be an error:', getError);
          setError('Call not found');
          Alert.alert('Error', 'Call not found', [
            { text: 'OK', onPress: () => router.back() }
          ]);
          return;
        }
        
        // Set the call
        setCall(callToSetup);
        console.log('Call setup complete:', callToSetup.cid);
      } catch (error) {
        console.error('Error setting up call:', error);
        setError(error instanceof Error ? error.message : 'Failed to setup call');
        Alert.alert('Error', 'Failed to setup call', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    };

    setupCall();

    return () => {
      if (call) {
        call.leave().catch(console.error);
      }
    };
  }, [client, videoClient, callId, callType, user?.uid]);
  const handleEndCall = async () => {
    try {
      if (call) {
        await call.leave();
      }
      router.back();
    } catch (error) {
      console.error('Error ending call:', error);
      router.back();
    }
  };
  // Component to handle call states within StreamCall context
  const CallStateHandler = () => {
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();
    const [hasJoined, setHasJoined] = useState(false);

    useEffect(() => {
      if (callingState === CallingState.LEFT) {
        console.log('Call ended, navigating back');
        router.back();
      }
    }, [callingState]);

    // Function to join the call explicitly
    const handleJoinCall = async () => {
      if (!call) return;
      
      try {
        console.log('Joining call:', call.cid);
        await call.join();
        setHasJoined(true);
        console.log('Successfully joined call');
      } catch (error) {
        console.error('Error joining call:', error);
        Alert.alert('Error', 'Failed to join call');
      }
    };    // Show join call screen if not joined yet AND user is NOT the creator
    if (!hasJoined && callingState !== CallingState.JOINED && !isCallCreator) {
      return (
        <View className="flex-1 justify-center items-center bg-black p-6">
          <Text className="text-white text-2xl font-bold mb-4">Incoming Call</Text>
          <Text className="text-white/70 text-center mb-8">
            {isVideo === 'true' ? 'Video' : 'Audio'} call from another user
          </Text>
          <View className="space-y-4 w-full max-w-xs">
            <Button 
              onPress={handleJoinCall}
              className="bg-green-600 hover:bg-green-700"
            >
              <Text className="text-white font-semibold">
                Accept {isVideo === 'true' ? 'Video' : 'Audio'} Call
              </Text>
            </Button>
            <Button 
              variant="outline"
              onPress={handleEndCall}
              className="border-red-500 hover:bg-red-500/10"
            >
              <Text className="text-red-500">Decline Call</Text>
            </Button>
          </View>
        </View>
      );
    }

    // Show different UI based on call state
    if (callingState === CallingState.JOINING) {
      return (
        <View className="flex-1 justify-center items-center bg-black">
          <Text className="text-white text-lg">Connecting to call...</Text>
        </View>
      );
    }

    if (callingState === CallingState.RECONNECTING) {
      return (
        <View className="flex-1 justify-center items-center bg-black">
          <Text className="text-white text-lg">Reconnecting...</Text>
        </View>
      );
    }

    return (
      <View className="flex-1 relative">
        <View className="absolute top-12 left-5 z-50">
          <Button 
            variant="secondary"
            onPress={handleEndCall}
            className="bg-black/50 border-white/20"
          >
            <Text className="text-white">← End Call</Text>
          </Button>
        </View>
        <CallContent
          onHangupCallHandler={handleEndCall}
          supportedReactions={[
            { type: 'like', icon: '👍' },
            { type: 'love', icon: '❤️' },
            { type: 'haha', icon: '😂' },
            { type: 'wow', icon: '😮' },
          ]}
        />
      </View>
    );
  };

  // Show error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <StatusBar 
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={isDarkColorScheme ? '#000000' : '#ffffff'}
        />
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-foreground text-lg text-center mb-4">Failed to join call</Text>
          <Text className="text-muted-foreground text-center mb-6">{error}</Text>
          <Button onPress={() => router.back()}>
            <Text>Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }
  // Show loading state
  if (!call) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <StatusBar 
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={isDarkColorScheme ? '#000000' : '#ffffff'}
        />
        <View className="flex-1 justify-center items-center">
          <Text className="text-foreground text-lg">Joining call...</Text>
          <Text className="text-muted-foreground text-sm mt-2">Call ID: {callId}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="#000000"
      />
      <StreamCall call={call}>
        <CallStateHandler />
      </StreamCall>
    </SafeAreaView>
  );
}
