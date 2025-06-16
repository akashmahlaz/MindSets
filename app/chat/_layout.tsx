import "@/app/global.css";
import { useChat } from '@/context/ChatContext';
import { useColorScheme } from '@/lib/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Chat, OverlayProvider } from 'stream-chat-expo';

export default function ChatTabsLayout() {
  const { chatClient, isChatConnected } = useChat();
  const pathname = usePathname();
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const isChatScreen = pathname.includes('/chat/') && pathname !== '/chat/' && pathname !== '/chat/unread';

  // Match colors with CSS design tokens
  const backgroundColor = isDarkColorScheme ? 'hsl(224, 71%, 4%)' : 'hsl(0, 0%, 100%)'; // --background
  const borderColor = isDarkColorScheme ? 'hsl(215, 27%, 17%)' : 'hsl(220, 13%, 91%)'; // --border
  const statusBarBg = isDarkColorScheme ? '#0f172a' : '#ffffff';

  if (!chatClient || !isChatConnected) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={statusBarBg}
        translucent={false}
      />
      <OverlayProvider>
        <Chat client={chatClient}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: isDarkColorScheme ? '#ffffff' : '#3b82f6',
              tabBarInactiveTintColor: isDarkColorScheme ? 'hsl(217, 10%, 65%)' : 'hsl(220, 9%, 46%)',
              tabBarLabelStyle: { 
                textTransform: 'none', 
                fontWeight: '600', 
                fontSize: 12 
              },
              tabBarStyle: isChatScreen ? { display: 'none' } : { 
                backgroundColor: backgroundColor,
                borderTopWidth: 1,
                borderTopColor: borderColor,
                // Let Expo Router handle positioning and safe areas automatically
                ...Platform.select({
                  ios: {
                    shadowColor: isDarkColorScheme ? '#000' : '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: isDarkColorScheme ? 0.3 : 0.08,
                    shadowRadius: 8,
                  },
                  android: {
                    elevation: 8,
                    shadowColor: isDarkColorScheme ? '#000' : '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: isDarkColorScheme ? 0.4 : 0.1,
                    shadowRadius: 8,
                  },
                }),
              },
            }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'All Chats',
              tabBarIcon: ({ color }) => (
                <Ionicons name="chatbubbles" size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="unread"
            options={{
              title: 'Unread',
              tabBarIcon: ({ color }) => (
                <Ionicons name="mail-unread" size={22} color={color} />
              ),
            }}
          />          <Tabs.Screen name="[channelId]" options={{ href: null }} />
          <Tabs.Screen name="[channelId]/info" options={{ href: null }} />
        </Tabs>
      </Chat>
    </OverlayProvider>
    </SafeAreaProvider>
  );
}
