import "@/app/global.css";
import { useChat } from '@/context/ChatContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { Chat, OverlayProvider } from 'stream-chat-expo';

export default function ChatTabsLayout() {
  const { chatClient, isChatConnected } = useChat();
  const pathname = usePathname();
  const isChatScreen = pathname.includes('/chat/') && pathname !== '/chat/';

  if (!chatClient || !isChatConnected) {
    return null;
  }

  return (
    <OverlayProvider value={{ style: { colors: { primary: '#6366F1' } } }}>
      <Chat client={chatClient}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#6366F1',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarLabelStyle: { textTransform: 'none', fontWeight: 'bold', fontSize: 15 },
            tabBarStyle: { backgroundColor: '#FFFFFF', borderTopWidth: 0, elevation: 0 },
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
