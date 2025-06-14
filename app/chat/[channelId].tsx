import { useAuth } from '@/context/AuthContext';
import { channelService } from '@/services/channelService';
import { ensureUserExists, getUnreadCount, markChannelAsRead, muteChannel, unmuteChannel } from '@/services/chatHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Channel, Chat, MessageInput, MessageList, Thread } from 'stream-chat-expo';
import { useChat } from '../../context/ChatContext';

const LoadingIndicator = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
    <Text>Loading...</Text>
  </View>
);

export default function ChatScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { chatClient, isChatConnected } = useChat();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Move hook to top level
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const fetchChannel = async () => {
      if (!channelId || !chatClient || !isChatConnected || !user) {
        console.log('Missing requirements for chat:', {
          channelId: !!channelId,
          chatClient: !!chatClient,
          isChatConnected,
          userAvailable: !!user
        });
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching channel:', channelId);

        // Extract user IDs from channel ID if it's a direct message channel
        if (channelId.startsWith('dm-')) {
          const parts = channelId.split('-');
          if (parts.length >= 3) {
            const userIds = [parts[1], parts[2]];

            // Ensure all users in the channel exist
            for (const userId of userIds) {
              if (userId !== user.uid) { // Skip current user
                await ensureUserExists(userId, user);
              }
            }
          }
        }

        // Now create or get the channel using the channel service
        const newChannel = await channelService.watchChannel('messaging', channelId);
        setChannel(newChannel);
        
        // Set initial unread count
        setUnreadCount(getUnreadCount(newChannel));
        
        // Check if channel is muted
        const muteStatus = newChannel.muteStatus();
        setIsMuted(!!muteStatus.muted);

        // Mark channel as read when entering
        await markChannelAsRead(newChannel);
        setUnreadCount(0);

        console.log('Channel loaded successfully');
      } catch (error) {
        console.error('Error fetching channel:', error);
        Alert.alert('Error', 'Failed to load channel. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChannel();
  }, [channelId, chatClient, isChatConnected, user]);

  // Listen for channel events
  useEffect(() => {
    if (!channel) return;

    const handleNewMessage = () => {
      setUnreadCount(getUnreadCount(channel));
    };

    const handleTypingStart = () => {
      setIsTyping(true);
    };

    const handleTypingStop = () => {
      setIsTyping(false);
    };

    const handleChannelUpdated = () => {
      // Refresh channel data
      console.log('Channel updated');
    };

    // Subscribe to channel events
    channel.on('message.new', handleNewMessage);
    channel.on('typing.start', handleTypingStart);
    channel.on('typing.stop', handleTypingStop);
    channel.on('channel.updated', handleChannelUpdated);

    return () => {
      // Cleanup event listeners
      channel.off('message.new', handleNewMessage);
      channel.off('typing.start', handleTypingStart);
      channel.off('typing.stop', handleTypingStop);
      channel.off('channel.updated', handleChannelUpdated);
    };
  }, [channel]);

  const handleChannelAction = (action: string) => {
    if (!channel) return;

    switch (action) {
      case 'mute':
        toggleMute();
        break;
      case 'info':
        // Navigate to channel info screen
        router.push(`/chat/${channelId}/info`);
        break;
      case 'leave':
        handleLeaveChannel();
        break;
      default:
        break;
    }
  };

  const toggleMute = async () => {
    if (!channel) return;

    try {
      if (isMuted) {
        await unmuteChannel(channel);
        setIsMuted(false);
        Alert.alert('Success', 'Channel unmuted');
      } else {
        await muteChannel(channel);
        setIsMuted(true);
        Alert.alert('Success', 'Channel muted');
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
      Alert.alert('Error', 'Failed to update mute status');
    }
  };

  const handleLeaveChannel = () => {
    Alert.alert(
      'Leave Channel',
      'Are you sure you want to leave this channel?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              if (channel && user) {
                await channelService.removeMembers(channel, [user.uid]);
                router.back();
              }
            } catch (error) {
              console.error('Error leaving channel:', error);
              Alert.alert('Error', 'Failed to leave channel');
            }
          }
        }
      ]
    );
  };

  const renderChannelHeader = () => {
    if (!channel) return null;

    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#fff'
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
            {channel.data?.name || 'Chat'}
          </Text>
          {isTyping && (
            <Text style={{ fontSize: 12, color: '#666' }}>
              Someone is typing...
            </Text>
          )}
          {unreadCount > 0 && (
            <Text style={{ fontSize: 12, color: '#007AFF' }}>
              {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => handleChannelAction('mute')}
            style={{ marginRight: 16 }}
          >
            <Ionicons 
              name={isMuted ? "volume-mute" : "volume-high"} 
              size={24} 
              color={isMuted ? "#FF3B30" : "#000"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => handleChannelAction('info')}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="information-circle-outline" size={24} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleChannelAction('leave')}>
            <Ionicons name="exit-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <LoadingIndicator />;
  
  if (!chatClient || !isChatConnected) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Chat not connected. Please try again.</Text>
        <TouchableOpacity
          onPress={() => setLoading(true)}
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: '#007AFF',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!channel) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Channel not found.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: '#007AFF',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      {renderChannelHeader()}
      <Chat client={chatClient}>
        <Channel 
          channel={channel}
          enforceUniqueReaction={true}
          maxTimeBetweenGroupedMessages={60000} // 1 minute
        >
          <View style={{ flex: 1 }}>
            <MessageList 
              onThreadSelect={(thread) => {
                // Handle thread selection if needed
                console.log('Thread selected:', thread);
              }}
            />
            <MessageInput 
              maxNumberOfFiles={5}
            />
          </View>
          <Thread />
        </Channel>
      </Chat>
    </View>
  );
}
