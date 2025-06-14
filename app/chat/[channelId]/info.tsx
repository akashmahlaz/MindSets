import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { channelService } from '@/services/channelService';
import {
    getChannelMembers,
    leaveChannel,
    removeMembersFromChannel,
    updateChannelInfo
} from '@/services/chatHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChannelMember {
  user_id: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  channel_role?: string;
  created_at: string;
}

export default function ChannelInfoScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { chatClient } = useChat();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [channel, setChannel] = useState<any>(null);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadChannelInfo();
  }, [channelId]);

  const loadChannelInfo = async () => {
    if (!channelId || !chatClient || !user) return;

    try {
      setLoading(true);
      
      // Get the channel
      const channelInstance = chatClient.channel('messaging', channelId);
      await channelInstance.watch();
      setChannel(channelInstance);
      
      // Set channel data
      setChannelName(channelInstance.data?.name || '');
      setChannelDescription(channelInstance.data?.description || '');
      
      // Check if current user is admin/creator
      const isCreator = channelInstance.data?.created_by_id === user.uid;
      const memberRole = channelInstance.state.members[user.uid]?.channel_role;
      setIsAdmin(isCreator || memberRole === 'channel_moderator' || memberRole === 'admin');
      
      // Load members
      const membersResult = await getChannelMembers(channelInstance);
      setMembers(membersResult.members || []);
      
    } catch (error) {
      console.error('Error loading channel info:', error);
      Alert.alert('Error', 'Failed to load channel information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChannelName = async () => {
    if (!channel || !channelName.trim()) return;

    try {
      await updateChannelInfo(channel, { name: channelName.trim() }, user!);
      setEditingName(false);
      Alert.alert('Success', 'Channel name updated');
    } catch (error) {
      console.error('Error updating channel name:', error);
      Alert.alert('Error', 'Failed to update channel name');
    }
  };

  const handleUpdateChannelDescription = async () => {
    if (!channel) return;

    try {
      await updateChannelInfo(channel, { description: channelDescription }, user!);
      Alert.alert('Success', 'Channel description updated');
    } catch (error) {
      console.error('Error updating channel description:', error);
      Alert.alert('Error', 'Failed to update channel description');
    }
  };

  const handleRemoveMember = (member: ChannelMember) => {
    if (!isAdmin) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.user.name} from this channel?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMembersFromChannel(
                channel,
                [member.user_id],
                user!,
                `${member.user.name} was removed from the channel`
              );
              loadChannelInfo(); // Refresh
              Alert.alert('Success', 'Member removed');
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          }
        }
      ]
    );
  };

  const handleMakeAdmin = async (member: ChannelMember) => {
    if (!isAdmin || !channel) return;

    try {
      await channelService.addModerators(channel, [member.user_id]);
      loadChannelInfo(); // Refresh
      Alert.alert('Success', `${member.user.name} is now a moderator`);
    } catch (error) {
      console.error('Error making admin:', error);
      Alert.alert('Error', 'Failed to make user a moderator');
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
              await leaveChannel(channel, user!.uid);
              router.back();
            } catch (error) {
              console.error('Error leaving channel:', error);
              Alert.alert('Error', 'Failed to leave channel');
            }
          }
        }
      ]
    );
  };

  const handleMuteChannel = async () => {
    if (!channel) return;

    try {
      const muteStatus = channel.muteStatus();
      if (muteStatus.muted) {
        await channel.unmute();
        Alert.alert('Success', 'Channel unmuted');
      } else {
        await channel.mute();
        Alert.alert('Success', 'Channel muted');
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
      Alert.alert('Error', 'Failed to update mute status');
    }
  };

  const renderMemberItem = ({ item: member }: { item: ChannelMember }) => {
    const isModerator = member.channel_role === 'channel_moderator' || member.channel_role === 'admin';
    const isCurrentUser = member.user_id === user?.uid;

    return (
      <TouchableOpacity
        style={styles.memberItem}
        onLongPress={() => {
          if (isAdmin && !isCurrentUser) {
            Alert.alert(
              'Member Actions',
              `Choose an action for ${member.user.name}`,
              [
                { text: 'Cancel', style: 'cancel' },
                !isModerator && {
                  text: 'Make Moderator',
                  onPress: () => handleMakeAdmin(member)
                },
                {
                  text: 'Remove from Channel',
                  style: 'destructive',
                  onPress: () => handleRemoveMember(member)
                }
              ].filter(Boolean) as any
            );
          }
        }}
      >
        <Image
          source={{ uri: member.user.image || `https://getstream.io/random_png/?name=${member.user.name}` }}
          style={styles.memberAvatar}
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.user.name}</Text>
          {isModerator && (
            <Text style={styles.moderatorBadge}>Moderator</Text>
          )}
          {isCurrentUser && (
            <Text style={styles.youBadge}>You</Text>
          )}
        </View>
        {isAdmin && !isCurrentUser && (
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading channel info...</Text>
      </View>
    );
  }

  if (!channel) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Channel not found</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Channel Info</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Channel Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channel Name</Text>
          {editingName ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.textInput}
                value={channelName}
                onChangeText={setChannelName}
                placeholder="Enter channel name"
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={() => {
                    setEditingName(false);
                    setChannelName(channel.data?.name || '');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton]}
                  onPress={handleUpdateChannelName}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => isAdmin && setEditingName(true)}
              disabled={!isAdmin}
            >
              <Text style={styles.infoText}>
                {channelName || 'No name set'}
              </Text>
              {isAdmin && (
                <Ionicons name="pencil" size={16} color="#007AFF" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Channel Description */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={channelDescription}
              onChangeText={setChannelDescription}
              placeholder="Add a description"
              multiline
              numberOfLines={3}
              onBlur={handleUpdateChannelDescription}
            />
          </View>
        )}

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Members ({members.length})
            </Text>
            {isAdmin && (
              <TouchableOpacity onPress={() => router.push('/users')}>
                <Ionicons name="add" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.user_id}
            scrollEnabled={false}
          />
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton} onPress={handleMuteChannel}>
            <Ionicons name="volume-mute" size={20} color="#666" />
            <Text style={styles.actionText}>Mute Channel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerAction]} 
            onPress={handleLeaveChannel}
          >
            <Ionicons name="exit" size={20} color="#FF3B30" />
            <Text style={[styles.actionText, styles.dangerText]}>Leave Channel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
  },
  editContainer: {
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  moderatorBadge: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  youBadge: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dangerAction: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  dangerText: {
    color: '#FF3B30',
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
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
