import { Tabs } from "expo-router";
import React from "react";
import { Platform, StatusBar } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/HapticTab";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  
  // Premium Material Design 3 color scheme
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
    surfaceContainer: isDarkColorScheme ? "#1A1F2E" : "#FFFFFF",
    primary: "#6366F1",
    onSurfaceVariant: isDarkColorScheme ? "#CBD5E1" : "#64748B",
    outline: isDarkColorScheme ? "#374151" : "#E5E7EB",
  };

  // Calculate tab bar height with safe area
  const tabBarHeight = Platform.OS === "ios" ? 88 : 64 + insets.bottom;

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
        translucent={false}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.onSurfaceVariant,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 2,
            marginBottom: Platform.OS === "ios" ? 0 : Math.max(insets.bottom, 8),
            letterSpacing: 0.3,
          },
          tabBarIconStyle: {
            marginTop: Platform.OS === "ios" ? 6 : 8,
          },
          tabBarStyle: {
            backgroundColor: colors.surfaceContainer,
            borderTopWidth: 1,
            borderTopColor: colors.outline,
            height: tabBarHeight,
            paddingTop: 8,
            paddingBottom: Platform.OS === "android" ? insets.bottom : 0,
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: isDarkColorScheme ? 0.3 : 0.06,
                shadowRadius: 12,
              },
              android: {
                elevation: 12,
              },
            }),
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                size={24} 
                name={focused ? "home" : "home-outline"} 
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
    </SafeAreaProvider>
  );
}
