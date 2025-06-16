import "@/app/global.css";
import { useChat } from '@/context/ChatContext';
import { getStreamChatTheme } from '@/lib/streamTheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';
import { Chat, OverlayProvider } from 'stream-chat-expo';

export default function ChatTabsLayout() {
  const { chatClient, isChatConnected } = useChat();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const isChatScreen = pathname.includes('/chat/') && pathname !== '/chat/' && pathname !== '/chat/unread';

  if (!chatClient || !isChatConnected) {
    return null;
  }  return (
    <OverlayProvider value={{ 
      style: getStreamChatTheme(isDarkMode)
    }}>
      <Chat client={chatClient}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#3b82f6',
            tabBarInactiveTintColor: '#64748b',
            tabBarLabelStyle: { 
              textTransform: 'none', 
              fontWeight: '600', 
              fontSize: 12 
            },
            tabBarStyle: isChatScreen ? { display: 'none' } : { 
              backgroundColor: '#ffffff', 
              borderTopWidth: 1,
              borderTopColor: '#e2e8f0',
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              paddingBottom: 5,
              height: 65
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
          />
          <Tabs.Screen name="[channelId]" options={{ href: null }} />
          <Tabs.Screen name="[channelId]/info" options={{ href: null }} />
        </Tabs>
      </Chat>
    </OverlayProvider>
  );
}
