import "@/app/global.css";
import { useAuth } from '@/context/AuthContext';
import { getStreamChatTheme } from '@/lib/streamThemeNew';
import { useColorScheme } from '@/lib/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Channel as StreamChannel } from 'stream-chat';
import { Channel, MessageInput, MessageList, OverlayProvider } from 'stream-chat-expo';
import { useChat } from '../../context/ChatContext';

export default function ChatScreen() {
  const { channelId } = useLocalSearchParams();
  const { chatClient, isChatConnected } = useChat();
  const { user } = useAuth();  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme, isDarkColorScheme } = useColorScheme();
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
    return (      <View className="flex-1 bg-slate-50 dark:bg-slate-900" style={{ paddingTop: insets.top }}>
        <StatusBar 
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"} 
          backgroundColor={isDarkColorScheme ? "#0f172a" : "#f8fafc"} 
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-slate-600 dark:text-slate-400 mt-4 text-base font-medium">
            Loading chat...
          </Text>
        </View>
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
  return (    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top', 'bottom']}>
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"} 
        backgroundColor={isDarkColorScheme ? "#1e293b" : "#ffffff"} 
      />
      
      {/* Professional Header */}
      <View className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 justify-center items-center mr-3"        >
          <Ionicons name="chevron-back" size={20} color={isDarkColorScheme ? "#cbd5e1" : "#475569"} />
        </TouchableOpacity>
        
        <View className="flex-1">
          <Text className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-0.5">
            {getHeaderTitle()}
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            Online now
          </Text>
        </View>
        
        <TouchableOpacity className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 justify-center items-center">
          <Ionicons name="call" size={18} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Chat Area with proper theming and keyboard handling */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={70}
      >
        <OverlayProvider value={{ style: getStreamChatTheme(isDarkColorScheme) }}>
          <Channel 
            channel={channel}
            disableKeyboardCompatibleView={true}
            keyboardVerticalOffset={0}
          >
            <View className="flex-1">
              <MessageList />
            </View>
            <MessageInput />
          </Channel>
        </OverlayProvider>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}