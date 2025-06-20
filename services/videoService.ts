import { Call, StreamVideoClient } from "@stream-io/video-react-native-sdk";

export interface CallOptions {
  isVideo?: boolean;
  ring?: boolean;
  notify?: boolean;
  custom?: Record<string, any>;
}

export interface CreateCallParams {
  callId: string;
  members: string[];
  currentUserId: string;
  options?: CallOptions;
}

export class VideoCallService {
  private client: StreamVideoClient;

  constructor(client: StreamVideoClient) {
    this.client = client;
  }

  /**
   * Create a new call with ringing functionality
   */
  async createCall({
    callId,
    members,
    currentUserId,
    options = {},
  }: CreateCallParams): Promise<Call | null> {
    try {
      const call = this.client.call("default", callId);

      // Include current user in members
      const allMembers = [
        { user_id: currentUserId },
        ...members.map((memberId) => ({ user_id: memberId })),
      ];

      await call.getOrCreate({
        ring: options.ring ?? true,
        video: options.isVideo ?? true,
        notify: options.notify ?? false,
        data: {
          members: allMembers,
          custom: {
            isVideo: options.isVideo ?? true,
            createdAt: new Date().toISOString(),
            ...options.custom,
          },
        },
      });

      return call;
    } catch (error) {
      console.error("Error creating call:", error);
      throw error;
    }
  }

  /**
   * Join an existing call
   */
  async joinCall(callType: string, callId: string): Promise<Call | null> {
    try {
      const call = this.client.call(callType, callId);
      await call.join();
      return call;
    } catch (error) {
      console.error("Error joining call:", error);
      throw error;
    }
  }

  /**
   * Get an existing call without joining
   */
  async getCall(callType: string, callId: string): Promise<Call | null> {
    try {
      const call = this.client.call(callType, callId);
      await call.get();
      return call;
    } catch (error) {
      console.error("Error getting call:", error);
      throw error;
    }
  }

  /**
   * Leave a call
   */
  async leaveCall(
    call: Call,
    reject?: boolean,
    reason?: string,
  ): Promise<void> {
    try {
      if (reject) {
        await call.leave({ reject: true, reason });
      } else {
        await call.leave();
      }
    } catch (error) {
      console.error("Error leaving call:", error);
      throw error;
    }
  }

  /**
   * End a call (requires special permission)
   */
  async endCall(call: Call): Promise<void> {
    try {
      await call.endCall();
    } catch (error) {
      console.error("Error ending call:", error);
      throw error;
    }
  }
  /**
   * Generate a unique call ID that fits within 64 character limit
   */
  generateCallId(prefix: string = "call"): string {
    // Use base36 timestamp (shorter) and random string
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
  }
  /**
   * Generate a short call ID for direct calls between two users
   */
  generateDirectCallId(userId1: string, userId2: string): string {
    // Take first 8 characters of each user ID and add timestamp
    const user1Short = userId1.substring(0, 8);
    const user2Short = userId2.substring(0, 8);
    const timestamp = Date.now().toString(36); // Base36 is shorter
    const callId = `${user1Short}-${user2Short}-${timestamp}`;

    // Ensure it's under 64 characters
    if (callId.length > 64) {
      // Fallback to even shorter format
      const shortTimestamp = timestamp.substring(0, 6);
      return `${user1Short.substring(0, 6)}-${user2Short.substring(0, 6)}-${shortTimestamp}`;
    }

    return callId;
  }
  /**
   * Create a 1-1 call between two users
   */
  async createDirectCall(
    currentUserId: string,
    targetUserId: string,
    isVideo: boolean = true,
  ): Promise<Call | null> {
    const callId = this.generateDirectCallId(currentUserId, targetUserId);

    return this.createCall({
      callId,
      members: [targetUserId],
      currentUserId,
      options: {
        isVideo,
        ring: true,
        custom: {
          callType: "direct",
          participants: [currentUserId, targetUserId],
        },
      },
    });
  }

  /**
   * Create a group call with multiple users
   */
  async createGroupCall(
    currentUserId: string,
    memberIds: string[],
    isVideo: boolean = true,
    groupName?: string,
  ): Promise<Call | null> {
    const callId = this.generateCallId("group");

    return this.createCall({
      callId,
      members: memberIds,
      currentUserId,
      options: {
        isVideo,
        ring: true,
        custom: {
          callType: "group",
          groupName,
          participants: [currentUserId, ...memberIds],
        },
      },
    });
  }
}

/**
 * Utility functions for call management
 */
export const callUtils = {
  /**
   * Check if a call is ringing
   */
  isRinging: (call: Call): boolean => {
    return call.ringing;
  },
  /**
   * Check if current user created the call
   */
  isCallCreatedByUser: (call: Call, userId: string): boolean => {
    return call.isCreatedByMe || call.state.createdBy?.id === userId;
  },

  /**
   * Get call duration in milliseconds
   */
  getCallDuration: (call: Call): number => {
    const startedAt = call.state.startedAt;
    if (!startedAt) return 0;
    return Date.now() - new Date(startedAt).getTime();
  },

  /**
   * Format call duration as human readable string
   */
  formatCallDuration: (durationMs: number): string => {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
  },
  /**
   * Check if call is audio only
   */
  isAudioOnlyCall: (call: Call): boolean => {
    return call.state.custom?.isVideo === false;
  },

  /**
   * Get call participants count
   */
  getParticipantCount: (call: Call): number => {
    return call.state.participants?.length || 0;
  },
};
