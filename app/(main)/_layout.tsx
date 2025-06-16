import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/lib/useColorScheme';

export default function TabLayout() {
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  // Match colors with CSS design tokens
  const backgroundColor = isDarkColorScheme ? '#000000' : '#ffffff'; // Pure black/white for consistency
  const borderColor = isDarkColorScheme ? '#242424' : 'hsl(220, 13%, 91%)'; // --border
  const statusBarBg = isDarkColorScheme ? '#000000' : '#ffffff'; // Matching the background

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={statusBarBg}
        translucent={false}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: isDarkColorScheme ? '#ffffff' : '#0a7ea4',
          tabBarInactiveTintColor: isDarkColorScheme ? 'hsl(217, 10%, 65%)' : 'hsl(220, 9%, 46%)', // --muted-foreground
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: {
            backgroundColor: backgroundColor,
            borderTopColor: borderColor,
            borderTopWidth: 1,
            // Let Expo Router handle positioning and safe areas automatically
            ...Platform.select({
              ios: {
                shadowColor: isDarkColorScheme ? '#000' : '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: isDarkColorScheme ? 0.3 : 0.08,
                shadowRadius: 8,
              },
              android: {
                elevation: 12,
                shadowColor: isDarkColorScheme ? '#000' : '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: isDarkColorScheme ? 0.4 : 0.1,
                shadowRadius: 6,
              },
            }),
          },
        }}>
        <Tabs.Screen
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
    </SafeAreaProvider>
  );
}
