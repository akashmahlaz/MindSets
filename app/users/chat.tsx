import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useVideo } from "@/context/VideoContext";
import { createOrGetDirectChannel } from "@/services/chatHelpers";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

export const useStartChat = () => {
  const { user } = useAuth();
  const { chatClient, isChatConnected } = useChat();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const startChat = async (targetUserId: string) => {
    if (isStartingChat) return;

    setIsStartingChat(true);
    console.log("startChat called");

    try {
      if (!user) {
        console.error("Cannot start chat: User not authenticated");
        Alert.alert("Error", "You must be logged in to start a chat");
        return;
      }

      console.log("user available:", !!user);
      console.log("userId available:", !!targetUserId);
      console.log("chatClient available:", !!chatClient);
      console.log("isChatConnected:", isChatConnected);

      if (!chatClient || !isChatConnected) {
        throw new Error("Chat not connected");
      }

      console.log("Assuming target user exists in Stream Chat:", targetUserId);

      // Create or get a direct message channel
      const channel = await createOrGetDirectChannel(user, targetUserId);

      // Navigate to the chat screen
      router.push(`/chat/${channel.id}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      Alert.alert("Error", "Failed to start chat. Please try again.");
    } finally {
      setIsStartingChat(false);
    }
  };
  return {
    startChat,
    isStartingChat,
  };
};

export const useStartCall = () => {
  const { user } = useAuth();
  const { createCall, isVideoConnected } = useVideo();
  const [isStartingCall, setIsStartingCall] = useState(false);

  const startCall = async (targetUserId: string, isVideo: boolean = true) => {
    if (isStartingCall) return;

    setIsStartingCall(true);
    console.log(
      "startCall called for user:",
      targetUserId,
      "isVideo:",
      isVideo,
    );

    try {
      if (!user) {
        console.error("Cannot start call: User not authenticated");
        Alert.alert("Error", "You must be logged in to start a call");
        return;
      }

      if (!isVideoConnected) {
        throw new Error("Video service not connected");
      } // Generate unique call ID that's under 64 characters
      const generateCallId = (userId1: string, userId2: string) => {
        const user1Short = userId1.substring(0, 8);
        const user2Short = userId2.substring(0, 8);
        const timestamp = Date.now().toString(36);
        return `${user1Short}-${user2Short}-${timestamp}`;
      };

      const callId = generateCallId(user.uid, targetUserId);
      console.log("Creating call with ID:", callId, "Length:", callId.length);

      // Create the call
      const call = await createCall(callId, [targetUserId], isVideo);

      if (call) {
        console.log("Call created successfully:", call.cid);

        // Navigate to call screen
        router.push({
          pathname: "/call/[callId]",
          params: {
            callId: call.id,
            callType: call.type,
            isVideo: isVideo.toString(),
          },
        });
      } else {
        throw new Error("Failed to create call");
      }
    } catch (error) {
      console.error("Error starting call:", error);
      Alert.alert("Error", "Failed to start call. Please try again.");
    } finally {
      setIsStartingCall(false);
    }
  };

  return {
    startCall,
    isStartingCall,
  };
};

// Default export component required for Expo Router
export default function UsersChat() {
  return (
    <View className="flex-1 justify-center items-center">
      <Text>Users Chat Utility</Text>
    </View>
  );
}
