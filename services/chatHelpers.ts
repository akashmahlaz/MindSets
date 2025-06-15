import { User } from 'firebase/auth';
import { Channel } from 'stream-chat';
import { channelService } from './channelService';
import { chatClient, getStreamToken } from './stream';

export interface MessageOptions {
  text?: string;
  user_id?: string;
  attachments?: any[];
  mentioned_users?: string[];
  parent_id?: string;
  show_in_channel?: boolean;
  silent?: boolean;
}

export interface ChannelFilters {
  type?: string;
  members?: { $in: string[] };
  archived?: boolean;
  pinned?: boolean;
  name?: { $autocomplete: string };
  created_at?: { $gte?: Date; $lte?: Date };
}

// Check if a user exists in Stream and create if not
export const ensureUserExists = async (userId: string, currentUser: User): Promise<boolean> => {
  try {
    console.log(`Checking if user ${userId} exists in Stream Chat...`);

    // First check if the user exists using queryUsers
    const { users } = await chatClient.queryUsers({ id: userId });

    if (users.length > 0) {
      console.log(`User ${userId} already exists in Stream Chat.`);
      return true;
    }

    // User doesn't exist, try to create them
    console.log(`User ${userId} doesn't exist in Stream Chat. Creating...`);

    // For this user, we need to create them through the server
    // Get token for current user
    const token = await getStreamToken(currentUser.uid);
    if (!token) {
      console.error('Failed to get Stream token for user creation');
      return false;
    }

    // Temporarily connect as the current user if not already connected
    const wasConnected = !!chatClient.userID;
    if (!wasConnected) {
      await chatClient.connectUser(
        {
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email || 'Anonymous',
          image: currentUser.photoURL || `https://getstream.io/random_png/?name=${currentUser.displayName || currentUser.email}`,
        },
        token
      );
    }

    // Create the other user - we can only create a minimal user object
    // The complete profile will be set when they log in themselves
    await chatClient.upsertUser({
      id: userId,
      role: 'user',
      name: 'User', // Minimal placeholder name
    });

    console.log(`Successfully created user ${userId} in Stream Chat.`);
    return true;
  } catch (error) {
    console.error(`Failed to ensure user ${userId} exists in Stream Chat:`, error);
    return false;
  }
};

// Create or get a direct message channel between two users
export const createOrGetDirectChannel = async (
  currentUser: User,
  targetUserId: string
): Promise<Channel> => {
  try {
    // Ensure both users exist in Stream
    await ensureUserExists(currentUser.uid, currentUser);
    await ensureUserExists(targetUserId, currentUser);

    // Create a deterministic channel ID for direct messages
    const channelId = `dm-${currentUser.uid}-${targetUserId}`;

    // Try to get existing channel
    let channel = await channelService.watchChannel('messaging', channelId);

    if (!channel) {
      // Create new channel if it doesn't exist
      channel = await channelService.createChannelWithId(
        'messaging',
        channelId,
        {
          members: [currentUser.uid, targetUserId],
          created_by_id: currentUser.uid,
        }
      );
    }

    return channel;
  } catch (error) {
    console.error('Error creating/getting direct channel:', error);
    throw error;
  }
};

// Enhanced channel management functions

// Create a group channel
export const createGroupChannel = async (
  channelName: string,
  members: string[],
  currentUser: User,
  options: {
    description?: string;
    image?: string;
    private?: boolean;
  } = {}
): Promise<Channel> => {
  try {
    // Ensure all members exist
    for (const memberId of members) {
      if (memberId !== currentUser.uid) {
        await ensureUserExists(memberId, currentUser);
      }
    }

    // Add current user to members if not included
    if (!members.includes(currentUser.uid)) {
      members.push(currentUser.uid);
    }

    const channelData = {
      name: channelName,
      created_by_id: currentUser.uid,
      members,
      ...(options.description && { description: options.description }),
      ...(options.image && { image: options.image }),
      ...(options.private && { private: true }),
    };

    const channel = await channelService.createDistinctChannel(
      'messaging',
      members,
      { name: channelName, data: channelData }
    );

    return channel;
  } catch (error) {
    console.error('Error creating group channel:', error);
    throw error;
  }
};

// Add members to an existing channel
export const addMembersToChannel = async (
  channel: Channel,
  memberIds: string[],
  currentUser: User,
  options: {
    hideHistory?: boolean;
    message?: string;
  } = {}
): Promise<void> => {
  try {
    // Ensure all new members exist
    for (const memberId of memberIds) {
      await ensureUserExists(memberId, currentUser);
    }

    const messageObj = options.message ? {
      text: options.message,
      user_id: currentUser.uid,
    } : undefined;

    await channelService.addMembers(
      channel,
      memberIds,
      messageObj,
      { hide_history: options.hideHistory }
    );
  } catch (error) {
    console.error('Error adding members to channel:', error);
    throw error;
  }
};

// Remove members from channel
export const removeMembersFromChannel = async (
  channel: Channel,
  memberIds: string[],
  currentUser: User,
  message?: string
): Promise<void> => {
  try {
    const messageObj = message ? {
      text: message,
      user_id: currentUser.uid,
    } : undefined;

    await channelService.removeMembers(channel, memberIds, messageObj);
  } catch (error) {
    console.error('Error removing members from channel:', error);
    throw error;
  }
};

// Update channel information
export const updateChannelInfo = async (
  channel: Channel,
  updates: {
    name?: string;
    description?: string;
    image?: string;
  },
  currentUser: User
): Promise<void> => {
  try {
    await channelService.updateChannelPartial(channel, updates);
  } catch (error) {
    console.error('Error updating channel info:', error);
    throw error;
  }
};

// Send a message to a channel
export const sendMessage = async (
  channel: Channel,
  message: MessageOptions
): Promise<any> => {
  try {
    const result = await channel.sendMessage(message);
    console.log('Message sent successfully');
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Get channel members with filtering
export const getChannelMembers = async (
  channel: Channel,
  filters: {
    name?: string;
    role?: string;
    banned?: boolean;
  } = {},
  options: {
    limit?: number;
    offset?: number;
  } = { limit: 100, offset: 0 }
): Promise<any> => {
  try {
    const filter: any = {};
    if (filters.name) filter.name = { $autocomplete: filters.name };
    if (filters.role) filter.channel_role = filters.role;
    if (filters.banned !== undefined) filter.banned = filters.banned;

    const result = await channelService.queryMembers(
      channel,
      filter,
      { created_at: -1 },
      options
    );

    return result;
  } catch (error) {
    console.error('Error getting channel members:', error);
    throw error;
  }
};

// Search channels
export const searchChannels = async (
  currentUserId: string,
  searchQuery: string,
  filters: any = {},
  limit: number = 20
): Promise<Channel[]> => {
  try {
    const filter: any = {
      members: { $in: [currentUserId] },
      ...filters,
    };

    if (searchQuery) {
      filter.name = { $autocomplete: searchQuery };
    }

    const channels = await channelService.queryChannels(
      filter,
      [{ last_message_at: -1 }],
      { limit, watch: true }
    );

    return channels;
  } catch (error) {
    console.error('Error searching channels:', error);
    throw error;
  }
};

// Leave a channel
export const leaveChannel = async (
  channel: Channel,
  userId: string
): Promise<void> => {
  try {
    await channelService.removeMembers(channel, [userId]);
    console.log(`User ${userId} left the channel`);
  } catch (error) {
    console.error('Error leaving channel:', error);
    throw error;
  }
};

// Mute/Unmute a channel
export const muteChannel = async (channel: Channel): Promise<void> => {
  try {
    await channel.mute();
    console.log('Channel muted');
  } catch (error) {
    console.error('Error muting channel:', error);
    throw error;
  }
};

export const unmuteChannel = async (channel: Channel): Promise<void> => {
  try {
    await channel.unmute();
    console.log('Channel unmuted');
  } catch (error) {
    console.error('Error unmuting channel:', error);
    throw error;
  }
};

// Mark channel as read
export const markChannelAsRead = async (channel: Channel): Promise<void> => {
  try {
    await channel.markRead();
    console.log('Channel marked as read');
  } catch (error) {
    console.error('Error marking channel as read:', error);
    throw error;
  }
};

// Get channel unread count
export const getUnreadCount = (channel: Channel): number => {
  try {
    return channel.countUnread();
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Upload file to channel
export const uploadFile = async (
  channel: Channel,
  file: File | string,
  fileName?: string
): Promise<any> => {
  try {
    const result = await channel.sendFile(file, fileName);
    console.log('File uploaded successfully');
    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};
