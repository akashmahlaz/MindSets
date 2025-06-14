// Test script to verify chat functionality
import { channelService } from '../services/channelService';
import {
    createGroupChannel,
    createOrGetDirectChannel,
    getUnreadCount,
    markChannelAsRead,
    searchChannels,
    sendMessage
} from '../services/chatHelpers';
import { chatClient } from '../services/stream';

export class ChatFeatureTest {
  private testUserId = 'test-user-1';
  private testUserId2 = 'test-user-2';
  private testChannelId = 'test-channel-' + Date.now();
  
  async runAllTests() {
    console.log('🚀 Starting comprehensive chat feature tests...');
    
    try {
      await this.testChannelCreation();
      await this.testChannelWatch();
      await this.testChannelQuery();
      await this.testMemberManagement();
      await this.testChannelUpdate();
      await this.testDirectMessaging();
      await this.testGroupChannel();
      await this.testChannelSearch();
      await this.testChannelArchiving();
      await this.testChannelPinning();
      await this.testChannelMuting();
      await this.testMessageOperations();
      await this.testUnreadCounts();
      
      console.log('✅ All chat feature tests completed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Chat feature tests failed:', error);
      return false;
    }
  }

  // Test 1: Channel Creation
  async testChannelCreation() {
    console.log('📝 Testing channel creation...');
    
    const channel = await channelService.createChannelWithId(
      'messaging',
      this.testChannelId,
      {
        name: 'Test Channel',
        members: [this.testUserId, this.testUserId2],
        data: { description: 'A test channel' }
      }
    );
    
    console.log('✅ Channel created successfully:', channel.id);
  }

  // Test 2: Channel Watching
  async testChannelWatch() {
    console.log('👁️ Testing channel watching...');
    
    const channel = await channelService.watchChannel(
      'messaging',
      this.testChannelId + '-watch'
    );
    
    console.log('✅ Channel watched successfully:', channel.id);
  }

  // Test 3: Channel Query
  async testChannelQuery() {
    console.log('🔍 Testing channel query...');
    
    const channels = await channelService.queryChannels(
      { type: 'messaging', members: { $in: [this.testUserId] } },
      [{ last_message_at: -1 }],
      { limit: 10 }
    );
    
    console.log('✅ Channels queried successfully:', channels.length);
  }

  // Test 4: Member Management
  async testMemberManagement() {
    console.log('👥 Testing member management...');
    
    const channel = chatClient.channel('messaging', this.testChannelId);
    
    // Add members
    await channelService.addMembers(
      channel,
      ['test-user-3'],
      { text: 'User 3 joined the channel', user_id: this.testUserId }
    );
    
    // Query members
    const membersResult = await channelService.queryMembers(channel);
    console.log('✅ Members queried:', membersResult.members.length);
    
    // Remove members
    await channelService.removeMembers(
      channel,
      ['test-user-3'],
      { text: 'User 3 left the channel', user_id: this.testUserId }
    );
    
    console.log('✅ Member management completed');
  }

  // Test 5: Channel Update
  async testChannelUpdate() {
    console.log('📝 Testing channel updates...');
    
    const channel = chatClient.channel('messaging', this.testChannelId);
    
    // Full update
    await channelService.updateChannel(
      channel,
      { name: 'Updated Test Channel' }
    );
    
    // Partial update
    await channelService.updateChannelPartial(
      channel,
      { description: 'Updated description' },
      []
    );
    
    console.log('✅ Channel updates completed');
  }

  // Test 6: Direct Messaging
  async testDirectMessaging() {
    console.log('💬 Testing direct messaging...');
    
    const mockUser = {
      uid: this.testUserId,
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    } as any;
    
    const dmChannel = await createOrGetDirectChannel(mockUser, this.testUserId2);
    console.log('✅ Direct message channel created:', dmChannel.id);
  }

  // Test 7: Group Channel
  async testGroupChannel() {
    console.log('👥 Testing group channel creation...');
    
    const mockUser = {
      uid: this.testUserId,
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null
    } as any;
    
    const groupChannel = await createGroupChannel(
      'Test Group',
      [this.testUserId, this.testUserId2, 'test-user-3'],
      mockUser,
      { description: 'A test group channel' }
    );
    
    console.log('✅ Group channel created:', groupChannel.id);
  }

  // Test 8: Channel Search
  async testChannelSearch() {
    console.log('🔍 Testing channel search...');
    
    const searchResults = await searchChannels(
      this.testUserId,
      'Test',
      { type: 'messaging' },
      10
    );
    
    console.log('✅ Channel search completed:', searchResults.length);
  }

  // Test 9: Channel Archiving
  async testChannelArchiving() {
    console.log('📦 Testing channel archiving...');
    
    const channel = chatClient.channel('messaging', this.testChannelId);
    
    await channelService.archiveChannel(channel);
    console.log('✅ Channel archived');
    
    await channelService.unarchiveChannel(channel);
    console.log('✅ Channel unarchived');
  }

  // Test 10: Channel Pinning
  async testChannelPinning() {
    console.log('📌 Testing channel pinning...');
    
    const channel = chatClient.channel('messaging', this.testChannelId);
    
    await channelService.pinChannel(channel);
    console.log('✅ Channel pinned');
    
    await channelService.unpinChannel(channel);
    console.log('✅ Channel unpinned');
  }

  // Test 11: Channel Muting
  async testChannelMuting() {
    console.log('🔇 Testing channel muting...');
    
    const channel = chatClient.channel('messaging', this.testChannelId);
    
    await channel.mute();
    console.log('✅ Channel muted');
    
    await channel.unmute();
    console.log('✅ Channel unmuted');
  }

  // Test 12: Message Operations
  async testMessageOperations() {
    console.log('📤 Testing message operations...');
    
    const channel = chatClient.channel('messaging', this.testChannelId);
    
    // Send a message
    const message = await sendMessage(channel, {
      text: 'This is a test message',
      user_id: this.testUserId
    });
    
    console.log('✅ Message sent:', message.message.id);
    
    // Send a message with attachments
    await sendMessage(channel, {
      text: 'Message with mention',
      mentioned_users: [this.testUserId2],
      user_id: this.testUserId
    });
    
    console.log('✅ Message with mention sent');
  }

  // Test 13: Unread Counts
  async testUnreadCounts() {
    console.log('📊 Testing unread counts...');
    
    const channel = chatClient.channel('messaging', this.testChannelId);
    
    const unreadCount = getUnreadCount(channel);
    console.log('✅ Unread count:', unreadCount);
    
    await markChannelAsRead(channel);
    console.log('✅ Channel marked as read');
  }

  // Cleanup test data
  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Note: In a real implementation, you might want to delete test channels
      // For now, we'll just log the cleanup
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.log('⚠️ Cleanup failed:', error);
    }
  }
}

// Usage example:
// const chatTest = new ChatFeatureTest();
// chatTest.runAllTests().then(success => {
//   if (success) {
//     console.log('All tests passed!');
//   } else {
//     console.log('Some tests failed!');
//   }
//   chatTest.cleanup();
// });

export default ChatFeatureTest;
