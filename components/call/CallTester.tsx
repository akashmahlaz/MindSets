import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useVideo } from "@/context/VideoContext";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";

export const CallTester = () => {
  const { user } = useAuth();
  const { createCall, isCreatingCall, videoClient } = useVideo();
  const [testUserId] = useState("test-user-123"); // Replace with actual test user ID

  const generateCallId = (user1: string, user2: string) => {
    return [user1, user2].sort().join("-");
  };

  const testVoiceCall = async () => {
    if (!user?.uid) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      const callId = generateCallId(user.uid, testUserId);
      console.log("Testing voice call creation...");

      const call = await createCall(callId, [testUserId], false);
      if (!call) {
        throw new Error("Failed to create call");
      }

      console.log("Voice call created successfully:", call.id);

      // Navigate to call screen
      router.push({
        pathname: "/call/[callId]",
        params: {
          callId: call.id,
          callType: call.type,
          isVideo: "false",
        },
      });
    } catch (error) {
      console.error("Voice call test failed:", error);
      Alert.alert("Test Failed", "Voice call creation failed");
    }
  };

  const testVideoCall = async () => {
    if (!user?.uid) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      const callId = generateCallId(user.uid, testUserId);
      console.log("Testing video call creation...");

      const call = await createCall(callId, [testUserId], true);
      if (!call) {
        throw new Error("Failed to create call");
      }

      console.log("Video call created successfully:", call.id);

      // Navigate to call screen
      router.push({
        pathname: "/call/[callId]",
        params: {
          callId: call.id,
          callType: call.type,
          isVideo: "true",
        },
      });
    } catch (error) {
      console.error("Video call test failed:", error);
      Alert.alert("Test Failed", "Video call creation failed");
    }
  };

  if (!videoClient) {
    return (
      <View className="p-4 bg-yellow-100 rounded-lg">
        <Text className="text-yellow-800">Video client not initialized</Text>
      </View>
    );
  }

  return (
    <View className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <Text className="text-lg font-semibold mb-4">Call System Test</Text>
      <Text className="text-sm text-gray-600 mb-4">
        Current User: {user?.uid}
      </Text>
      <Text className="text-sm text-gray-600 mb-4">
        Test Target: {testUserId}
      </Text>

      <View className="space-y-3">
        <Button
          onPress={testVoiceCall}
          disabled={isCreatingCall}
          className="bg-blue-600"
        >
          <Text className="text-white">
            {isCreatingCall ? "Creating..." : "Test Voice Call"}
          </Text>
        </Button>

        <Button
          onPress={testVideoCall}
          disabled={isCreatingCall}
          className="bg-green-600"
        >
          <Text className="text-white">
            {isCreatingCall ? "Creating..." : "Test Video Call"}
          </Text>
        </Button>
      </View>

      <Text className="text-xs text-gray-500 mt-4">
        Note: Replace testUserId with a real user ID for actual testing
      </Text>
    </View>
  );
};
