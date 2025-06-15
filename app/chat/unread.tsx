import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Channel } from 'stream-chat';

export default function UnreadChatsScreen() {
  const { chatClient } = useChat();
  const { user } = useAuth();
  const [unreadChannels, setUnreadChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnreadChannels();
  }, []);
  const loadUnreadChannels = async () => {
    try {
      if (!chatClient || !user) return;
      
      const filters = {
        members: { $in: [user.uid] },
        last_message_at: { $exists: true },
      };
        const channels = await chatClient.queryChannels(filters, 
        { created_at: -1 }, 
        {
          watch: true,
          presence: true,
          limit: 30,
        }
      );

      // Filter channels with unread messages
      const unread = channels.filter(channel => {
        const unreadCount = channel.countUnread();
        return unreadCount > 0;
      });

      setUnreadChannels(unread);
    } catch (error) {
      console.error('Error loading unread channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChannelItem = ({ item: channel }: { item: Channel }) => {
    const lastMessage = channel.state.messages[channel.state.messages.length - 1];
    const unreadCount = channel.countUnread();
    
    return (
      <View 
        className="flex-row items-center p-4 border-b border-gray-200 bg-white active:bg-gray-50"
        onTouchEnd={() => router.push(`/chat/${channel.id}`)}
      >        <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center mr-3">
          <Text className="text-white font-semibold text-lg">
            {(channel.data as any)?.name?.charAt(0)?.toUpperCase() || 'C'}
          </Text>
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-semibold text-gray-900 text-base" numberOfLines={1}>
              {(channel.data as any)?.name || 'Unnamed Channel'}
            </Text>
            <View className="bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
              <Text className="text-white text-xs font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          </View>
          
          {lastMessage && (
            <Text className="text-gray-600 text-sm" numberOfLines={2}>
              {lastMessage.user?.name || 'Unknown'}: {lastMessage.text || 'Sent an attachment'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Loading unread messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {unreadChannels.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4">
            <Text className="text-green-600 text-2xl">✓</Text>
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-2">All caught up!</Text>
          <Text className="text-gray-500 text-center">
            You have no unread messages. Great job staying on top of your conversations!
          </Text>
        </View>
      ) : (
        <>
          <View className="px-4 py-3 bg-white border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">
              Unread Messages ({unreadChannels.length})
            </Text>
          </View>
          
          <FlatList
            data={unreadChannels}
            renderItem={renderChannelItem}
            keyExtractor={(item) => item.id || 'unknown'}
            className="flex-1"
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}
