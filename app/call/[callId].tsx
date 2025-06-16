import { Button } from '@/components/ui/button';
import { useColorScheme } from '@/lib/useColorScheme';
import {
    Call,
    CallContent,
    StreamCall,
    useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CallScreen() {
  const { callId } = useLocalSearchParams<{ callId: string }>();
  const [call, setCall] = useState<Call | null>(null);
  const client = useStreamVideoClient();
  const { isDarkColorScheme } = useColorScheme();

  useEffect(() => {
    if (!client || !callId) return;

    const setupCall = async () => {
      try {
        const callToJoin = client.call('default', callId);
        await callToJoin.join({ create: true });
        setCall(callToJoin);
      } catch (error) {
        console.error('Error joining call:', error);
        Alert.alert('Error', 'Failed to join call');
        router.back();
      }
    };

    setupCall();

    return () => {
      if (call) {
        call.leave();
      }
    };
  }, [client, callId]);

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

  if (!call) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <StatusBar 
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={isDarkColorScheme ? '#000000' : '#ffffff'}
        />
        <View className="flex-1 justify-center items-center">
          <Text className="text-foreground text-lg">Joining call...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="#000000"
      />
      <StreamCall call={call}>
        <View className="flex-1 relative">
          <View className="absolute top-12 left-5 z-50">
            <Button 
              variant="secondary"
              onPress={handleEndCall}
              className="bg-black/50 border-white/20"
            >
              <Text className="text-white">← Back</Text>
            </Button>
          </View>
          <CallContent
            onHangupCallHandler={handleEndCall}
          />
        </View>
      </StreamCall>
    </SafeAreaView>
  );
}
