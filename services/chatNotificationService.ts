import { Event } from "stream-chat";
import { getUsersPushTokens } from "../services/userService";

/**
 * Service to handle push notifications for chat messages
 */
export class ChatNotificationService {
  private static instance: ChatNotificationService;
  private processedMessages = new Set<string>();

  static getInstance(): ChatNotificationService {
    if (!ChatNotificationService.instance) {
      ChatNotificationService.instance = new ChatNotificationService();
    }
    return ChatNotificationService.instance;
  }

  // Store the current user ID for filtering
  private currentLoggedInUserId: string | null = null;

  /**
   * Set the current logged-in user ID for filtering self notifications
   */
  setCurrentUserId(userId: string | null): void {
    this.currentLoggedInUserId = userId;
  }

  /**
   * Handle new message event and send push notifications
   */
  async handleNewMessage(event: Event): Promise<void> {
    try {
      // Only handle new messages, not our own messages
      if (event.type !== "message.new" || !event.message || !event.user) {
        return;
      }
      const message = event.message;
      const sender = event.user;
      const channel = event.channel;
      const channelId = channel?.id || event.channel_id || message.cid;

      if (!channelId) {
        return;
      }

      // Get the sender ID from the message
      const senderId = sender.id || event.message.user?.id;
      if (!senderId) {
        return;
      }

      // CRITICAL FIX: Don't send notifications if the current logged-in user is the sender
      // This prevents the sender from receiving their own notification
      if (this.currentLoggedInUserId && senderId === this.currentLoggedInUserId) {
        return;
      }

      // Prevent duplicate processing
      const messageKey = `${message.id}_${channelId}_${senderId}`;
      if (this.processedMessages.has(messageKey)) {
        console.log("⚠️ Skipping duplicate message processing:", messageKey);
        return;
      }
      this.processedMessages.add(messageKey);

      // Clean up old processed messages (keep only last 1000)
      if (this.processedMessages.size > 1000) {
        const messagesToDelete = Array.from(this.processedMessages).slice(
          0,
          500,
        );
        messagesToDelete.forEach((msg) => this.processedMessages.delete(msg));
      }

      // Get channel members - try different properties
      let memberIds: string[] = [];

      if (channel?.members && typeof channel.members === "object") {
        // Stream Chat format: members is an object with user IDs as keys
        memberIds = Object.keys(channel.members);
        console.log("📋 Found members from channel.members object:", memberIds);
      } else if (event.channel_id) {
        // For direct messages, we can infer from channel ID
        const inferredIds = this.extractUserIdsFromChannelId(event.channel_id);
        if (inferredIds.length > 0) {
          memberIds = inferredIds;
          console.log("📋 Inferred members from event.channel_id:", memberIds);
        }
      } else if (channelId) {
        // Try to infer from the resolved channel ID
        const inferredIds = this.extractUserIdsFromChannelId(channelId);
        if (inferredIds.length > 0) {
          memberIds = inferredIds;
          console.log("📋 Inferred members from channelId:", memberIds);
        }
      }

      console.log("👥 Channel members analysis:", {
        totalMembers: memberIds.length,
        allMembers: memberIds,
        currentUserId: this.currentLoggedInUserId,
        channelId: channel?.id,
        channelType: channel?.type,
      });

      // Filter out the current user (sender)
      const membersToNotify = memberIds.filter(
        (memberId) => memberId !== this.currentLoggedInUserId,
      );

      console.log("🎯 Members to notify after filtering:", {
        membersToNotify,
        filteredOutSender: this.currentLoggedInUserId,
      });

      if (membersToNotify.length === 0) {
        console.log(
          "❌ No other members to notify in channel:",
          channel?.id || "unknown",
        );
        return;
      } // Get push tokens for all members
      console.log("🔍 Getting push tokens for members:", membersToNotify);
      const userTokens = await getUsersPushTokens(membersToNotify);

      console.log("🎫 Retrieved push tokens:", {
        requestedForUsers: memberIds,
        tokensFound: userTokens.length,
        tokens: userTokens.map((ut) => ({
          userId: ut.userId,
          tokenLength: ut.token.length,
        })),
      });

      if (userTokens.length === 0) {
        console.log("❌ No push tokens found for channel members");
        return;
      } // Prepare notification payload
      const notificationTitle = sender.name || "New Message";
      const notificationBody = this.getMessagePreview(message.text || "");
      const channelName = this.getChannelDisplayName(channel, this.currentLoggedInUserId);
      const notificationPayload = {
        tokens: userTokens.map((ut) => ut.token),
        title: channelName
          ? `${notificationTitle} in ${channelName}`
          : notificationTitle,
        body: notificationBody,
        data: {
          type: "chat_message",
          channelId: channelId || "",
          channelType: channel?.type || "messaging",
          messageId: message.id || "",
          senderId: this.currentLoggedInUserId || senderId,
          senderName: sender.name || "Unknown",
          timestamp: Date.now().toString(),
        },
      };

      console.log("📤 Sending notification payload:", {
        title: notificationPayload.title,
        body: notificationPayload.body,
        tokenCount: notificationPayload.tokens.length,
        data: notificationPayload.data,
      });

      // Send notifications
      await this.sendChatNotifications(notificationPayload);
      console.log(
        `✅ Sent chat notification to ${userTokens.length} users for message in channel ${channelId || "unknown"}`,
      );
    } catch (error) {
      console.error("Error handling new message for notifications:", error);
    }
  }

  /**
   * Send push notifications for chat messages
   */ private async sendChatNotifications(params: {
    tokens: string[];
    title: string;
    body: string;
    data: Record<string, string>;
  }): Promise<void> {
    try {
      console.log("🌐 Making API call to /api/push-notification");
      console.log("📦 Request payload:", {
        tokenCount: params.tokens.length,
        title: params.title,
        body: params.body,
        data: params.data,
        channelId: "chat_messages",
      });

      const response = await fetch("/api/push-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokens: params.tokens,
          title: params.title,
          body: params.body,
          data: params.data,
          channelId: "chat_messages",
        }),
      });

      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Response error:", errorText);
        throw new Error(
          `API request failed: ${response.status} - ${errorText}`,
        );
      }

      const result = await response.json();
      console.log("📊 API Response result:", result);

      if (!result.success) {
        console.error("❌ Failed to send chat notifications:", result.error);
      } else {
        console.log(
          `✅ Chat notifications sent successfully: ${result.successCount || "N/A"} success, ${result.failureCount || "N/A"} failed`,
        );
      }
    } catch (error) {
      console.error("❌ Error sending chat notifications:", error);
    }
  }

  /**
   * Get a preview of the message text
   */
  private getMessagePreview(text: string): string {
    if (!text) return "Sent a message";

    // Truncate long messages
    const maxLength = 100;
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }

    return text;
  } /**
   * Get display name for the channel
   */
  private getChannelDisplayName(channel: any, currentUserId: string | null): string {
    try {
      // If no channel object, return fallback
      if (!channel) {
        return "Chat";
      }

      // For direct messages, show the other user's name
      if (channel.type === "messaging" && channel.members && currentUserId) {
        const otherMembers = Object.values(channel.members).filter(
          (member: any) => member?.user?.id !== currentUserId,
        );

        if (otherMembers.length === 1) {
          const otherMember = otherMembers[0] as any;
          return otherMember?.user?.name || "Direct Message";
        }
      }

      // For group channels, use channel name or member count
      if (channel.name) {
        return channel.name;
      }

      const memberCount = Object.keys(channel.members || {}).length;
      if (memberCount > 0) {
        return `Group Chat (${memberCount} members)`;
      }

      return "Chat";
    } catch (error) {
      console.error("Error getting channel display name:", error);
      return "Chat";
    }
  }

  /**
   * Handle typing events (optional - for typing indicators)
   */
  async handleTypingStart(event: Event): Promise<void> {
    // You can implement typing notifications here if needed
    // For now, we'll skip this to avoid too many notifications
    console.log("Typing started:", event.user?.name);
  }
  /**
   * Handle user joining channel
   */
  async handleMemberAdded(event: Event): Promise<void> {
    // You can implement member added notifications here if needed
    console.log("Member added to channel:", event.user?.name);
  }

  /**
   * Extract user IDs from channel ID, filtering out prefixes like "dm"
   */
  private extractUserIdsFromChannelId(channelId: string): string[] {
    if (!channelId || !channelId.includes("-")) {
      return [];
    }

    const parts = channelId.split("-");

    if (parts[0] === "dm" && parts.length >= 3) {
      // Format: "dm-userId1-userId2" - remove the "dm" prefix
      return parts.slice(1).filter((part) => part && part !== "dm");
    } else if (parts.length === 2) {
      // Format: "userId1-userId2"
      return parts.filter((part) => part && part !== "dm");
    }

    // For other formats, filter out common prefixes
    return parts.filter((part) => part && part !== "dm" && part !== "channel");
  }
}

// Export singleton instance
export const chatNotificationService = ChatNotificationService.getInstance();
