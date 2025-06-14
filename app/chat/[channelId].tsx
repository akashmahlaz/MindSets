import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Channel, Chat, MessageInput, MessageList } from 'stream-chat-expo';
import { chatClient } from '../../services/stream';

const LoadingIndicator = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
    <Text>Loading...</Text>
  </View>
);

export default function ChatScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    const fetchChannel = async () => {
      if (!channelId) return;
      
      const newChannel = chatClient.channel('messaging', channelId);
      await newChannel.watch();
      setChannel(newChannel);
    };
    fetchChannel();
  }, [channelId]);

  if (!channel) return <LoadingIndicator />;

  return (
    <Chat client={chatClient}>
      <Channel channel={channel}>
        <MessageList />
        <MessageInput />
      </Channel>
    </Chat>
  );
}
