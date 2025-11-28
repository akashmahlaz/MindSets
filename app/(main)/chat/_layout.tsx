import "@/app/global.css";
import { useChat } from "@/context/ChatContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, StatusBar, Text, View } from "react-native";
import { Chat, OverlayProvider } from "stream-chat-expo";

export default function ChatLayout() {
  const { chatClient, isChatConnected } = useChat();
  const { isDarkColorScheme } = useColorScheme();

  const colors = {
    background: isDarkColorScheme ? "#0F172A" : "#FAFBFC",
    surfaceVariant: isDarkColorScheme ? "#334155" : "#F1F5F9",
    primary: "#6366F1",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
  };

  // Show loading state instead of null to prevent navigation issues
  if (!chatClient || !isChatConnected) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        <View style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: colors.surfaceVariant,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '500' }}>
          Connecting to chat...
        </Text>
      </View>
    );
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
