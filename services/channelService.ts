// Channel Management Service following Stream Chat best practices
import { Channel, StreamChat } from "stream-chat";
import { chatClient } from "./stream";

export interface CreateChannelOptions {
  members?: string[];
  name?: string;
  image?: string;
  data?: Record<string, any>;
  hideHistory?: boolean;
}

export interface UpdateChannelOptions {
  name?: string;
  image?: string;
  data?: Record<string, any>;
}

export interface ChannelMemberData {
  user_id: string;
  channel_role?: string;
  [key: string]: any;
}

/**
 * Channel Management Service
 * Implements Stream Chat best practices for channel operations
 */
export class ChannelService {
  private client: StreamChat;

  constructor(client: StreamChat) {
    this.client = client;
  }

  // 1. Creating Channels Using Channel ID
  async createChannelWithId(
    channelType: string,
    channelId: string,
    options: CreateChannelOptions = {},
  ): Promise<Channel> {
    try {
      const channel = this.client.channel(channelType, channelId, {
        members: options.members,
        ...options.data,
      });

      await channel.create();
      console.log(`Channel created with ID: ${channelId}`);
      return channel;
    } catch (error) {
      console.error("Error creating channel with ID:", error);
      throw error;
    }
  }

  // 2. Creating Distinct Channels for Direct Messages
  async createDistinctChannel(
    channelType: string = "messaging",
    members: string[],
    options: CreateChannelOptions = {},
  ): Promise<Channel> {
    try {
      const channel = this.client.channel(channelType, undefined, {
        members,
        ...options.data,
      });

      await channel.create();
      console.log(
        `Distinct channel created for members: ${members.join(", ")}`,
      );
      return channel;
    } catch (error) {
      console.error("Error creating distinct channel:", error);
      throw error;
    }
  }

  // 3. Watching a Channel (creates if doesn't exist)
  async watchChannel(
    channelType: string,
    channelId: string,
    options: CreateChannelOptions = {},
  ): Promise<Channel> {
    try {
      const channel = this.client.channel(channelType, channelId, {
        members: options.members,
        ...options.data,
      });

      const state = await channel.watch();
      console.log(`Channel watched: ${channelId}`, {
        members: state.members,
        watchers: Object.keys(state.watchers || {}).length,
      });

      return channel;
    } catch (error) {
      console.error("Error watching channel:", error);
      throw error;
    }
  }

  // 4. Query Multiple Channels
  async queryChannels(
    filter: Record<string, any> = {},
    sort: Record<string, number>[] = [{ last_message_at: -1 }],
    options: Record<string, any> = { watch: true, state: true },
  ): Promise<Channel[]> {
    try {
      const channels = await this.client.queryChannels(filter, sort, options);
      console.log(`Queried ${channels.length} channels`);
      return channels;
    } catch (error) {
      console.error("Error querying channels:", error);
      throw error;
    }
  }

  // 5. Update Channel (Full Update)
  async updateChannel(
    channel: Channel,
    data: Partial<Record<string, any>>,
    message?: { text: string; user_id?: string },
  ): Promise<void> {
    try {
      await channel.update(data, message);
      console.log("Channel updated successfully");
    } catch (error) {
      console.error("Error updating channel:", error);
      throw error;
    }
  }

  // 6. Partial Update Channel
  async updateChannelPartial(
    channel: Channel,
    set: Record<string, any> = {},
    unset: string[] = [],
  ): Promise<void> {
    try {
      const updateData: any = {};
      if (Object.keys(set).length > 0) updateData.set = set;
      if (unset.length > 0) updateData.unset = unset;

      await channel.updatePartial(updateData);
      console.log("Channel partially updated successfully");
    } catch (error) {
      console.error("Error partially updating channel:", error);
      throw error;
    }
  }

  // 7. Add Members to Channel
  async addMembers(
    channel: Channel,
    members: (string | ChannelMemberData)[],
    message?: { text: string; user_id?: string },
    options: { hide_history?: boolean } = {},
  ): Promise<void> {
    try {
      await channel.addMembers(members, message, options);
      console.log(`Added ${members.length} members to channel`);
    } catch (error) {
      console.error("Error adding members:", error);
      throw error;
    }
  }

  // 8. Remove Members from Channel
  async removeMembers(
    channel: Channel,
    members: string[],
    message?: { text: string; user_id?: string },
  ): Promise<void> {
    try {
      await channel.removeMembers(members, message);
      console.log(`Removed ${members.length} members from channel`);
    } catch (error) {
      console.error("Error removing members:", error);
      throw error;
    }
  }

  // 9. Add Moderators
  async addModerators(channel: Channel, moderators: string[]): Promise<void> {
    try {
      await channel.addModerators(moderators);
      console.log(`Added ${moderators.length} moderators to channel`);
    } catch (error) {
      console.error("Error adding moderators:", error);
      throw error;
    }
  }

  // 10. Remove Moderators
  async demoteModerators(
    channel: Channel,
    moderators: string[],
  ): Promise<void> {
    try {
      await channel.demoteModerators(moderators);
      console.log(`Removed ${moderators.length} moderators from channel`);
    } catch (error) {
      console.error("Error removing moderators:", error);
      throw error;
    }
  }

  // 11. Query Channel Members
  async queryMembers(
    channel: Channel,
    filter: Record<string, any> = {},
    sort: Record<string, number> = { created_at: -1 },
    options: Record<string, any> = { limit: 100 },
  ): Promise<any> {
    try {
      const result = await channel.queryMembers(filter, sort, options);
      console.log(`Queried ${result.members.length} members`);
      return result;
    } catch (error) {
      console.error("Error querying members:", error);
      throw error;
    }
  }

  // 12. Update Member Partial
  async updateMemberPartial(
    channel: Channel,
    userId: string,
    set: Record<string, any> = {},
    unset: string[] = [],
  ): Promise<void> {
    try {
      const updateData: any = {};
      if (Object.keys(set).length > 0) updateData.set = set;
      if (unset.length > 0) updateData.unset = unset;

      await channel.updateMemberPartial(updateData, { userId });
      console.log(`Updated member ${userId} successfully`);
    } catch (error) {
      console.error("Error updating member:", error);
      throw error;
    }
  }

  // 13. Archive Channel
  async archiveChannel(channel: Channel): Promise<void> {
    try {
      await channel.archive();
      console.log("Channel archived successfully");
    } catch (error) {
      console.error("Error archiving channel:", error);
      throw error;
    }
  }

  // 14. Unarchive Channel
  async unarchiveChannel(channel: Channel): Promise<void> {
    try {
      await channel.unarchive();
      console.log("Channel unarchived successfully");
    } catch (error) {
      console.error("Error unarchiving channel:", error);
      throw error;
    }
  }

  // 15. Pin Channel
  async pinChannel(channel: Channel): Promise<void> {
    try {
      await channel.pin();
      console.log("Channel pinned successfully");
    } catch (error) {
      console.error("Error pinning channel:", error);
      throw error;
    }
  }

  // 16. Unpin Channel
  async unpinChannel(channel: Channel): Promise<void> {
    try {
      await channel.unpin();
      console.log("Channel unpinned successfully");
    } catch (error) {
      console.error("Error unpinning channel:", error);
      throw error;
    }
  }

  // 17. Stop Watching Channel
  async stopWatchingChannel(channel: Channel): Promise<void> {
    try {
      await channel.stopWatching();
      console.log("Stopped watching channel");
    } catch (error) {
      console.error("Error stopping channel watch:", error);
      throw error;
    }
  }

  // 18. Get Channel Watchers
  async getChannelWatchers(
    channel: Channel,
    options: { limit?: number; offset?: number } = { limit: 5, offset: 0 },
  ): Promise<any> {
    try {
      const result = await channel.query({
        watchers: options,
      });
      console.log(`Retrieved ${result.watchers?.length || 0} watchers`);
      return result.watchers;
    } catch (error) {
      console.error("Error getting channel watchers:", error);
      throw error;
    }
  }

  // 19. Helper: Create Direct Message Channel
  async createDirectMessageChannel(
    currentUserId: string,
    targetUserId: string,
    options: CreateChannelOptions = {},
  ): Promise<Channel> {
    try {
      // Create deterministic channel ID
      const members = [currentUserId, targetUserId].sort();
      const channelId = `dm-${members.join("-")}`;

      const channel = this.client.channel("messaging", channelId, {
        members,
        created_by_id: currentUserId,
        ...options.data,
      });

      await channel.watch();
      console.log(`Direct message channel created: ${channelId}`);
      return channel;
    } catch (error) {
      console.error("Error creating direct message channel:", error);
      throw error;
    }
  }

  // 20. Helper: Get User's Channels
  async getUserChannels(
    userId: string,
    channelType: string = "messaging",
    options: {
      archived?: boolean;
      pinned?: boolean;
      limit?: number;
    } = {},
  ): Promise<Channel[]> {
    try {
      const filter: any = {
        type: channelType,
        members: { $in: [userId] },
      };

      if (options.archived !== undefined) {
        filter.archived = options.archived;
      }

      if (options.pinned !== undefined) {
        filter.pinned = options.pinned;
      }

      const sort = [{ last_message_at: -1 }];
      const queryOptions = {
        watch: true,
        state: true,
        limit: options.limit || 20,
      };

      const channels = await this.client.queryChannels(
        filter,
        sort,
        queryOptions,
      );
      console.log(`Retrieved ${channels.length} channels for user ${userId}`);
      return channels;
    } catch (error) {
      console.error("Error getting user channels:", error);
      throw error;
    }
  }
}

// Create singleton instance
export const channelService = new ChannelService(chatClient);

// Export commonly used functions
export const {
  createChannelWithId,
  createDistinctChannel,
  watchChannel,
  queryChannels,
  updateChannel,
  updateChannelPartial,
  addMembers,
  removeMembers,
  addModerators,
  demoteModerators,
  queryMembers,
  updateMemberPartial,
  archiveChannel,
  unarchiveChannel,
  pinChannel,
  unpinChannel,
  stopWatchingChannel,
  getChannelWatchers,
  createDirectMessageChannel,
  getUserChannels,
} = channelService;
