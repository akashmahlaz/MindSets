import { Call, CallContent, StreamCall, useStreamVideoClient } from '@stream-io/video-react-native-sdk';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
export default function CallScreen() {
  const { callId: rawCallId } = useLocalSearchParams();
  const callId = Array.isArray(rawCallId) ? rawCallId[0] : rawCallId;
  const videoClient = useStreamVideoClient();
  const [call, setCall] = useState<Call | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const joinCall = async () => {
      if (!videoClient || !callId) {
        setCall(null);
        setIsLoading(false);
        setError('Video client or call ID not available');
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const newCallInstance = videoClient.call('default', callId as string);
        await newCallInstance.join();
        setCall(newCallInstance);
      } catch (error) {
        console.error("Failed to join call:", error);
        setCall(null);
        setError('Failed to join call');
        // Optionally navigate back after a delay
        setTimeout(() => router.back(), 3000);
      } finally {
        setIsLoading(false);
      }
    };
    
    joinCall();
  }, [callId, videoClient]);
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {isLoading && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 10 }}>Joining call...</Text>
        </View>
      )}
      
      {error && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', textAlign: 'center', margin: 20 }}>
            {error}
          </Text>
          <Text style={{ color: '#fff', textAlign: 'center' }}>
            Returning to previous screen...
          </Text>
        </View>
      )}
      
      {call && !isLoading && (
        <StreamCall call={call}>
          <CallContent
            onHangupCallHandler={() => router.back()}
          />
        </StreamCall>
      )}
    </View>
  );
}
