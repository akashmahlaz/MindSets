import { Tabs, useRouter, useSegments } from "expo-router";
import React from "react";
import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/HapticTab";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  
  // Premium Material Design 3 color scheme - matching system navigation bar
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
    surfaceContainer: isDarkColorScheme ? "#0C0F14" : "#FAFBFC", // Match background for seamless look
    primary: "#2AA79D",
    onSurfaceVariant: isDarkColorScheme ? "#94A3B8" : "#64748B",
    outline: isDarkColorScheme ? "#1A1F2E" : "#E5E7EB",
  };

  // Calculate tab bar height - account for bottom safe area
  const baseTabHeight = Platform.OS === "ios" ? 52 : 58;
  const tabBarHeight = baseTabHeight + insets.bottom;

  return (
    <>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
        translucent={true}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.onSurfaceVariant,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
            marginTop: 0,
            marginBottom: 0,
            letterSpacing: 0.2,
          },
          tabBarIconStyle: {
            marginTop: 0,
          },
          tabBarStyle: {
            backgroundColor: colors.surfaceContainer,
            borderTopWidth: 0,
            height: Platform.OS === "ios" ? 52 + insets.bottom : 60 + insets.bottom,
            paddingTop: 4,
            paddingBottom: insets.bottom,
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
      >
        <Tabs.Screen
          name="chat"
          listeners={{
            tabPress: (e) => {
              // Prevent default and navigate to chat list
              e.preventDefault();
              router.push('/(main)/chat/');
            },
          }}
          options={{
            title: "Chat",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                size={24} 
                name={focused ? "chatbubbles" : "chatbubbles-outline"} 
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Counselors"
          options={{
            title: "Counselors",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                size={24} 
                name={focused ? "people" : "people-outline"} 
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: "Sessions",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                size={24} 
                name={focused ? "calendar" : "calendar-outline"} 
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                size={24} 
                name={focused ? "chatbubbles" : "chatbubbles-outline"} 
                color={color}
              />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              // If we're already in chat but on a nested screen (like a specific chat),
              // prevent default and navigate to chat list
              const isInChatNested = segments.length > 2 && segments[1] === "chat";
              if (isInChatNested) {
                e.preventDefault();
                router.replace("/(main)/chat");
              }
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                size={24} 
                name={focused ? "person" : "person-outline"} 
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
