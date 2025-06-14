import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { channelService } from '@/services/channelService';
import { getUnreadCount, markChannelAsRead } from '@/services/chatHelpers';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Channel as ChannelType } from 'stream-chat';
import { ChannelPreviewMessenger, Chat } from 'stream-chat-expo';

export default function ChannelListScreen() {
  const { chatClient, isChatConnected } = useChat();
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChannelType[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<ChannelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'pinned' | 'archived'>('all');

  // Helper function to get channel display name
  const getChannelDisplayName = (channel: ChannelType): string => {
    // First check if channel has a custom name
    if (channel.data?.name) {
      return channel.data.name;
    }

    // For direct message channels, get the other user's name
    if (channel.type === 'messaging') {
      const members = Object.values(channel.state?.members || {});
      const otherMember = members.find((member: any) => 
        member.user?.id !== user?.uid
      );
      
      if (otherMember?.user) {
        return otherMember.user.name || otherMember.user.id || 'Unknown User';
      }
    }

    // Fallback to channel ID or generic name
    return channel.id || 'Unnamed Channel';
  };
  // Function to load channels
  const loadChannels = async () => {
    if (!chatClient || !user) return;

    try {
      setRefreshing(true);
      // Get user's channels using the enhanced channel service
      const userChannels = await channelService.getUserChannels(user.uid, 'messaging', {
        archived: activeFilter === 'archived' ? true : false,
        pinned: activeFilter === 'pinned' ? true : undefined,
        limit: 50,
      });

      setChannels(userChannels);
      filterChannels(userChannels, searchQuery, activeFilter);
      console.log(`Loaded ${userChannels.length} channels`);
    } catch (error) {
      console.error('Error loading channels:', error);
      Alert.alert('Error', 'Failed to load channels. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  // Filter channels based on search query and active filter
  const filterChannels = (allChannels: ChannelType[], query: string, filter: string) => {
    let filtered = [...allChannels];

    // Apply search filter
    if (query.trim()) {
      filtered = filtered.filter(channel => {
        const channelName = getChannelDisplayName(channel);
        const nameMatch = channelName.toLowerCase().includes(query.toLowerCase());
        
        const memberMatch = Object.values(channel.state?.members || {}).some((member: any) => 
          member.user?.name?.toLowerCase().includes(query.toLowerCase())
        );
        
        return nameMatch || memberMatch;
      });
    }

    // Apply status filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(channel => getUnreadCount(channel) > 0);
        break;
      case 'pinned':
        filtered = filtered.filter(channel => channel.data?.pinned);
        break;
      case 'archived':
        filtered = filtered.filter(channel => channel.data?.archived);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    setFilteredChannels(filtered);
  };

  // Load channels on component mount
  useEffect(() => {
    if (chatClient && isChatConnected) {
      loadChannels();
    } else {
      setLoading(false);
    }
  }, [chatClient, isChatConnected, activeFilter]);

  // Update filtered channels when search query changes
  useEffect(() => {
    filterChannels(channels, searchQuery, activeFilter);
  }, [searchQuery, channels, activeFilter]);

  // Function to navigate to a specific channel
  const navigateToChannel = async (channel: ChannelType) => {
    try {
      // Mark channel as read when entering
      await markChannelAsRead(channel);
      router.push(`/chat/${channel.id}`);
    } catch (error) {
      console.error('Error navigating to channel:', error);
      router.push(`/chat/${channel.id}`);
    }
  };

  // Handle channel actions (long press menu)
  const handleChannelAction = (channel: ChannelType, action: string) => {
    switch (action) {
      case 'pin':
        togglePinChannel(channel);
        break;
      case 'archive':
        toggleArchiveChannel(channel);
        break;
      case 'mute':
        muteChannel(channel);
        break;
      case 'leave':
        leaveChannel(channel);
        break;
      default:
        break;
    }
  };

  const togglePinChannel = async (channel: ChannelType) => {
    try {
      if (channel.data?.pinned) {
        await channelService.unpinChannel(channel);
      } else {
        await channelService.pinChannel(channel);
      }
      loadChannels(); // Refresh the list
    } catch (error) {
      console.error('Error toggling pin status:', error);
      Alert.alert('Error', 'Failed to update pin status');
    }
  };

  const toggleArchiveChannel = async (channel: ChannelType) => {
    try {
      if (channel.data?.archived) {
        await channelService.unarchiveChannel(channel);
      } else {
        await channelService.archiveChannel(channel);
      }
      loadChannels(); // Refresh the list
    } catch (error) {
      console.error('Error toggling archive status:', error);
      Alert.alert('Error', 'Failed to update archive status');
    }
  };

  const muteChannel = async (channel: ChannelType) => {
    try {
      await channel.mute();
      Alert.alert('Success', 'Channel muted');
    } catch (error) {
      console.error('Error muting channel:', error);
      Alert.alert('Error', 'Failed to mute channel');
    }
  };

  const leaveChannel = async (channel: ChannelType) => {
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
              if (user) {
                await channelService.removeMembers(channel, [user.uid]);
                loadChannels(); // Refresh the list
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

  const renderChannelItem = ({ item: channel }: { item: ChannelType }) => {
    const unreadCount = getUnreadCount(channel);
    const isPinned = channel.data?.pinned;
    const isArchived = channel.data?.archived;

    return (
      <TouchableOpacity
        style={styles.channelItem}
        onPress={() => navigateToChannel(channel)}        onLongPress={() => {
          const channelDisplayName = getChannelDisplayName(channel);
          Alert.alert(
            'Channel Actions',
            `Choose an action for ${channelDisplayName}`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: isPinned ? 'Unpin' : 'Pin', 
                onPress: () => handleChannelAction(channel, 'pin') 
              },
              { 
                text: isArchived ? 'Unarchive' : 'Archive', 
                onPress: () => handleChannelAction(channel, 'archive') 
              },
              { 
                text: 'Mute', 
                onPress: () => handleChannelAction(channel, 'mute') 
              },
              { 
                text: 'Leave', 
                style: 'destructive',
                onPress: () => handleChannelAction(channel, 'leave') 
              },
            ]
          );
        }}
      >
        <Chat client={chatClient}>
          <View style={styles.channelPreviewContainer}>
            <ChannelPreviewMessenger 
              channel={channel}
              onSelect={() => navigateToChannel(channel)}
            />
            <View style={styles.channelIndicators}>
              {isPinned && (
                <Ionicons name="pin" size={16} color="#007AFF" style={styles.indicator} />
              )}
              {isArchived && (
                <Ionicons name="archive" size={16} color="#FF9500" style={styles.indicator} />
              )}
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Chat>
      </TouchableOpacity>
    );
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {['all', 'unread', 'pinned', 'archived'].map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            activeFilter === filter && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter(filter as any)}
        >
          <Text style={[
            styles.filterText,
            activeFilter === filter && styles.activeFilterText
          ]}>
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search channels..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#666"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No channels found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : 'Start a conversation to see your chats here'
        }
      </Text>
      <TouchableOpacity 
        style={styles.createChannelButton}
        onPress={() => router.push('/users')}
      >
        <Text style={styles.createChannelText}>Start New Chat</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading channels...</Text>
      </View>
    );
  }
  if (!chatClient || !isChatConnected) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="wifi-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Chat not connected</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => setLoading(true)}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity onPress={() => router.push('/users')}>
          <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {renderSearchBar()}
      {renderFilterButtons()}

      <FlatList
        data={filteredChannels}
        keyExtractor={(item) => item.id || item.cid}
        renderItem={renderChannelItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadChannels}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredChannels.length === 0 && styles.emptyContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  channelItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  channelPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  channelIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  indicator: {
    marginLeft: 4,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    color: '#333',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  createChannelButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  createChannelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
