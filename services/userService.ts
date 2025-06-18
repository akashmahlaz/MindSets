import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: any;
  createdAt: any;
  pushToken?: string; // Add push token field
  pushTokenUpdatedAt?: any; // Track when token was last updated
}

// Create or update user profile in Firestore
export const createUserProfile = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
      // Create new user profile
      const userProfile = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        email: user.email,
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=random`,
        status: 'online',
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
      };
      
      await setDoc(userRef, userProfile);
      console.log('User profile created:', user.uid);
      
      // Create user in Stream Chat when creating new profile
      try {
        await createStreamChatUser(userProfile as UserProfile);
        console.log('✅ Stream Chat user created for:', user.uid);
      } catch (streamError) {
        console.error('⚠️ Failed to create Stream Chat user:', streamError);
        // Don't throw error here as user profile creation should succeed even if Stream fails
      }
    } else {
      // Update existing user status
      await updateDoc(userRef, {
        status: 'online',
        lastSeen: serverTimestamp(),
      });
      console.log('User status updated:', user.uid);
      
      // Ensure user exists in Stream Chat for existing users too
      try {
        const existingProfile = userDoc.data() as UserProfile;
        await createStreamChatUser(existingProfile);
        console.log('✅ Stream Chat user ensured for existing user:', user.uid);
      } catch (streamError) {
        console.error('⚠️ Failed to ensure Stream Chat user:', streamError);
      }
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
};

// Debug function to check total users
export const debugUsersCollection = async (): Promise<void> => {
  try {
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    
    console.log('=== DEBUG: Users Collection ===');
    console.log('Total documents:', querySnapshot.size);
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log('User document:', {
        id: doc.id,
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        status: userData.status,
        createdAt: userData.createdAt
      });
    });
    console.log('=== END DEBUG ===');
  } catch (error) {
    console.error('Error in debug function:', error);
  }
};

// Get all users except current user
export const getAllUsers = async (currentUserId: string): Promise<UserProfile[]> => {
  try {
    console.log('Getting all users except:', currentUserId);
    const usersCollection = collection(db, 'users');
    
    // First, try a simple query to get all users
    const querySnapshot = await getDocs(usersCollection);
    const users: UserProfile[] = [];
    
    console.log('Total documents in users collection:', querySnapshot.size);
      querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserProfile;
      console.log('Found user:', userData.uid, userData.displayName || userData.email);
      
      // Filter out current user
      if (userData.uid !== currentUserId) {
        users.push(userData);
      }
    });
    
    // Sort by lastSeen in memory
    users.sort((a, b) => {
      if (!a.lastSeen) return 1;
      if (!b.lastSeen) return -1;
      return b.lastSeen.toMillis() - a.lastSeen.toMillis();
    });
    
    console.log('Filtered users (excluding current):', users.length);
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    console.error('Error details:', error);
    
    // Fallback: return empty array instead of throwing
    return [];
  }
};

// Get specific user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    } else {
      console.log('No user found with ID:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Update user status
export const updateUserStatus = async (userId: string, status: 'online' | 'offline' | 'away'): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status,
      lastSeen: serverTimestamp(),
    });
    console.log('User status updated:', userId, status);
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// Update user push token
export const updateUserPushToken = async (userId: string, pushToken: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pushToken,
      pushTokenUpdatedAt: serverTimestamp(),
    });
    console.log('Push token updated for user:', userId);
  } catch (error) {
    console.error('Error updating push token:', error);
    throw error;
  }
};

// Get user push token
export const getUserPushToken = async (userId: string): Promise<string | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      return userData.pushToken || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user push token:', error);
    return null;
  }
};

// Get push tokens for multiple users (for batch notifications)
export const getUsersPushTokens = async (userIds: string[]): Promise<{ userId: string; token: string }[]> => {
  try {
    console.log('🔍 getUsersPushTokens called for users:', userIds);
    const tokens: { userId: string; token: string }[] = [];
    
    for (const userId of userIds) {
      console.log(`🔍 Getting push token for user: ${userId}`);
      const token = await getUserPushToken(userId);
      if (token) {
        console.log(`✅ Found push token for ${userId}: ${token.substring(0, 20)}...`);
        tokens.push({ userId, token });
      } else {
        console.log(`❌ No push token found for user: ${userId}`);
      }
    }
    
    console.log(`📊 Total tokens retrieved: ${tokens.length} out of ${userIds.length} users`);
    return tokens;
  } catch (error) {
    console.error('❌ Error getting users push tokens:', error);
    return [];
  }
};

// Create Stream Chat user - proper implementation
export const createStreamChatUser = async (userProfile: UserProfile): Promise<void> => {
  try {
    console.log('Creating Stream Chat user for:', userProfile.uid);
    
    // Import stream services
    const { chatClient } = await import('./stream');
    
    if (!chatClient) {
      console.error('Stream Chat client not available');
      return;
    }

    const streamUserData = {
      id: userProfile.uid,
      name: userProfile.displayName,
      image: userProfile.photoURL,
      role: 'user', // Ensure user has proper role
    };

    try {
      // Use upsertUser (singular) instead of upsertUsers (plural)
      const result = await chatClient.upsertUser(streamUserData);
      console.log('✅ User created/updated in Stream Chat:', userProfile.uid, result);
    } catch (apiError: any) {
      console.error('❌ Error creating user via Stream API:', apiError);
      // If it's a permission error, try a different approach
      if (apiError.message?.includes('permissions') || apiError.message?.includes('auth')) {
        console.log('⚠️ Permission issue, user will be created when they connect to chat');
      }
    }
  } catch (error) {
    console.error('Error with Stream Chat user creation:', error);
  }
};

// Ensure both users exist in Stream Chat before creating a channel
export const ensureStreamChatUsers = async (userIds: string[]): Promise<boolean> => {
  try {
    console.log('Ensuring Stream Chat users exist for IDs:', userIds);
    const userProfiles = await Promise.all(
      userIds.map(async (uid) => {
        const profile = await getUserProfile(uid);
        return profile;
      })
    );
    const validProfiles = userProfiles.filter((p): p is UserProfile => p !== null);
    await Promise.all(
      validProfiles.map(async (profile) => {
        await createStreamChatUser(profile);
      })
    );
    return true;
  } catch (error) {
    console.error('Error ensuring Stream Chat users exist:', error);
    return false;
  }
};

// Start a chat with another user (ensure both users exist in Stream Chat)
export const startChatWithUser = async (currentUserId: string, targetUserId: string): Promise<any> => {
  try {
    console.log(`Starting chat between ${currentUserId} and ${targetUserId}`);
    await ensureStreamChatUsers([currentUserId, targetUserId]);
    const { chatClient } = await import('./stream');
    const channelId = [currentUserId, targetUserId].sort().join('-');
    const channel = chatClient.channel('messaging', channelId, {
      members: [currentUserId, targetUserId],
      created_by_id: currentUserId,
    });
    await channel.watch();
    console.log('Chat channel created/watched:', channelId);
    return channel;
  } catch (error) {
    console.error('Error starting chat:', error);
    throw error;
  }
};
