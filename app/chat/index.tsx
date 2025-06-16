import "@/app/global.css";
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useColorScheme } from '@/lib/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    StatusBar,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChannelList } from 'stream-chat-expo';

export default function ChannelListScreen() {
  const { chatClient, isChatConnected } = useChat();
  const { user } = useAuth();
  const { isDarkColorScheme } = useColorScheme();

  if (!chatClient || !isChatConnected || !user) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background" edges={['top']}>
        <StatusBar 
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={isDarkColorScheme ? '#000000' : '#ffffff'}
        />
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-muted-foreground mt-4">Loading channels...</Text>
      </SafeAreaView>
    );
  }

  const filters = {
    type: 'messaging',
    members: { $in: [user.uid] }
  };

  const sort = {
    last_message_at: -1 as const,
  };

  const options = {
    watch: true,
    presence: true,
    limit: 30,
  };
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? '#000000' : '#ffffff'}
      />
      {/* Header */}
      <View className="p-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Messages</Text>
      </View>
      {/* Channel List */}
      <ChannelList
        filters={filters}
        sort={sort}
        options={options}
        onSelect={(channel) => {
          router.push(`/chat/${channel.id}`);
        }}
        EmptyStateIndicator={() => (
          <View className="flex-1 justify-center items-center p-8">
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={64}
              color="#9CA3AF"
              style={{ marginBottom: 16 }}
            />
            <Text className="text-muted-foreground text-lg font-medium">
              No conversations found
            </Text>
            <Text className="text-muted-foreground text-sm mt-2 text-center">
              Start a new conversation
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
