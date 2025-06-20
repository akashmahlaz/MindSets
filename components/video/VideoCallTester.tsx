import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useVideo } from "@/context/VideoContext";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, View } from "react-native";

export const VideoCallTester = () => {
  const { createCall, isVideoConnected, videoClient } = useVideo();
  const { user } = useAuth();
  const [isCreatingCall, setIsCreatingCall] = useState(false);

  const testVideoCall = async () => {
    if (!isVideoConnected || !user) {
      Alert.alert(
        "Error",
        "Video service not connected or user not authenticated",
      );
      return;
    }

    setIsCreatingCall(true);
    try {
      // Create a test call with current user only
      const callId = `test-${Date.now()}`;
      const call = await createCall(callId, [], true);

      if (call) {
        Alert.alert(
          "Success",
          "Test call created! Navigating to call screen...",
        );
        router.push({
          pathname: "/call/[callId]",
          params: {
            callId: call.id,
            callType: call.type,
            isVideo: "true",
          },
        });
      } else {
        Alert.alert("Error", "Failed to create test call");
      }
    } catch (error) {
      console.error("Test call error:", error);
      Alert.alert("Error", `Failed to create test call: ${error}`);
    } finally {
      setIsCreatingCall(false);
    }
  };

  const testAudioCall = async () => {
    if (!isVideoConnected || !user) {
      Alert.alert(
        "Error",
        "Video service not connected or user not authenticated",
      );
      return;
    }

    setIsCreatingCall(true);
    try {
      // Create a test audio call with current user only
      const callId = `test-audio-${Date.now()}`;
      const call = await createCall(callId, [], false);

      if (call) {
        Alert.alert(
          "Success",
          "Test audio call created! Navigating to call screen...",
        );
        router.push({
          pathname: "/call/[callId]",
          params: {
            callId: call.id,
            callType: call.type,
            isVideo: "false",
          },
        });
      } else {
        Alert.alert("Error", "Failed to create test audio call");
      }
    } catch (error) {
      console.error("Test audio call error:", error);
      Alert.alert("Error", `Failed to create test audio call: ${error}`);
    } finally {
      setIsCreatingCall(false);
    }
  };

  return (
    <View className="p-4 bg-card rounded-lg m-4">
      <ThemedText className="text-lg font-semibold mb-2">
        Video Call Testing
      </ThemedText>
      <ThemedText className="text-sm text-muted-foreground mb-4">
        Status: {isVideoConnected ? "✅ Connected" : "❌ Disconnected"}
      </ThemedText>

      <View className="flex-row space-x-2">
        <Button
          onPress={testVideoCall}
          disabled={!isVideoConnected || isCreatingCall}
          className="flex-1"
        >
          <ThemedText>
            {isCreatingCall ? "Creating..." : "Test Video Call"}
          </ThemedText>
        </Button>

        <Button
          onPress={testAudioCall}
          disabled={!isVideoConnected || isCreatingCall}
          variant="outline"
          className="flex-1"
        >
          <ThemedText>
            {isCreatingCall ? "Creating..." : "Test Audio Call"}
          </ThemedText>
        </Button>
      </View>
      {videoClient && (
        <ThemedText className="text-xs text-muted-foreground mt-2">
          Video Client: Connected
        </ThemedText>
      )}
    </View>
  );
};
