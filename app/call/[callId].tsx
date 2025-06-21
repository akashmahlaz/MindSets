import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import {
  Call,
  CallContent,
  CallingState,
  StreamCall,
  useCallStateHooks,
  useStreamVideoClient,
} from "@stream-io/video-react-native-sdk";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CallRole = "creator" | "recipient" | "unknown";
type CallScreenState =
  | "loading"
  | "ringing"
  | "connecting"
  | "connected"
  | "ended"
  | "error";

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
  const [callRole, setCallRole] = useState<CallRole>("unknown");
  const [screenState, setScreenState] = useState<CallScreenState>("loading");
  const client = useStreamVideoClient();
  const { user } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
  useEffect(() => {
    if (!client || !callId || !user) {
      setError("Missing client, call ID, or user");
      setScreenState("error");
      return;
    }

    const setupCall = async () => {
      try {
        console.log("Setting up call:", callId, callType);
        setScreenState("loading");

        const callToSetup = client.call(callType, callId);

        try {
          await callToSetup.get();
          console.log("Found existing call:", callToSetup.cid);

          // Determine user role
          const createdBy = callToSetup.state.custom?.createdBy;
          const role: CallRole =
            createdBy === user.uid ? "creator" : "recipient";
          setCallRole(role);

          console.log(
            `User role: ${role}, Created by: ${createdBy}, Current user: ${user.uid}`,
          );

          setCall(callToSetup);

          if (role === "creator") {
            // Creator waits for recipient to accept
            setScreenState("ringing");
          } else {
            // Recipient sees incoming call
            setScreenState("ringing");
          }
        } catch (getError) {
          console.log("Call not found:", getError);
          setError("Call not found or expired");
          setScreenState("error");
          return;
        }
      } catch (error) {
        console.error("Error setting up call:", error);
        setError(
          error instanceof Error ? error.message : "Failed to setup call",
        );
        setScreenState("error");
      }
    };

    setupCall();

    return () => {
      if (call) {
        call.leave().catch(console.error);
      }
    };
  }, [client, callId, callType, user?.uid]);

  // Listen for call acceptance to auto-join creator
  useEffect(() => {
    if (!call || callRole !== "creator") return;

    const handleCallAccepted = async () => {
      console.log("Call accepted, creator joining...");
      setScreenState("connecting");
      try {
        await call.join();
        setScreenState("connected");
      } catch (error) {
        console.error("Error joining call:", error);
        setScreenState("error");
      }
    };

    const unsubscribe = call.on("call.session_started", handleCallAccepted);
    return () => unsubscribe();
  }, [call, callRole]);
  const handleEndCall = async () => {
    try {
      if (call) {
        await call.leave();
      }
      setScreenState("ended");
      router.back();
    } catch (error) {
      console.error("Error ending call:", error);
      router.back();
    }
  };

  const handleAcceptCall = async () => {
    if (!call || callRole !== "recipient") return;

    try {
      console.log("Accepting call:", call.cid);
      setScreenState("connecting");
      await call.join();
      setScreenState("connected");
    } catch (error) {
      console.error("Error accepting call:", error);
      Alert.alert("Error", "Failed to join call");
      setScreenState("error");
    }
  };

  const handleDeclineCall = async () => {
    if (!call) return;

    try {
      console.log("Declining call:", call.cid);
      await call.leave({ reject: true });
      setScreenState("ended");
      router.back();
    } catch (error) {
      console.error("Error declining call:", error);
      router.back();
    }
  };
  // Render different UI based on screen state
  const renderCallUI = () => {
    switch (screenState) {
      case "ringing":
        if (callRole === "creator") {
          return (
            <View className="flex-1 justify-center items-center bg-black p-6">
              <Text className="text-white text-3xl font-bold mb-4">
                Calling...
              </Text>
              <Text className="text-white/70 text-center mb-8 text-lg">
                Waiting for answer
              </Text>
              <Button
                onPress={handleEndCall}
                className="w-16 h-16 rounded-full bg-red-500 justify-center items-center"
              >
                <Text className="text-white text-2xl">✕</Text>
              </Button>
            </View>
          );
        } else {
          return (
            <View className="flex-1 justify-center items-center bg-black p-6">
              <Text className="text-white text-3xl font-bold mb-4">
                Incoming Call
              </Text>
              <Text className="text-white/70 text-center mb-8 text-lg">
                {isVideo === "true" ? "Video" : "Voice"} call
              </Text>
              <View className="flex-row space-x-8">
                <Button
                  onPress={handleDeclineCall}
                  className="w-16 h-16 rounded-full bg-red-500 justify-center items-center"
                >
                  <Text className="text-white text-2xl">✕</Text>
                </Button>
                <Button
                  onPress={handleAcceptCall}
                  className="w-16 h-16 rounded-full bg-green-500 justify-center items-center"
                >
                  <Text className="text-white text-2xl">✓</Text>
                </Button>
              </View>
            </View>
          );
        }

      case "connecting":
        return (
          <View className="flex-1 justify-center items-center bg-black">
            <Text className="text-white text-xl">Connecting...</Text>
          </View>
        );

      case "connected":
        return <CallStateHandler />;

      default:
        return null;
    }
  };

  // Component to handle connected call state
  const CallStateHandler = () => {
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();

    useEffect(() => {
      if (callingState === CallingState.LEFT) {
        console.log("Call ended, navigating back");
        setScreenState("ended");
        router.back();
      }
    }, [callingState]);

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
            { type: "like", icon: "👍" },
            { type: "love", icon: "❤️" },
            { type: "haha", icon: "😂" },
            { type: "wow", icon: "😮" },
          ]}
        />
      </View>
    );
  };

  if (!call) {
    if (screenState === "error") {
      return (
        <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-white text-xl text-center mb-4">
              Call Error
            </Text>
            <Text className="text-white/70 text-center mb-6">
              {error || "Something went wrong"}
            </Text>
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
          <Text className="text-white/70 text-sm mt-2">
            Call ID: {callId}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <StreamCall call={call}>{renderCallUI()}</StreamCall>
    </SafeAreaView>
  );
}
