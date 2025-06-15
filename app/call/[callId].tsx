import {
    Call,
    CallContent,
    StreamCall,
    useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CallScreen() {
  const { callId } = useLocalSearchParams<{ callId: string }>();
  const [call, setCall] = useState<Call | null>(null);
  const client = useStreamVideoClient();

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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Joining call...</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <StreamCall call={call}>
        <View style={styles.callContainer}>
          <View style={styles.topControls}>
            <Pressable 
              style={styles.backButton} 
              onPress={handleEndCall}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>
          </View>
          <CallContent
            onHangupCallHandler={handleEndCall}
          />
        </View>
      </StreamCall>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  callContainer: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
