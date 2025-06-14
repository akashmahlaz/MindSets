import { Call, CallContent, StreamCall, useStreamVideoClient } from '@stream-io/video-react-native-sdk'; // Import StreamCall
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
export default function CallScreen() {
  const { callId: rawCallId } = useLocalSearchParams();
  const callId = Array.isArray(rawCallId) ? rawCallId[0] : rawCallId;
  const videoClient = useStreamVideoClient();
  const [call, setCall] = useState<Call | null | undefined>(null); // Explicitly type the state

  useEffect(() => {
    const joinCall = async () => {
      if (!videoClient || !callId) {
        setCall(undefined); // Or null
        return;
      }
      const newCallInstance = videoClient.call('default', callId as string);
      try {
        await newCallInstance.join();
        setCall(newCallInstance);
      } catch (error) {
        console.error("Failed to join call:", error);
        setCall(undefined); // Or null
        // Optionally, navigate away or show an error message
        // router.back(); 
      }
    };
    joinCall();
  }, [callId, videoClient]); // Add videoClient to dependencies

  return (
    <View style={{ flex: 1 }}>
      {call && (
        <StreamCall call={call}> {/* Use StreamCall as the provider */}
          <CallContent
            onHangupCallHandler={() => router.back()}
          />
        </StreamCall>
      )}
    </View>
  );
}
