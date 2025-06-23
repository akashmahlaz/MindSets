import { CustomCallControls } from "@/components/call/CustomCallControls";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Call,
  CallContent,
  CallingState,
  RingingCallContent,
  StreamCall,
  useCallStateHooks,
  useStreamVideoClient,
} from "@stream-io/video-react-native-sdk";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CallScreen() {
  const {
    callId,
    callType = "default",
    isVideo = "true",
  } = useLocalSearchParams<{
    callId: string;
    callType?: string;
    isVideo?: string;
  }>();

  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const client = useStreamVideoClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!client || !callId || !user) {
      setError("Missing client, call ID, or user");
      setIsLoading(false);
      return;
    }

    const setupCall = async () => {
      try {
        console.log("Setting up call:", callId, callType);
        setIsLoading(true);
        setError(null);

        const callToSetup = client.call(callType, callId);

        try {
          // Get the call to check if it exists and get its current state
          await callToSetup.get();
          console.log("Found existing call:", callToSetup.cid);
          setCall(callToSetup);
        } catch (getError) {
          console.log("Call not found:", getError);
          setError("Call not found or has expired");
          return;
        }
      } catch (error) {
        console.error("Error setting up call:", error);
        setError(
          error instanceof Error ? error.message : "Failed to setup call",
        );
      } finally {
        setIsLoading(false);
      }
    };

    setupCall();

    // Cleanup on unmount
    return () => {
      if (call) {
        call.leave().catch(console.error);
      }
    };
  }, [client, callId, callType, user?.uid]); // Handle call events and state changes
  useEffect(() => {
    if (!call) return;

    const handleCallEnded = () => {
      console.log("Call ended by someone, navigating back");
      Alert.alert("Call Ended", "The call has been ended.");
      router.back();
    };

    const handleCallSessionEnded = () => {
      console.log("Call session ended, navigating back");
      Alert.alert("Call Ended", "The call session has ended.");
      router.back();
    };

    const handleCallRejected = () => {
      console.log("Call was rejected");
      Alert.alert("Call Declined", "The call was declined by the other user.");
      router.back();
    };

    const handleCallMissed = () => {
      console.log("Call was missed");
      Alert.alert("Call Missed", "The call was not answered.");
      router.back();
    };

    const handleParticipantLeft = () => {
      console.log("Participant left the call");
      // Check if there are still participants in the call
      const participants = call.state.participants;
      if (participants.length <= 1) {
        console.log("All participants left, ending call");
        Alert.alert("Call Ended", "The other participant has left the call.");
        router.back();
      }
    };

    const handleCallUpdated = () => {
      console.log("Call updated, checking state");
      // Check if call was ended by another participant
      const callState = call.state;
      if (callState.endedAt) {
        console.log("Call was ended by another participant");
        Alert.alert("Call Ended", "The call has been ended.");
        router.back();
      }
    };

    // Subscribe to all relevant call lifecycle events
    const unsubscribeEnded = call.on("call.ended", handleCallEnded);
    const unsubscribeSessionEnded = call.on(
      "call.session_ended",
      handleCallSessionEnded,
    );
    const unsubscribeRejected = call.on("call.rejected", handleCallRejected);
    const unsubscribeMissed = call.on("call.missed", handleCallMissed);
    const unsubscribeParticipantLeft = call.on(
      "call.session_participant_left",
      handleParticipantLeft,
    );
    const unsubscribeUpdated = call.on("call.updated", handleCallUpdated);

    return () => {
      unsubscribeEnded();
      unsubscribeSessionEnded();
      unsubscribeRejected();
      unsubscribeMissed();
      unsubscribeParticipantLeft();
      unsubscribeUpdated();
    };
  }, [call]);
  const handleEndCall = async () => {
    try {
      if (call) {
        console.log("Ending call for all participants");
        // According to Stream.io documentation:
        // call.endCall() terminates the call for ALL participants
        // This sends call.ended event to all call members
        await call.endCall();
        console.log("Call ended successfully for all participants");
      }
      router.back();
    } catch (error) {
      console.error("Error ending call:", error);
      // If endCall fails (permission issue), fall back to leave
      // But note: this only removes the current user, doesn't end for everyone
      try {
        if (call) {
          console.log("Fallback: Leaving call instead of ending");
          await call.leave();
        }
      } catch (leaveError) {
        console.error("Error leaving call:", leaveError);
      }
      router.back();
    }
  };

  // Show loading state
  if (isLoading || !call) {
    if (error) {
      return (
        <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-white text-xl text-center mb-4">
              Call Error
            </Text>
            <Text className="text-white/70 text-center mb-6">{error}</Text>
            <Button onPress={() => router.back()} className="bg-blue-600">
              <Text className="text-white">Go Back</Text>
            </Button>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-xl">Setting up call...</Text>
          <Text className="text-white/70 text-sm mt-2">Call ID: {callId}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <StreamCall call={call}>
        <CallUI isVideo={isVideo === "true"} onEndCall={handleEndCall} />
      </StreamCall>
    </SafeAreaView>
  );
}

// Component that renders the appropriate UI based on call state
function CallUI({
  isVideo,
  onEndCall,
}: {
  isVideo: boolean;
  onEndCall: () => void;
}) {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  console.log("Current calling state:", callingState);

  // Handle different call states using Stream.io's built-in components
  switch (callingState) {
    case CallingState.RINGING:
      // Use Stream.io's built-in RingingCallContent for both incoming and outgoing calls
      // This component automatically detects if it's incoming or outgoing and shows appropriate UI
      return <RingingCallContent />;
    case CallingState.JOINED: // Use Stream.io's built-in CallContent with custom CallControls for proper safe area handling
      return (
        <CallContent
          onHangupCallHandler={onEndCall}
          CallControls={CustomCallControls}
          supportedReactions={[
            { type: "like", icon: "👍" },
            { type: "love", icon: "❤️" },
            { type: "haha", icon: "😂" },
            { type: "wow", icon: "😮" },
          ]}
        />
      );

    case CallingState.RECONNECTING:
      return (
        <View className="flex-1 justify-center items-center bg-black">
          <Text className="text-white text-lg">Reconnecting...</Text>
          <Text className="text-white/70 text-sm mt-2">
            Please wait while we restore your connection
          </Text>
        </View>
      );

    case CallingState.OFFLINE:
      return (
        <View className="flex-1 justify-center items-center bg-black">
          <Text className="text-white text-lg">Connection lost</Text>
          <Text className="text-white/70 text-sm mt-2 mb-4">
            Unable to connect to the call
          </Text>
          <Button onPress={onEndCall} className="mt-4 bg-red-600">
            <Text className="text-white">End Call</Text>
          </Button>
        </View>
      );

    case CallingState.LEFT:
      // This state should trigger navigation back, handled by useEffect
      return (
        <View className="flex-1 justify-center items-center bg-black">
          <Text className="text-white text-lg">Call ended</Text>
          <Text className="text-white/70 text-sm mt-2">
            You have left the call
          </Text>
        </View>
      );

    default:
      // For any other states (IDLE, JOINING, etc.)
      return (
        <View className="flex-1 justify-center items-center bg-black">
          <Text className="text-white text-lg">
            {isVideo ? "Setting up video call..." : "Setting up voice call..."}
          </Text>
          <Text className="text-white/70 text-sm mt-2">Please wait...</Text>
        </View>
      );
  }
}
