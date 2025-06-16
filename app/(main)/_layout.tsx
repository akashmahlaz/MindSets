import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StatusBar } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/lib/useColorScheme';

export default function TabLayout() {
  const { colorScheme, isDarkColorScheme } = useColorScheme();

  return (
    <>
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? "#151718" : "#ffffff"}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: isDarkColorScheme ? '#ffffff' : '#0a7ea4',
          tabBarInactiveTintColor: isDarkColorScheme ? '#9BA1A6' : '#687076',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: {
            backgroundColor: isDarkColorScheme ? '#151718' : '#ffffff',
            borderTopColor: isDarkColorScheme ? '#2a2a2a' : '#e5e7eb',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 85 : 65,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
            paddingTop: 8,
            ...Platform.select({
              ios: {
                shadowColor: isDarkColorScheme ? '#000' : '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: isDarkColorScheme ? 0.3 : 0.1,
                shadowRadius: 8,
              },
              android: {
                elevation: 8,
              },
            }),
          },
        }}>      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
    </>
  );
}
