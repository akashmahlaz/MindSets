import "@/app/global.css";
import { useAuth } from '@/context/AuthContext';
import { streamChatTheme } from '@/lib/streamTheme';
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
      <View style={{ 
        flex: 1, 
        backgroundColor: '#f8fafc',
        paddingTop: insets.top 
      }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{
            color: '#64748b',
            marginTop: 16,
            fontSize: 16,
            fontWeight: '500'
          }}>Loading chat...</Text>
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

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: '#f8fafc'
    }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Professional Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
      }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#f1f5f9',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#475569" />
        </TouchableOpacity>
        
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: 2
          }}>
            {getHeaderTitle()}
          </Text>
          <Text style={{
            fontSize: 13,
            color: '#64748b'
          }}>
            Online now
          </Text>
        </View>
        
        <TouchableOpacity style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#f1f5f9',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Ionicons name="call" size={18} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Chat Area with proper theming and keyboard handling */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <OverlayProvider value={{ style: streamChatTheme }}>
          <Channel channel={channel}>
            <View style={{ flex: 1 }}>
              <MessageList />
            </View>
            <View style={{
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#e2e8f0'
            }}>
              <MessageInput />
            </View>
          </Channel>
        </OverlayProvider>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}