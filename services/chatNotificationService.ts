import { Event } from 'stream-chat';
import { getUsersPushTokens } from '../services/userService';

/**
 * Service to handle push notifications for chat messages
 */
export class ChatNotificationService {
  private static instance: ChatNotificationService;

  static getInstance(): ChatNotificationService {
    if (!ChatNotificationService.instance) {
      ChatNotificationService.instance = new ChatNotificationService();
    }
    return ChatNotificationService.instance;
  }
  /**
   * Handle new message event and send push notifications
   */
  async handleNewMessage(event: Event): Promise<void> {
    try {
      // Only handle new messages, not our own messages
      if (event.type !== 'message.new' || !event.message || !event.user) {
        return;
      }

      const message = event.message;
      const sender = event.user;
      const channel = event.channel;

      // Don't send notifications for our own messages
      const currentUserId = event.message.user?.id;
      if (!currentUserId || !channel?.members) {
        return;
      }

      // Get all channel members except the sender
      const memberIds = Object.keys(channel.members).filter(
        memberId => memberId !== currentUserId
      );

      if (memberIds.length === 0) {
        console.log('No other members to notify in channel:', channel.id);
        return;
      }

      // Get push tokens for all members
      const userTokens = await getUsersPushTokens(memberIds);
      
      if (userTokens.length === 0) {
        console.log('No push tokens found for channel members');
        return;
      }

      // Prepare notification payload
      const notificationTitle = sender.name || 'New Message';
      const notificationBody = this.getMessagePreview(message.text || '');
      const channelName = this.getChannelDisplayName(channel, currentUserId);

      // Send notifications
      await this.sendChatNotifications({
        tokens: userTokens.map(ut => ut.token),
        title: channelName ? `${notificationTitle} in ${channelName}` : notificationTitle,
        body: notificationBody,
        data: {
          type: 'chat_message',
          channelId: channel.id || '',
          channelType: channel.type || 'messaging',
          messageId: message.id || '',
          senderId: currentUserId,
          senderName: sender.name || 'Unknown',
          timestamp: Date.now().toString(),
        },
      });

      console.log(`📱 Sent chat notification to ${userTokens.length} users for message in channel ${channel.id}`);
    } catch (error) {
      console.error('Error handling new message for notifications:', error);
    }
  }

  /**
   * Send push notifications for chat messages
   */
  private async sendChatNotifications(params: {
    tokens: string[];
    title: string;
    body: string;
    data: Record<string, string>;
  }): Promise<void> {
    try {
      const response = await fetch('/api/push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokens: params.tokens,
          title: params.title,
          body: params.body,
          data: params.data,
          channelId: 'chat_messages',
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        console.error('Failed to send chat notifications:', result.error);
      } else {
        console.log(`✅ Chat notifications sent: ${result.successCount} success, ${result.failureCount} failed`);
      }
    } catch (error) {
      console.error('Error sending chat notifications:', error);
    }
  }

  /**
   * Get a preview of the message text
   */
  private getMessagePreview(text: string): string {
    if (!text) return 'Sent a message';
    
    // Truncate long messages
    const maxLength = 100;
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    
    return text;
  }
  /**
   * Get display name for the channel
   */
  private getChannelDisplayName(channel: any, currentUserId: string): string {
    try {
      // For direct messages, show the other user's name
      if (channel.type === 'messaging' && channel.members) {
        const otherMembers = Object.values(channel.members).filter(
          (member: any) => member.user?.id !== currentUserId
        );
        
        if (otherMembers.length === 1) {
          const otherMember = otherMembers[0] as any;
          return otherMember.user?.name || 'Direct Message';
        }
      }
      
      // For group channels, use channel name or member count
      if (channel.name) {
        return channel.name;
      }
      
      const memberCount = Object.keys(channel.members || {}).length;
      return `Group Chat (${memberCount} members)`;
    } catch (error) {
      console.error('Error getting channel display name:', error);
      return 'Chat';
    }
  }

  /**
   * Handle typing events (optional - for typing indicators)
   */
  async handleTypingStart(event: Event): Promise<void> {
    // You can implement typing notifications here if needed
    // For now, we'll skip this to avoid too many notifications
    console.log('Typing started:', event.user?.name);
  }

  /**
   * Handle user joining channel
   */
  async handleMemberAdded(event: Event): Promise<void> {
    // You can implement member added notifications here if needed
    console.log('Member added to channel:', event.user?.name);
  }
}

// Export singleton instance
export const chatNotificationService = ChatNotificationService.getInstance();
