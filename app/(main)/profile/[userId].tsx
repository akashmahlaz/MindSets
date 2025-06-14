import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext';
import { getUserProfile, UserProfile } from '../../../services/userService';

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const videoClient = useStreamVideoClient();
  const { user } = useAuth();
  const { chatClient, isChatConnected, connectToChat } = useChat();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        console.log('No userId provided');
        setLoading(false);
        return;
      }

      try {
        console.log('Loading user data for:', userId);
        const profile = await getUserProfile(userId as string);
        if (profile) {
          setUserData(profile);
          console.log('User data loaded:', profile);
        } else {
          console.log('User not found:', userId);
          Alert.alert('Error', 'User not found');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        Alert.alert('Error', 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  // Start video call with better error handling
  const startCall = async (isVideo = true) => {
    console.log('startCall called with isVideo:', isVideo);
    console.log('videoClient available:', !!videoClient);
    console.log('userId available:', !!userId);
    
    if (!videoClient || !userId) {
      Alert.alert('Error', 'Video client not available or user ID missing');
      return;
    }
    
    try {
      const callId = `call-${Date.now()}`;
      console.log('Creating call with ID:', callId);
      
      const call = videoClient.call('default', callId);
      
      console.log('Joining call...');
      await call.join({ create: true });
      
      if (isVideo) {
        console.log('Enabling camera...');
        await call.camera.enable();
      }
      console.log('Enabling microphone...');
      await call.microphone.enable();
        console.log('Navigating to call screen...');
      // Navigate to call screen
      router.push(`/call/${callId}` as any);
    } catch (error) {
      console.error('Error starting call:', error);
      Alert.alert('Error', 'Failed to start call: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Start chat with better error handling
  const startChat = async () => {
    console.log('startChat called');
    console.log('user available:', !!user);
    console.log('userId available:', !!userId);
    console.log('chatClient available:', !!chatClient);
    console.log('isChatConnected:', isChatConnected);
    
    if (!user || !userId || !userData) {
      Alert.alert('Error', 'User not authenticated, user ID missing, or user data not loaded');
      return;
    }

    if (!chatClient || !isChatConnected) {
      console.log('Chat client not connected, attempting to connect...');
      try {
        await connectToChat();
        // Wait a moment for connection to establish
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Failed to connect to chat:', error);
        Alert.alert('Error', 'Failed to connect to chat. Please try again.');
        return;
      }
    }
    try {
      if (!chatClient) {
        Alert.alert('Error', 'Chat client not available');
        return;
      }
      // Do NOT try to upsert the target user from the client (not allowed)
      console.log('Assuming target user exists in Stream Chat:', userId);

      // Create a deterministic channel ID for direct messages
      const sortedMembers = [user.uid, userId].sort();
      const channelId = `dm-${sortedMembers.join('-')}`;
      console.log('Creating/watching channel with ID:', channelId);
      
      // Use watch() instead of create() - this should work if both users exist
      const channel = chatClient.channel('messaging', channelId, {
        members: [user.uid, userId],
      });
      
      console.log('Watching channel (creates if needed)...');
      await channel.watch();
      
      console.log('Navigating to chat screen...');
      router.push(`/chat/${channelId}` as any);
    } catch (error: any) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat: ' + error.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading user profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>User not found</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: userData.photoURL || 'https://via.placeholder.com/150' }} 
        style={styles.profileImage}
      />
      <Text style={styles.name}>{userData.displayName}</Text>
      <Text style={styles.email}>{userData.email}</Text>
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: userData.status === 'online' ? 'green' : userData.status === 'away' ? 'orange' : 'gray' }]} />
        <Text style={[styles.status, { color: userData.status === 'online' ? 'green' : userData.status === 'away' ? 'orange' : 'gray' }]}>
          {userData.status}
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button title="Video Call" onPress={() => startCall(true)} />
        <Button title="Voice Call" onPress={() => startCall(false)} />
        <Button title="Chat" onPress={startChat} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  status: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  buttonContainer: {
    gap: 10,
    width: '100%',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
  },
});
