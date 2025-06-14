import { User } from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { chatClient } from './stream';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: any;
  createdAt: any;
}

// Create or update user profile in Firestore
export const createUserProfile = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create new user profile
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        email: user.email,
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=random`,
        status: 'online',
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      console.log('User profile created:', user.uid);
    } else {
      // Update existing user status
      await updateDoc(userRef, {
        status: 'online',
        lastSeen: serverTimestamp(),
      });
      console.log('User status updated:', user.uid);
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
      if (!a.lastSeen && !b.lastSeen) return 0;
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

// Create Stream Chat users for users who exist in Firestore but not in Stream Chat
export const createStreamChatUsers = async (): Promise<void> => {
  try {
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    
    for (const doc of querySnapshot.docs) {
      const userData = doc.data() as UserProfile;
      
      // Check if user already exists in Stream Chat
      const userExists = await chatClient.queryUsers({ id: { $eq: userData.uid } });
      
      if (userExists.users.length === 0) {
        // Create user in Stream Chat
        await chatClient.upsertUser({
          id: userData.uid,
          name: userData.displayName,
          email: userData.email,
          image: userData.photoURL,
        });
        console.log('Stream Chat user created:', userData.uid);
      }
    }
  } catch (error) {
    console.error('Error creating Stream Chat users:', error);
    throw error;
  }
};
