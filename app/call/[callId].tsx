import { CustomCallControls } from "@/components/call/CustomCallControls";
import { CustomIncomingCall } from "@/components/call/CustomIncomingCall";
import { CustomOutgoingCall } from "@/components/call/CustomOutgoingCall";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Call,
  CallContent,
  CallingState,
  StreamCall,
  useCall,
  useCallStateHooks,
  useStreamVideoClient,
} from "@stream-io/video-react-native-sdk";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const parseIsVideoParam = (value?: string | boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return true;
};

export default function CallScreen() {
  const params = useLocalSearchParams();
  const callId = params.callId as string;
  const callType = (params.callType as string) || "default";
  const rawIsVideo = params.isVideo;
  const isVideo = parseIsVideoParam(rawIsVideo as string | boolean | undefined);

  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isEndingCall = useRef(false); // Track if we're ending the call ourselves
  const client = useStreamVideoClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!client || !callId || !user) {
      // Don't set error immediately - client might still be loading
      console.log("Waiting for client/callId/user:", { client: !!client, callId, user: !!user });
      return;
    }

    let isMounted = true;

    const setupCall = async () => {
      try {
        console.log("Setting up call:", callId, callType);
        setIsLoading(true);
        setError(null);

        const callToSetup = client.call(callType, callId);

        try {
          // Get the call info - the call should already exist and we should already be joined
          // (VideoContext.createCall already joined the call for outgoing calls)
          await callToSetup.get();
          console.log("Found existing call:", callToSetup.cid);
          console.log("Call state:", {
            callingState: callToSetup.state.callingState,
            isCreatedByMe: callToSetup.isCreatedByMe,
            ringing: callToSetup.ringing,
          });
          
          if (isMounted) {
            setCall(callToSetup);
          }
        } catch (getError) {
          console.error("Failed to get call:", getError);
          if (isMounted) {
            setError("Call not found or has expired");
          }
        }
      } catch (error) {
        console.error("Error setting up call:", error);
        if (isMounted) {
          setError(
            error instanceof Error ? error.message : "Failed to setup call",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    setupCall();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (call && !isEndingCall.current) {
        call.leave().catch(console.error);
      }
    };
  }, [client, callId, callType, user?.uid]);
  useEffect(() => {
    if (!call) return;

    const handleCallEnded = () => {
      console.log("Call ended event received");
      // Navigate back without showing alerts
      setTimeout(() => {
        router.back();
      }, 300);
    };

    const handleCallSessionEnded = () => {
      console.log("Call session ended");
      setTimeout(() => {
        router.back();
      }, 300);
    };

    const handleCallRejected = (event: any) => {
      console.log("Call was rejected");
      
      if (isEndingCall.current) {
        router.back();
        return;
      }
      
      const reason = event?.reason;
      
      // Only show declined alert for explicit rejection
      if (reason === 'decline' || reason === 'busy') {
        Alert.alert("Call Declined", "The other person declined the call.", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        router.back();
      }
    };

    const handleCallMissed = () => {
      console.log("Call was missed");
      if (!isEndingCall.current) {
        Alert.alert("No Answer", "The call was not answered.", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        router.back();
      }
    };

    const handleParticipantLeft = () => {
      console.log("Participant left the call");
      // Small delay to allow state to settle
      setTimeout(() => {
        const participants = call.state.participants;
        if (participants.length <= 1 && !isEndingCall.current) {
          console.log("Last participant left");
          router.back();
        }
      }, 500);
    };

    // Subscribe to call lifecycle events
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

    return () => {
      unsubscribeEnded();
      unsubscribeSessionEnded();
      unsubscribeRejected();
      unsubscribeMissed();
      unsubscribeParticipantLeft();
    };
  }, [call, user?.uid]);
  const handleEndCall = async () => {
    if (isEndingCall.current) return; // Prevent double calls
    
    isEndingCall.current = true;
    
    try {
      if (call) {
        console.log("Ending call");
        
        // Try to end the call for all participants
        try {
          await call.endCall();
          console.log("Call ended successfully");
        } catch (endError) {
          console.log("Failed to end call, leaving instead:", endError);
          // Fallback to leaving if we can't end it
          await call.leave();
        }
      }
    } catch (error) {
      console.error("Error in handleEndCall:", error);
    } finally {
      // Always navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 200);
    }
  };

  // Show loading state
  if (isLoading || !call) {
    if (error) {
      return (
        <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
          <StatusBar barStyle="light-content" backgroundColor="#141820" />
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
        <CallUI isVideo={isVideo} onEndCall={handleEndCall} />
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
  const call = useCall();
  const { useCallCallingState, useCameraState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const { camera } = useCameraState();
  const hasEnabledCamera = React.useRef(false);
  const hasNavigatedBack = React.useRef(false);

  console.log("Current calling state:", callingState, "isVideo:", isVideo);

  // Auto-navigate back when call is LEFT
  React.useEffect(() => {
    if (hasNavigatedBack.current) return;
    
    if (callingState === CallingState.LEFT) {
      // Delay to ensure cleanup
      const timer = setTimeout(() => {
        if (!hasNavigatedBack.current) {
          hasNavigatedBack.current = true;
          console.log("Call LEFT state - navigating back");
          router.back();
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [callingState]);

  // Enable/disable camera based on isVideo when call is joined
  React.useEffect(() => {
    if (callingState === CallingState.JOINED && call && !hasEnabledCamera.current) {
      hasEnabledCamera.current = true;
      
      // Small delay to ensure call is fully established
      const timer = setTimeout(() => {
        if (isVideo) {
          console.log("Enabling camera for video call");
          camera.enable().catch((err: any) => {
            console.warn("Failed to enable camera:", err);
          });
        } else {
          console.log("Disabling camera for voice call");
          camera.disable().catch((err: any) => console.warn("Failed to disable camera:", err));
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [callingState, call, isVideo, camera]);

  // Handle different call states using custom professional components
  switch (callingState) {
    case CallingState.RINGING:
      // Use our custom professional ringing UI
      // Check if this is an incoming or outgoing call
      if (call?.isCreatedByMe) {
        // Outgoing call - we initiated it
        return <CustomOutgoingCall />;
      } else {
        // Incoming call - someone is calling us
        return <CustomIncomingCall />;
      }
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
