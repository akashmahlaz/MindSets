import "@/app/global.css";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { debugUsersCollection, getAllUsers, UserProfile } from '../../services/userService';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    if (!user) {
      console.log('No user found, cannot fetch users');
      return;
    }
    
    try {
      console.log('Fetching users...');
      console.log('Current user UID:', user.uid);
      console.log('Current user email:', user.email);
      // Debug: Check all users in collection
      await debugUsersCollection();
      
      const fetchedUsers = await getAllUsers(user.uid);
      setUsers(fetchedUsers);
      console.log('Users fetched:', fetchedUsers.length);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleUserPress = (userId: string) => {
    console.log('Navigating to user profile:', userId);
    router.push(`/profile/${userId}` as any);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'green';
      case 'away': return 'orange';
      default: return 'gray';
    }
  };
  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity 
      className="flex-row items-center p-4 bg-card border-b border-border"
      onPress={() => handleUserPress(item.uid)}
    >
      <Avatar className="w-12 h-12 mr-3" alt={""}>
        <AvatarImage source={{ uri: item.photoURL }} />
        <AvatarFallback className="bg-primary">
          <Text className="text-primary-foreground font-semibold">
            {item.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </AvatarFallback>
      </Avatar>
      <View className="flex-1">
        <Text className="text-lg font-semibold text-foreground">{item.displayName}</Text>
        <Text className="text-muted-foreground">{item.email}</Text>
        <View className="flex-row items-center mt-1">
          <View className={`w-2 h-2 rounded-full mr-2 ${
            item.status === 'online' ? 'bg-green-500' : 
            item.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
          }`} />
          <Text className="text-sm text-muted-foreground capitalize">
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-muted-foreground mt-4">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <Card className="m-4">
        <CardHeader>
          <Text className="text-2xl font-bold text-foreground">Profile</Text>
          <Text className="text-muted-foreground">Welcome, {user?.displayName || user?.email}</Text>
        </CardHeader>
      </Card>
      
      {/* User Info */}
      <Card className="mx-4 mb-4">
        <CardHeader>
          <Text className="text-lg font-semibold text-foreground">User Information</Text>
        </CardHeader>
        <CardContent>
          <Text className="text-sm text-muted-foreground">Email: {user?.email}</Text>
          <Text className="text-sm text-muted-foreground">UID: {user?.uid}</Text>
          <Text className="text-sm text-muted-foreground">Name: {user?.displayName}</Text>
            {(user?.photoURL || 'https://placehold.co/600x400?text=Hello+World') && 
            <Image 
              className="w-24 bg-slate-400 h-24 rounded-full" 
              source={{ uri: user?.photoURL || 'https://placehold.co/600x400?text=Hello+World' }} 
            />
            }
        </CardContent>
      </Card>

      <View>
        <Text className="text-sm text-muted-foreground">All Chats</Text>
        <View className="flex-row items-center justify-between p-4 bg-card border-b border-border">
          <Text className="text-lg font-semibold text-foreground">Chats</Text>
          <TouchableOpacity onPress={() => router.push('/chat')}>
            <Text className="text-primary">View All</Text>
          </TouchableOpacity>
          </View>
      </View>

      {/* Users List */}
      <Card className="mx-4 flex-1">
        <CardHeader>
          <Text className="text-lg font-semibold text-foreground">Available Users</Text>
        </CardHeader>
        <CardContent className="flex-1">          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.uid}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }            contentContainerStyle={{
              flexGrow: 1
            }}
            ListEmptyComponent={
              <View className="py-8 items-center">
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text className="text-muted-foreground mt-2">No users found</Text>
                <Text className="text-muted-foreground text-sm">Pull to refresh</Text>
              </View>
            }
          />
        </CardContent>
      </Card>

      {/* Sign Out Button */}
      <View className="p-4">
        <Button onPress={logout} variant="destructive">
          <Text className="text-destructive-foreground font-medium">Sign Out</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}

