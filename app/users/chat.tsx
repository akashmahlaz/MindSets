import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { createOrGetDirectChannel } from '@/services/chatHelpers';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

export const useStartChat = () => {
  const { user } = useAuth();
  const { chatClient, isChatConnected } = useChat();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const startChat = async (targetUserId: string) => {
    if (isStartingChat) return;

    setIsStartingChat(true);
    console.log('startChat called');

    try {
      if (!user) {
        console.error('Cannot start chat: User not authenticated');
        Alert.alert('Error', 'You must be logged in to start a chat');
        return;
      }

      console.log('user available:', !!user);
      console.log('userId available:', !!targetUserId);
      console.log('chatClient available:', !!chatClient);
      console.log('isChatConnected:', isChatConnected);

      if (!chatClient || !isChatConnected) {
        throw new Error('Chat not connected');
      }

      console.log('Assuming target user exists in Stream Chat:', targetUserId);

      // Create or get a direct message channel
      const channel = await createOrGetDirectChannel(user, targetUserId);

      // Navigate to the chat screen
      router.push(`/chat/${channel.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    } finally {
      setIsStartingChat(false);
    }
  };
  return {
    startChat,
    isStartingChat,
  };
};

// Default export component required for Expo Router
export default function UsersChat() {
  return (
    <View className="flex-1 justify-center items-center">
      <Text>Users Chat Utility</Text>
    </View>
  );
}
