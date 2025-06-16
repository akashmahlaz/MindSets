import "@/app/global.css";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
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
  const { chatClient, isChatConnected, connectToChat } = useChat();  const videoClient = useStreamVideoClient();
  
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
  };

  // Start video call function
  const startCall = async (targetUser: UserProfile, isVideo = true) => {
    if (!videoClient || !user?.uid) {
      Alert.alert('Error', 'Video client not available');
      return;
    }
    
    try {
      const callId = `call-${Date.now()}`;
      const call = videoClient.call('default', callId);
        // Create the call with both users as members and enable ringing
      await call.getOrCreate({
        ring: true, // This triggers the ring for other participants
        data: {
          members: [
            { user_id: user.uid }, 
            { user_id: targetUser.uid }
          ],
        },
      });
      
      // Join the call after creating it
      await call.join();
      
      if (isVideo) {
        await call.camera.enable();
      }
      await call.microphone.enable();
      
      // Navigate to call screen
      router.push(`/call/${callId}` as any);
    } catch (error) {
      console.error('Error starting call:', error);
      Alert.alert('Error', 'Failed to start call');
    }
  };

  // Start chat function
  const startChat = async (targetUser: UserProfile) => {
    if (!user || !chatClient) {
      Alert.alert('Error', 'Chat not available');
      return;
    }

    if (!isChatConnected) {
      try {
        await connectToChat();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        Alert.alert('Error', 'Failed to connect to chat');
        return;
      }
    }
    
    try {
      // Create a deterministic channel ID for direct messages
      const sortedMembers = [user.uid, targetUser.uid].sort();
      const channelId = `dm-${sortedMembers.join('-')}`;
      
      const channel = chatClient.channel('messaging', channelId, {
        members: [user.uid, targetUser.uid],
      });
      
      await channel.watch();
      router.push(`/chat/${channelId}` as any);
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat');
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
            <View className="flex-row space-x-2">
              <TouchableOpacity
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
  );  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? "#0f172a" : "#ffffff"}
        translucent={false}
      />
      <View className="flex-1">
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
          </View>
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="mb-4"
          />
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
