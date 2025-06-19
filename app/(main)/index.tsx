import "@/app/global.css";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoCallTester } from '@/components/video/VideoCallTester';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useVideo } from '@/context/VideoContext';
import { useColorScheme } from '@/lib/useColorScheme';
import { UserProfile, getAllUsers } from '@/services/userService';
import { Ionicons } from '@expo/vector-icons';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OverviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { chatClient, isChatConnected, connectToChat } = useChat();
  const { createCall, isVideoConnected } = useVideo();
  const videoClient = useStreamVideoClient();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkColorScheme } = useColorScheme();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (!user?.uid) return;
      const allUsers = await getAllUsers(user.uid);
      // Filter out current user
      const otherUsers = allUsers.filter(u => u.uid !== user?.uid);
      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const handleUserPress = (selectedUser: UserProfile) => {
    router.push({
      pathname: '/profile/[userId]',
      params: { userId: selectedUser.uid }
    });
  };  // Generate a short call ID that fits within 64 character limit
  const generateCallId = (userId1: string, userId2: string) => {
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
  };

  // Start video call function
  const startCall = async (targetUser: UserProfile, isVideo = true) => {
    if (!isVideoConnected || !user?.uid) {
      Alert.alert('Error', 'Video service not available. Please try again.');
      return;
    }
    
    try {
      console.log('Starting call with:', targetUser.displayName, 'isVideo:', isVideo);
      
      // Generate unique call ID that's under 64 characters
      const callId = generateCallId(user.uid, targetUser.uid);
      console.log('Generated call ID:', callId, 'Length:', callId.length);
      
      // Create the call using our enhanced video context
      const call = await createCall(callId, [targetUser.uid], isVideo);
      
      if (call) {
        console.log('Call created successfully:', call.cid);
        
        // Navigate to call screen with proper parameters
        router.push({
          pathname: '/call/[callId]',
          params: {
            callId: call.id,
            callType: call.type,
            isVideo: isVideo.toString(),
          },
        } as any);
      } else {
        throw new Error('Failed to create call');
      }
    } catch (error) {
      console.error('Error starting call:', error);
      Alert.alert('Error', 'Failed to start call. Please check your connection and try again.');
    }
  };

  // Start chat function with better debugging
  const startChat = async (targetUser: UserProfile) => {
    console.log('🚀 Starting chat with user:', targetUser.displayName, targetUser.uid);
    
    if (!user || !chatClient) {
      console.error('❌ Chat not available - missing user or chatClient');
      Alert.alert('Error', 'Chat not available');
      return;
    }

    console.log('✅ User and chatClient available');
    console.log('Chat connected:', isChatConnected);

    if (!isChatConnected) {
      console.log('🔄 Not connected to chat, attempting to connect...');
      try {
        await connectToChat();
        // Wait a bit for connection to establish
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Connected to chat successfully');
      } catch (error) {
        console.error('❌ Failed to connect to chat:', error);
        Alert.alert('Error', 'Failed to connect to chat');
        return;
      }
    }
    
    try {
      console.log('🔄 Creating/getting channel...');
      
      // Use the improved createOrGetDirectChannel function
      const { createOrGetDirectChannel } = await import('@/services/chatHelpers');
      const channel = await createOrGetDirectChannel(user, targetUser.uid);
      
      console.log('✅ Channel created/retrieved:', channel.id);
        // Navigate to the chat screen
      router.push(`/chat/${channel.id}` as any);
      console.log('✅ Navigated to chat screen');
      
    } catch (error) {
      console.error('❌ Error starting chat:', error);
      Alert.alert(
        'Chat Error', 
        `Failed to start chat with ${targetUser.displayName}. Please try again.`
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(item)}
      className="active:opacity-70"
    >
      <Card className="mx-4 mb-3 bg-card border border-border">
        <CardContent className="p-4">
          <View className="flex-row items-center space-x-3">
            <View className="relative">
              <Avatar className="w-12 h-12" alt={`${item.displayName} avatar`}>
                <AvatarImage source={{ uri: item.photoURL }} />
                <AvatarFallback className="bg-primary">
                  <Text className="text-primary-foreground font-medium">
                    {getInitials(item.displayName)}
                  </Text>
                </AvatarFallback>
              </Avatar>
              <View className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${getStatusColor(item.status)}`} />
            </View>
            <View className="flex-1">
              <Text className="text-card-foreground font-semibold text-base">
                {item.displayName}
              </Text>
              <Text className="text-muted-foreground text-sm" numberOfLines={1}>
                {item.email}
              </Text>
              <Text className="text-muted-foreground text-xs mt-1 capitalize">
                {item.status}
              </Text>
            </View>
            <View className="flex-row space-x-2">              <TouchableOpacity
                onPress={() => startChat(item)}
                className="p-2 rounded-full bg-blue-100 dark:bg-blue-900"
              >
                <Ionicons name="chatbubble" size={16} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => startCall(item, false)}
                className="p-2 rounded-full bg-green-100 dark:bg-green-900"
              >
                <Ionicons name="call" size={16} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => startCall(item, true)}
                className="p-2 rounded-full bg-purple-100 dark:bg-purple-900"
              >
                <Ionicons name="videocam" size={16} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  const renderUserSkeleton = () => (
    <Card className="mx-4 mb-3 bg-card border border-border">
      <CardContent className="p-4">
        <View className="flex-row items-center space-x-3">
          <View className="relative">
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full" />
          </View>
          <View className="flex-1">
            <Skeleton className="w-32 h-5 rounded mb-1" />
            <Skeleton className="w-40 h-4 rounded mb-1" />
            <Skeleton className="w-16 h-3 rounded" />
          </View>
          <View className="flex-row space-x-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </View>
        </View>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView 
        className="flex-1 bg-background" 
        edges={['top']} 
        style={{ backgroundColor: isDarkColorScheme ? '#000000' : '#ffffff' }}
      >
        <StatusBar 
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={isDarkColorScheme ? "#000000" : "#ffffff"}
          translucent={false}
        />
        <View className="flex-1 bg-background">
          {/* Header Skeleton */}
          <View className="px-4 pt-2 pb-2">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Skeleton className="w-40 h-8 rounded mb-2" />
                <Skeleton className="w-48 h-5 rounded" />
              </View>
              <View className="flex-row items-center space-x-2">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="w-10 h-10 rounded-full" />
              </View>
            </View>
            <Skeleton className="w-full h-12 rounded" />
          </View>

          {/* Users List Skeleton */}
          <View className="flex-1">
            {[...Array(6)].map((_, index) => (
              <View key={index}>
                {renderUserSkeleton()}
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }return (
    <SafeAreaView 
      className="flex-1 bg-background" 
      edges={['top']} 
      style={{ backgroundColor: isDarkColorScheme ? '#000000' : '#ffffff' }}
    >
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? "#000000" : "#ffffff"}
        translucent={false}
      />
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-4 pt-2 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-2xl font-bold text-foreground">
                Welcome back!
              </Text>
              <Text className="text-muted-foreground">
                Connect with your contacts
              </Text>
              <View >
                <Text>Last seen: 2 hours ago</Text>
                <TouchableOpacity onPress={() => router.push('/push-test')}>
                  <Text className="text-blue-500">Change settings</Text>
                </TouchableOpacity> 
              </View>
            </View>
            <View className="flex-row items-center space-x-2">
              <TouchableOpacity
                onPress={() => router.push('/chat')}
                className="p-2 rounded-full bg-blue-100 dark:bg-blue-900"
              >
                <Ionicons name="chatbubbles" size={20} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/profile')}
                className="p-2"
              >
                <Avatar className="w-10 h-10" alt={`${user?.displayName || 'User'} avatar`}>
                  <AvatarImage source={{ uri: user?.photoURL || undefined }} />
                  <AvatarFallback className="bg-primary">
                    <Text className="text-primary-foreground font-medium">
                      {user?.displayName ? getInitials(user.displayName) : 'U'}
                    </Text>
                  </AvatarFallback>
                </Avatar>
              </TouchableOpacity>
            </View>
          </View>          <Input
            placeholder  ="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="mb-4 dark:bg-slate-800 dark:text-slate-400"
          />

          {/* Video Call Testing Component - Remove in production */}
          {__DEV__ && <VideoCallTester />}
        </View>

        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.uid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }          contentContainerStyle={{ 
            flexGrow: 1
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Ionicons
                name="people-outline"
                size={64}
                color="#9CA3AF"
                style={{ marginBottom: 16 }}
              />
              <Text className="text-muted-foreground text-lg font-medium">
                {searchQuery ? 'No users found' : 'No contacts available'}
              </Text>
              <Text className="text-muted-foreground text-sm mt-2 text-center px-8">
                {searchQuery
                  ? 'Try searching with a different name or email'
                  : 'Invite friends to start connecting'
                }
              </Text>
              {!searchQuery && (
                <Button
                  onPress={onRefresh}
                  className="mt-4"
                  variant="outline">
                  <Text>Refresh</Text>
                </Button>
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
