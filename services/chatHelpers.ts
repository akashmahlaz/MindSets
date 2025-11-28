import { getAuth, User } from "firebase/auth";
import { Channel } from "stream-chat";
import { app } from "../firebaseConfig";
import { channelService } from "./channelService";
import { chatClient } from "./stream";

const auth = getAuth(app);

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

// Ensure target user exists in Stream via server-side function
export const ensureTargetUserExists = async (
  targetUserId: string,
): Promise<boolean> => {
  try {
    console.log(`Ensuring user ${targetUserId} exists in Stream Chat via server...`);
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No current user for auth");
      return false;
    }

    const idToken = await currentUser.getIdToken();
    
    const response = await fetch(
      "https://us-central1-mental-health-f7b7f.cloudfunctions.net/ensureStreamUser",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ targetUserId }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to ensure user exists:", errorData);
      return false;
    }

    const data = await response.json();
    console.log(`✅ User ${targetUserId} verified/created in Stream:`, data.message);
    return true;
  } catch (error) {
    console.error(`Failed to ensure user ${targetUserId} exists:`, error);
    return false;
  }
};

// Check if a user exists in Stream and create if not (legacy - now uses server-side)
export const ensureUserExists = async (
  userId: string,
  currentUser: User,
): Promise<boolean> => {
  return ensureTargetUserExists(userId);
};

// Create or get a direct message channel between two users
export const createOrGetDirectChannel = async (
  currentUser: User,
  targetUserId: string,
): Promise<Channel> => {
  try {
    console.log(
      `Creating/getting direct channel between ${currentUser.uid} and ${targetUserId}`,
    );

    // First ensure target user exists in Stream via server-side
    const userExists = await ensureTargetUserExists(targetUserId);
    if (!userExists) {
      console.warn("Could not verify target user exists, attempting channel creation anyway");
    }

    // Create a sorted channel ID for consistency
    const channelId = [currentUser.uid, targetUserId].sort().join("-");

    console.log("Channel ID:", channelId);

    // Try to create/get the channel directly
    const channel = chatClient.channel("messaging", channelId, {
      members: [currentUser.uid, targetUserId],
      created_by_id: currentUser.uid,
    });

    // Watch the channel (this creates it if it doesn't exist)
    await channel.watch();

    console.log("✅ Channel created/watched successfully:", channelId);
    return channel;
  } catch (error) {
    console.error("Error creating/getting direct channel:", error);
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
  } = {},
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
      "messaging",
      members,
      { name: channelName, data: channelData },
    );

    return channel;
  } catch (error) {
    console.error("Error creating group channel:", error);
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
  } = {},
): Promise<void> => {
  try {
    // Ensure all new members exist
    for (const memberId of memberIds) {
      await ensureUserExists(memberId, currentUser);
    }

    const messageObj = options.message
      ? {
          text: options.message,
          user_id: currentUser.uid,
        }
      : undefined;

    await channelService.addMembers(channel, memberIds, messageObj, {
      hide_history: options.hideHistory,
    });
  } catch (error) {
    console.error("Error adding members to channel:", error);
    throw error;
  }
};

// Remove members from channel
export const removeMembersFromChannel = async (
  channel: Channel,
  memberIds: string[],
  currentUser: User,
  message?: string,
): Promise<void> => {
  try {
    const messageObj = message
      ? {
          text: message,
          user_id: currentUser.uid,
        }
      : undefined;

    await channelService.removeMembers(channel, memberIds, messageObj);
  } catch (error) {
    console.error("Error removing members from channel:", error);
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
  currentUser: User,
): Promise<void> => {
  try {
    await channelService.updateChannelPartial(channel, updates);
  } catch (error) {
    console.error("Error updating channel info:", error);
    throw error;
  }
};

// Send a message to a channel
export const sendMessage = async (
  channel: Channel,
  message: MessageOptions,
): Promise<any> => {
  try {
    const result = await channel.sendMessage(message);
    console.log("Message sent successfully");
    return result;
  } catch (error) {
    console.error("Error sending message:", error);
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
  } = { limit: 100, offset: 0 },
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
      options,
    );

    return result;
  } catch (error) {
    console.error("Error getting channel members:", error);
    throw error;
  }
};

// Search channels
export const searchChannels = async (
  currentUserId: string,
  searchQuery: string,
  filters: any = {},
  limit: number = 20,
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
      { limit, watch: true },
    );

    return channels;
  } catch (error) {
    console.error("Error searching channels:", error);
    throw error;
  }
};

// Leave a channel
export const leaveChannel = async (
  channel: Channel,
  userId: string,
): Promise<void> => {
  try {
    await channelService.removeMembers(channel, [userId]);
    console.log(`User ${userId} left the channel`);
  } catch (error) {
    console.error("Error leaving channel:", error);
    throw error;
  }
};

// Mute/Unmute a channel
export const muteChannel = async (channel: Channel): Promise<void> => {
  try {
    await channel.mute();
    console.log("Channel muted");
  } catch (error) {
    console.error("Error muting channel:", error);
    throw error;
  }
};

export const unmuteChannel = async (channel: Channel): Promise<void> => {
  try {
    await channel.unmute();
    console.log("Channel unmuted");
  } catch (error) {
    console.error("Error unmuting channel:", error);
    throw error;
  }
};

// Mark channel as read
export const markChannelAsRead = async (channel: Channel): Promise<void> => {
  try {
    await channel.markRead();
    console.log("Channel marked as read");
  } catch (error) {
    console.error("Error marking channel as read:", error);
    throw error;
  }
};

// Get channel unread count
export const getUnreadCount = (channel: Channel): number => {
  try {
    return channel.countUnread();
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};

// Upload file to channel
export const uploadFile = async (
  channel: Channel,
  file: File | string,
  fileName?: string,
): Promise<any> => {
  try {
    const result = await channel.sendFile(file, fileName);
    console.log("File uploaded successfully");
    return result;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
