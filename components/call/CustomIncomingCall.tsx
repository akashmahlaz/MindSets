import { Button } from "@/components/ui/button";
import { useCall, useCallStateHooks } from "@stream-io/video-react-native-sdk";
import { router } from "expo-router";
import React from "react";
import { Alert, Image, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const CustomIncomingCall = () => {
  const call = useCall();
  const { useCallMembers } = useCallStateHooks();
  const members = useCallMembers();

  // Find the caller (not the current user)
  const caller = members.find(
    (member) => member.user.id !== call?.currentUserId,
  );
  const callerName = caller?.user.name || caller?.user.id || "Unknown";
  const callerImage = caller?.user.image;

  const handleAccept = async () => {
    if (!call) return;

    try {
      console.log("Accepting incoming call:", call.cid);
      await call.join();

      // Navigate to call screen after joining
      router.push({
        pathname: "/call/[callId]",
        params: {
          callId: call.id,
          callType: call.type,
          isVideo: "true", // You can determine this from call data
        },
      });
    } catch (error) {
      console.error("Error accepting call:", error);
      Alert.alert("Error", "Failed to join call");
    }
  };

  const handleDecline = async () => {
    if (!call) return;

    try {
      console.log("Declining incoming call:", call.cid);
      await call.leave({ reject: true, reason: "decline" });
    } catch (error) {
      console.error("Error declining call:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View className="flex-1 justify-center items-center px-8">
        {/* Caller info */}
        <View className="items-center mb-16">
          <View className="w-40 h-40 rounded-full bg-gray-600 mb-6 overflow-hidden">
            {callerImage ? (
              <Image
                source={{ uri: callerImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-gray-600 justify-center items-center">
                <Text className="text-white text-5xl font-bold">
                  {callerName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text className="text-white text-4xl font-bold mb-3">
            {callerName}
          </Text>
          <Text className="text-white/70 text-xl">Incoming video call</Text>
        </View>

        {/* Call action buttons - positioned to avoid system UI */}
        <View className="flex-row justify-center space-x-20 mb-8">
          {/* Decline button */}
          <Button
            onPress={handleDecline}
            className="w-20 h-20 rounded-full bg-red-500 justify-center items-center shadow-lg"
          >
            <Text className="text-white text-3xl">✕</Text>
          </Button>

          {/* Accept button */}
          <Button
            onPress={handleAccept}
            className="w-20 h-20 rounded-full bg-green-500 justify-center items-center shadow-lg"
          >
            <Text className="text-white text-3xl">✓</Text>
          </Button>
        </View>

        {/* Status text */}
        <Text className="text-white/50 text-center text-lg">
          Tap to answer or decline
        </Text>
      </View>
    </SafeAreaView>
  );
};
