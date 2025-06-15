import "@/app/global.css";
import { useAuth } from '@/context/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Channel as StreamChannel } from 'stream-chat';
import { Channel, MessageInput, MessageList } from 'stream-chat-expo';
import { useChat } from '../../context/ChatContext';

export default function ChatScreen() {
  const { channelId } = useLocalSearchParams();
  const { chatClient, isChatConnected } = useChat();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannel = async () => {
      if (!chatClient || !isChatConnected || !user || !channelId) {
        setLoading(false);
        return;
      }
      try {
        let members: string[] = [user.uid];
        let channelIdStr: string = Array.isArray(channelId) ? channelId[0] : channelId;
        if (typeof channelIdStr === 'string' && channelIdStr.startsWith('dm-')) {
          const ids = channelIdStr.split('-').slice(1);
          ids.forEach(id => { if (!members.includes(id)) members.push(id); });
        }
        const channelObj = chatClient.channel('messaging', channelIdStr, { members });
        await channelObj.watch();
        setChannel(channelObj);
      } catch (error) {
        Alert.alert('Error', 'Failed to load chat channel.');
      } finally {
        setLoading(false);
      }
    };
    fetchChannel();
  }, [chatClient, isChatConnected, user, channelId]);

  if (loading || !channel) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-muted-foreground mt-4">Loading chat...</Text>
      </View>
    );
  }

  const getHeaderTitle = () => {
    if (!channel) return 'Chat';
    if ((channel.id as string).startsWith('dm-') && channel.state?.members) {
      const members = Object.values(channel.state.members);
      const otherMember = members.find((m: any) => m.user?.id !== user?.uid);
      if (otherMember?.user) {
        return otherMember.user.name || otherMember.user.id || 'Chat';
      }
    }
    return (channel.data as any)?.name || 'Chat';
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className={`flex-row items-center p-4 border-b border-border bg-card pt-[${insets.top}px]`}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-lg">{"<"}</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground flex-1 text-center">
          {getHeaderTitle()}
        </Text>
        <View className="w-6" />
      </View>

      {/* Chat Area */}
      <Channel channel={channel}>
        <View className="flex-1 pb-20">  {/* pb-20 accounts for input height */}
          <MessageList />
        </View>
        <View className={`pb-[${insets.bottom}px] bg-card border-t border-border`}>
          <MessageInput />
        </View>
        <View style={{ height: insets.bottom }} />
        <Text>test</Text>
        <View style={{ height: insets.bottom }}>
          <Text>test</Text>
        </View>
      </Channel>
    </View>
  );
}