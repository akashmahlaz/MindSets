import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { debugUsersCollection, getAllUsers, UserProfile } from '../../services/userService';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);  const fetchUsers = async () => {
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
     
      onPress={() => handleUserPress(item.uid)}
    >
      <Image 
        source={{ uri: item.photoURL || 'https://via.placeholder.com/50' }} 
        
      />
      <View >
        <Text>{item.displayName}</Text>
        <Text>{item.email}</Text>
        <View >
          <View />
          <Text>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  return (
    <View >
      <View >
        <Text >Profile</Text>
        <Text >Welcome, {user?.displayName || user?.email}</Text>
      </View>

      <View >
        <Text >Available Users</Text>
        {loading ? (
          <Text >Loading users...</Text>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.uid}
            
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text >No users found. Pull to refresh.</Text>
            }
          />
        )}
      </View>

      <TouchableOpacity  onPress={logout}>
        <Text>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

