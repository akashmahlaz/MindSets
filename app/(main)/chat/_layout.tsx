import "@/app/global.css";
import { useChat } from "@/context/ChatContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "react-native";
import { Chat, OverlayProvider } from "stream-chat-expo";

export default function ChatLayout() {
  const { chatClient, isChatConnected } = useChat();
  const { isDarkColorScheme } = useColorScheme();

  if (!chatClient || !isChatConnected) {
    return null;
  }

  return (
    <OverlayProvider>
      <Chat client={chatClient}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          translucent={false}
        />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="[channelId]" />
        </Stack>
      </Chat>
    </OverlayProvider>
  );
}
