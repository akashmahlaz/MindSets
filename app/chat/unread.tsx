import "@/app/global.css";
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { getUnreadCount, markChannelAsRead } from '@/services/chatHelpers';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Channel } from 'stream-chat';
import { ChannelPreviewMessenger } from 'stream-chat-expo';

export default function UnreadChannelsScreen() {
  const { chatClient, isChatConnected } = useChat();
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load channels
  const loadChannels = async () => {
    if (!chatClient || !user) return;
    try {
      setLoading(true);
      const filters = {
        type: { $in: ['messaging'] },
        members: { $in: [user.uid] }
      };
      const channels = await chatClient.queryChannels(filters, { last_message_at: -1 }, {
        watch: true,
        presence: true,
        limit: 30,
      });
      setChannels(channels as Channel[]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load channels.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter channels for unread
  const filterChannels = (allChannels: Channel[], query: string) => {
    let filtered = [...allChannels];
    if (query.trim()) {
      filtered = filtered.filter(channel => {
        const channelName = ((channel.data as any)?.name || '').toLowerCase();
        const nameMatch = channelName.includes(query.toLowerCase());
        const memberMatch = Object.values(channel.state?.members || {}).some((member: any) =>
          ((member.user?.name || member.user?.display_name || '')?.toLowerCase().includes(query.toLowerCase()))
        );
        return nameMatch || memberMatch;
      });
    }
    filtered = filtered.filter(channel => getUnreadCount(channel) > 0);
    setFilteredChannels(filtered);
  };

  useEffect(() => {
    if (chatClient && isChatConnected) {
      loadChannels();
    } else {
      setLoading(false);
    }
  }, [chatClient, isChatConnected]);

  useEffect(() => {
    filterChannels(channels, searchQuery);
  }, [searchQuery, channels]);

  const navigateToChannel = async (channel: Channel) => {
    try {
      await markChannelAsRead(channel);
      router.push(`/chat/${channel.id}`);
    } catch (error) {
      router.push(`/chat/${channel.id}`);
    }
  };

  const renderChannelItem = ({ item: channel }: { item: Channel }) => {
    const unreadCount = getUnreadCount(channel);
    const isPinned = (channel.data as any)?.pinned;
    const isArchived = (channel.data as any)?.archived;
    return (
      <TouchableOpacity
        className="bg-card border-b border-border"
        onPress={() => navigateToChannel(channel)}
      >
        <View className="relative">
          <ChannelPreviewMessenger 
            channel={channel}
            onSelect={() => navigateToChannel(channel)}
            latestMessagePreview={{
              messageObject: channel.state.messages[channel.state.messages.length - 1] || null,
              previews: [],
              status: 1
            }}
          />
          <View className="absolute top-2 right-2 flex-row">
            {isPinned && (
              <Ionicons name="pin" size={16} color="#6366F1" className="mr-1" />
            )}
            {isArchived && (
              <Ionicons name="archive" size={16} color="#F59E0B" className="mr-1" />
            )}
            {unreadCount > 0 && (
              <View className="bg-destructive rounded-full px-2 py-1 min-w-6 items-center">
                <Text className="text-destructive-foreground text-xs font-semibold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-muted-foreground mt-4">Loading channels...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="p-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Unread Messages</Text>
      </View>
      {/* Search Bar */}
      <View className="p-4 border-b border-border">
        <TextInput
          className="bg-card rounded-lg px-4 py-2 text-foreground"
          placeholder="Search conversations..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {/* Channel List */}
      <FlatList
        data={filteredChannels}
        renderItem={renderChannelItem}
        keyExtractor={(item) => item.id || ''}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadChannels();
            }}
          />
        }
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center p-8">
            <Ionicons
              name="mail-open-outline"
              size={64}
              color="#9CA3AF"
              style={{ marginBottom: 16 }}
            />
            <Text className="text-muted-foreground text-lg font-medium">
              All caught up!
            </Text>
            <Text className="text-muted-foreground text-sm mt-2 text-center">
              You have no unread messages
            </Text>
            <TouchableOpacity 
              className="mt-6 px-6 py-3 bg-primary rounded-lg"
              onPress={() => router.push('/chat')}
            >
              <Text className="text-primary-foreground font-medium">View All Chats</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
