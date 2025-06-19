import {
    CallContent,
    CallingState,
    StreamCall,
    useCall,
    useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

interface CallScreenProps {
  call: any;
  onEndCall?: () => void;
}

const CallScreenContent: React.FC = () => {
  const call = useCall();
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();

  useEffect(() => {
    // Handle call state changes
    if (callingState === CallingState.LEFT) {
      // Call was ended or left
      router.back();
    }
  }, [callingState]);

  const handleHangup = async () => {
    try {
      if (call) {
        await call.leave();
        router.back();
      }
    } catch (error) {
      console.error('Error hanging up call:', error);
      Alert.alert('Error', 'Failed to end call');
    }
  };

  // Show loading state while connecting
  if (callingState === CallingState.JOINING || callingState === CallingState.UNKNOWN) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.loadingText}>Connecting...</ThemedText>
      </ThemedView>
    );
  }

  // Show reconnecting state
  if (callingState === CallingState.RECONNECTING) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.loadingText}>Reconnecting...</ThemedText>
      </ThemedView>
    );
  }

  // Show main call interface
  return (
    <View style={styles.container}>
      <CallContent
        onHangupCallHandler={handleHangup}
        landscape={false}
        supportedReactions={[
          { type: 'like', icon: '👍', name: 'like' },
          { type: 'love', icon: '❤️', name: 'love' },
          { type: 'haha', icon: '😂', name: 'haha' },
          { type: 'wow', icon: '😮', name: 'wow' },
          { type: 'sad', icon: '😢', name: 'sad' },
          { type: 'angry', icon: '😠', name: 'angry' },
        ]}
      />
    </View>
  );
};

export const CallScreen: React.FC<CallScreenProps> = ({ call, onEndCall }) => {
  if (!call) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>No call available</ThemedText>
      </ThemedView>
    );
  }

  return (
    <StreamCall call={call}>
      <CallScreenContent />
    </StreamCall>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
