import "@/app/global.css";
import { useChat } from '@/context/ChatContext';
import { useColorScheme } from '@/lib/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname , Stack} from 'expo-router';
import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Chat, OverlayProvider } from 'stream-chat-expo';


export default function ChatTabsLayout() {
  const { chatClient, isChatConnected } = useChat();
  const pathname = usePathname();
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const isChatScreen = pathname.includes('/chat/') && pathname !== '/chat/' && pathname !== '/chat/unread';

  

  if (!chatClient || !isChatConnected) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar 
      className="bg-slate-100 dark:bg-slate-900"
      
        translucent={false}
      />
      <OverlayProvider >
        <Chat client={chatClient}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarLabelStyle: { 
                
              },
              tabBarStyle: isChatScreen ? { display: 'none' } : { 
                
                borderTopWidth: 1,
                
                // Let Expo Router handle positioning and safe areas automatically
                ...Platform.select({
                  ios: {
                   
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: isDarkColorScheme ? 0.3 : 0.08,
                    shadowRadius: 8,
                  },
                  android: {
                    elevation: 8,
                    
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
