import "@/app/global.css";
import { useChat } from "@/context/ChatContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, StatusBar, Text, View } from "react-native";
import { Chat, DeepPartial, OverlayProvider, Theme } from "stream-chat-expo";

// This ensures that when navigating to a chat (e.g., from profile), 
// the back button will go to the chat list (index) first
export const unstable_settings = {
  initialRouteName: "index",
};

export default function ChatLayout() {
  const { chatClient, isChatConnected } = useChat();
  const { isDarkColorScheme } = useColorScheme();

  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1A1F2E" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#334155" : "#F1F5F9",
    primary: "#6366F1",
    primaryLight: "#818CF8",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
  };

  // Stream Chat theme that matches our app's design - minimal overrides
  const chatTheme: DeepPartial<Theme> = {
    colors: {
      accent_blue: colors.primary,
      accent_green: "#10B981",
      accent_red: "#EF4444",
      bg_gradient_end: colors.background,
      bg_gradient_start: colors.background,
      black: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
      blue_alice: colors.surface,
      border: colors.border,
      grey: colors.textSecondary,
      grey_gainsboro: colors.surfaceVariant,
      grey_whisper: colors.surface,
      icon_background: colors.surfaceVariant,
      modal_shadow: "#00000040",
      overlay: colors.background + "E6",
      shadow_icon: colors.textSecondary,
      targetedMessageBackground: colors.surfaceVariant,
      transparent: "transparent",
      white: colors.surface,
      white_smoke: colors.surfaceVariant,
      white_snow: colors.background,
    },
    messageSimple: {
      content: {
        containerInner: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 16,
        },
        markdown: {
          text: {
            color: colors.text,
          },
        },
      },
    },
    messageInput: {
      container: {
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      },
      inputBox: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 20,
        color: colors.text,
      },
      inputBoxContainer: {
        backgroundColor: "transparent",
        borderWidth: 0,
      },
    },
    channelListMessenger: {
      flatListContent: {
        backgroundColor: colors.background,
      },
    },
    channelPreview: {
      container: {
        backgroundColor: colors.background,
        borderBottomWidth: 0,
      },
      title: {
        color: colors.text,
        fontWeight: "600",
      },
      message: {
        color: colors.textSecondary,
      },
    },
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
    <OverlayProvider value={{ style: chatTheme }}>
      <Chat client={chatClient} style={chatTheme}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          translucent={false}
        />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="[channelId]" />
        </Stack>
      </Chat>
    </OverlayProvider>
  );
}
