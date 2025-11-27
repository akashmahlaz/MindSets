import { Tabs } from "expo-router";
import React from "react";
import { Platform, StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { FontAwesome6 } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";

export default function TabLayout() {
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const { userProfile } = useAuth();
  
  // Premium color scheme - Soft, calming mental health app
  const backgroundColor = isDarkColorScheme ? "#0F1419" : "#FAFBFC";
  const tabBarBg = isDarkColorScheme ? "#171D26" : "#FFFFFF";
  const activeTint = isDarkColorScheme ? "#6B8CF5" : "#4A6CF4";
  const inactiveTint = isDarkColorScheme ? "#5A6477" : "#9CA3AF";
  const statusBarBg = backgroundColor;

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={statusBarBg}
        translucent={false}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: activeTint,
          tabBarInactiveTintColor: inactiveTint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: -2,
            marginBottom: Platform.OS === "ios" ? 0 : 4,
          },
          tabBarIconStyle: {
            marginTop: Platform.OS === "ios" ? 0 : 4,
          },
          tabBarStyle: {
            backgroundColor: tabBarBg,
            borderTopWidth: 0,
            height: Platform.OS === "ios" ? 88 : 64,
            paddingTop: 8,
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: isDarkColorScheme ? 0.3 : 0.06,
                shadowRadius: 16,
              },
              android: {
                elevation: 16,
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
              <View style={{ alignItems: "center" }}>
                <IconSymbol 
                  size={focused ? 26 : 24} 
                  name="house.fill" 
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
              <View style={{ alignItems: "center" }}>
                <FontAwesome6 
                  size={focused ? 24 : 22} 
                  name="user-doctor" 
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
              <View style={{ alignItems: "center" }}>
                <AntDesign 
                  size={focused ? 26 : 24} 
                  name="calendar" 
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
              <View style={{ alignItems: "center" }}>
                <AntDesign 
                  size={focused ? 26 : 24} 
                  name="message1" 
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
              <View style={{ alignItems: "center" }}>
                <AntDesign 
                  size={focused ? 26 : 24} 
                  name="user" 
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
