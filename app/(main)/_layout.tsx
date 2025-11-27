import { Tabs } from "expo-router";
import React from "react";
import { Platform, StatusBar, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/HapticTab";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const { isDarkColorScheme } = useColorScheme();
  const { userProfile } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Google Material Design 3 color scheme
  const colors = {
    background: isDarkColorScheme ? "#0F172A" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    surfaceContainer: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    primary: "#6366F1", // Indigo - consistent brand color
    onSurface: isDarkColorScheme ? "#F1F5F9" : "#1E293B",
    onSurfaceVariant: isDarkColorScheme ? "#94A3B8" : "#64748B",
    outline: isDarkColorScheme ? "#334155" : "#E2E8F0",
    // Active state uses primary with pill indicator
    activeIndicator: isDarkColorScheme ? "rgba(99, 102, 241, 0.12)" : "rgba(99, 102, 241, 0.12)",
  };

  // Calculate tab bar height with safe area
  const tabBarHeight = Platform.OS === "ios" ? 88 : 60 + insets.bottom;

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
            fontSize: 12,
            fontWeight: "500",
            marginTop: 2,
            marginBottom: Platform.OS === "ios" ? 0 : Math.max(insets.bottom, 8),
            letterSpacing: 0.2,
          },
          tabBarIconStyle: {
            marginTop: Platform.OS === "ios" ? 4 : 8,
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
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: isDarkColorScheme ? 0.25 : 0.04,
                shadowRadius: 8,
              },
              android: {
                elevation: 8,
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
              <View 
                style={{ 
                  alignItems: "center", 
                  justifyContent: "center",
                  backgroundColor: focused ? colors.activeIndicator : "transparent",
                  paddingHorizontal: focused ? 20 : 0,
                  paddingVertical: focused ? 4 : 0,
                  borderRadius: 16,
                }}
              >
                <Ionicons 
                  size={24} 
                  name={focused ? "home" : "home-outline"} 
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="Counselors"
          options={{
            title: "Counselors",
            tabBarIcon: ({ color, focused }) => (
              <View 
                style={{ 
                  alignItems: "center", 
                  justifyContent: "center",
                  backgroundColor: focused ? colors.activeIndicator : "transparent",
                  paddingHorizontal: focused ? 20 : 0,
                  paddingVertical: focused ? 4 : 0,
                  borderRadius: 16,
                }}
              >
                <Ionicons 
                  size={24} 
                  name={focused ? "people" : "people-outline"} 
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: "Sessions",
            tabBarIcon: ({ color, focused }) => (
              <View 
                style={{ 
                  alignItems: "center", 
                  justifyContent: "center",
                  backgroundColor: focused ? colors.activeIndicator : "transparent",
                  paddingHorizontal: focused ? 20 : 0,
                  paddingVertical: focused ? 4 : 0,
                  borderRadius: 16,
                }}
              >
                <Ionicons 
                  size={24} 
                  name={focused ? "calendar" : "calendar-outline"} 
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            href: "/chat",
            tabBarIcon: ({ color, focused }) => (
              <View 
                style={{ 
                  alignItems: "center", 
                  justifyContent: "center",
                  backgroundColor: focused ? colors.activeIndicator : "transparent",
                  paddingHorizontal: focused ? 20 : 0,
                  paddingVertical: focused ? 4 : 0,
                  borderRadius: 16,
                }}
              >
                <Ionicons 
                  size={24} 
                  name={focused ? "chatbubbles" : "chatbubbles-outline"} 
                  color={color}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <View 
                style={{ 
                  alignItems: "center", 
                  justifyContent: "center",
                  backgroundColor: focused ? colors.activeIndicator : "transparent",
                  paddingHorizontal: focused ? 20 : 0,
                  paddingVertical: focused ? 4 : 0,
                  borderRadius: 16,
                }}
              >
                <Ionicons 
                  size={24} 
                  name={focused ? "person" : "person-outline"} 
                  color={color}
                />
              </View>
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
