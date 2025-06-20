# User Messaging Guide 📱💬

This guide explains how users can send messages to each other using your comprehensive chat messaging system powered by Stream Chat.

## 🚀 Quick Start - How to Send Messages

### 1. Starting a Direct Message (1-on-1 Chat)

Users can start direct conversations with other users in several ways:

#### From User Profile/Contact List

```typescript
// Example: Starting a DM from a user profile
import { createOrGetDirectChannel } from "@/services/chatHelpers";

const startDirectMessage = async (otherUserId: string) => {
  try {
    // This automatically creates or gets an existing DM channel
    const channel = await createOrGetDirectChannel(currentUser, otherUserId);

    // Navigate to the chat screen
    router.push(`/chat/${channel.id}`);
  } catch (error) {
    Alert.alert("Error", "Failed to start conversation");
  }
};
```

#### From Search or User Directory

Users can search for other users and start conversations:

```typescript
// Search for users and start DM
const searchAndMessage = async (searchQuery: string) => {
  const users = await chatClient.queryUsers({
    name: { $autocomplete: searchQuery },
  });

  // User selects someone from search results
  const selectedUser = users[0];
  const channel = await createOrGetDirectChannel(currentUser, selectedUser.id);
  router.push(`/chat/${channel.id}`);
};
```

### 2. Creating Group Chats

Users can create group conversations with multiple people:

```typescript
import { createGroupChannel } from "@/services/chatHelpers";

const createGroup = async () => {
  const groupName = "Weekend Plans";
  const members = ["user1", "user2", "user3"]; // User IDs to include

  const groupChannel = await createGroupChannel(
    groupName,
    members,
    currentUser,
    {
      description: "Planning our weekend activities",
      private: false, // Set to true for private groups
    },
  );

  router.push(`/chat/${groupChannel.id}`);
};
```

### 3. Sending Different Types of Messages

Once in a chat, users can send various types of messages:

#### Text Messages

- Type in the message input field at the bottom
- Press send button or Enter to send
- Support for emojis and text formatting

#### Messages with Mentions

```typescript
// Users can @mention others in messages
const sendMentionMessage = async (channel) => {
  await channel.sendMessage({
    text: "Hey @john, what do you think about this idea?",
    mentioned_users: ["john-user-id"],
  });
};
```

#### Messages with Attachments

```typescript
// Send images or files
const sendImageMessage = async (channel, imageUri) => {
  await channel.sendMessage({
    text: "Check out this photo!",
    attachments: [
      {
        type: "image",
        image_url: imageUri,
        fallback: "Image",
      },
    ],
  });
};
```

#### Thread Replies

Users can reply to specific messages in threads:

```typescript
// Reply to a message in a thread
const replyToMessage = async (channel, parentMessage, replyText) => {
  await channel.sendMessage({
    text: replyText,
    parent_id: parentMessage.id,
    show_in_channel: true, // Show in main channel too
  });
};
```

## 🔍 Finding and Managing Conversations

### Channel List Features

Users can manage their conversations through the channel list:

#### Filter Conversations

- **All Conversations**: Shows all channels
- **Unread**: Shows only channels with unread messages
- **Pinned**: Shows pinned/favorite channels
- **Archived**: Shows archived conversations

#### Search Conversations

```typescript
// Users can search through their channels
import { searchChannels } from "@/services/chatHelpers";

const searchMyChats = async (query: string) => {
  const results = await searchChannels(query, currentUser.uid);
  // Display filtered channel list
};
```

#### Organize Conversations

- **Pin Important Chats**: Long press → Pin Channel
- **Archive Old Chats**: Long press → Archive Channel
- **Mute Notifications**: Long press → Mute Channel
- **Leave Group Chats**: Long press → Leave Channel

### Real-time Features

Your chat system includes several real-time features:

#### Typing Indicators

- Users see "User is typing..." when someone is composing
- Automatically shows/hides based on typing activity

#### Read Receipts

- Messages show read status with checkmarks
- Users can see who has read their messages in groups

#### Online Status

- Users can see who's currently online
- Green dot indicates active users

#### Push Notifications

- Users receive notifications for new messages
- Customizable notification settings per channel

## 💡 Advanced Messaging Features

### Message Reactions

Users can react to messages with emojis:

```typescript
// Add reaction to a message
await message.react("👍");

// Remove reaction
await message.deleteReaction("👍");
```

### Message Search

Users can search through message history:

```typescript
import { searchMessages } from "@/services/chatHelpers";

const searchInChannel = async (channelId: string, query: string) => {
  const results = await searchMessages(channelId, query);
  // Display search results
};
```

### Channel Management

#### For Group Channels, users can:

- **Add Members**: Invite new people to the group
- **Remove Members**: Remove people from the group (if moderator)
- **Assign Moderators**: Give moderation rights to members
- **Update Channel Info**: Change name, description, image
- **Manage Settings**: Configure channel permissions

```typescript
// Example: Adding someone to a group
import { channelService } from "@/services/channelService";

const addMemberToGroup = async (channel, newMemberId) => {
  await channelService.addMembers(channel, [newMemberId], {
    text: `${newMember.name} joined the group`,
  });
};
```

## 📱 User Interface Guide

### Chat Screen Layout

1. **Header**: Shows channel name, online status, channel info button
2. **Message List**: Scrollable list of messages with timestamps
3. **Typing Indicator**: Shows when others are typing
4. **Message Input**: Text field with send button and attachment options
5. **Thread View**: Side panel for message threads

### Channel List Layout

1. **Search Bar**: Quick search through conversations
2. **Filter Buttons**: All/Unread/Pinned/Archived toggles
3. **Channel Items**: Each showing:
   - Channel name/user names
   - Last message preview
   - Timestamp
   - Unread count badge
   - Online status indicators

### Context Menus

Long press on channels or messages for additional options:

- Pin/Unpin channel
- Mute/Unmute notifications
- Archive/Unarchive
- Delete message (own messages)
- Reply in thread
- Add reaction

## 🔧 Technical Implementation Notes

### User Authentication Flow

1. User logs in through Firebase Auth
2. System automatically connects to Stream Chat
3. User profile is synced between Firebase and Stream
4. User can immediately start messaging

### Channel ID Structure

- **Direct Messages**: `dm-{userId1}-{userId2}` (sorted alphabetically)
- **Group Channels**: `group-{timestamp}` or custom IDs
- **Public Channels**: Custom meaningful IDs

### Data Synchronization

- User profiles sync between Firebase and Stream
- Messages are stored in Stream Chat
- Channel metadata stored in Stream
- Real-time updates via Stream's WebSocket connection

### Error Handling

The system includes comprehensive error handling:

- Automatic retry for failed messages
- Offline message queuing
- User-friendly error messages
- Graceful degradation when offline

## 🚀 Getting Started as a User

1. **Login**: Use your existing account to log in
2. **Start Messaging**:
   - Tap "+" to start a new conversation
   - Search for users or select from contacts
   - Choose between direct message or group chat
3. **Send Messages**: Type and send text, images, or files
4. **Manage Chats**: Use long press for additional options
5. **Stay Updated**: Receive real-time notifications and updates

## 💬 Best Practices for Users

### For Better Conversations:

- Use @mentions in groups to get specific people's attention
- Pin important conversations for easy access
- Use threads for detailed discussions to keep main chat clean
- Archive old conversations to declutter your chat list
- Use reactions for quick responses

### For Group Management:

- Give your groups descriptive names
- Add a group description to explain the purpose
- Assign moderators for large groups
- Use channel muting for less important groups
- Remove inactive members periodically

### Privacy and Security:

- Only join groups from trusted sources
- Report inappropriate behavior using built-in moderation
- Use private groups for sensitive discussions
- Be mindful of what you share in large groups

This comprehensive messaging system provides all the features users expect from modern chat applications, with the reliability and scalability of Stream Chat powering the backend infrastructure.
