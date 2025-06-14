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

// Get all users except current user
export const getAllUsers = async (currentUserId: string): Promise<UserProfile[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const q = query(
      usersCollection, 
      where('uid', '!=', currentUserId),
      orderBy('uid'),
      orderBy('lastSeen', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    
    console.log('Fetched users:', users.length);
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
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
