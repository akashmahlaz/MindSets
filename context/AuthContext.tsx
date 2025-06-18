import { auth } from '@/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { disablePushNotifications } from '../lib/pushNotificationHelpers';
import { pushNotificationService } from '../lib/pushNotificationService';
import { requestNotificationPermissions } from '../lib/requestPermissions';
import { createUserProfile, updateUserPushToken, updateUserStatus } from '../services/userService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };
  const logout = async () => {
    if (user) {
      await updateUserStatus(user.uid, 'offline');
    }
    
    // Disable push notifications when user logs out
    await disablePushNotifications();
    
    await signOut(auth);
  };  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Store user ID for push token updates
        await AsyncStorage.setItem('@userId', firebaseUser.uid);
        
        try {
          // Create or update user profile in Firestore
          await createUserProfile(firebaseUser);
          
          // Request notification permissions when user signs in
          await requestNotificationPermissions();
          
          // Initialize push notifications and store token
          const pushToken = await pushNotificationService.initialize();
          if (pushToken) {
            await updateUserPushToken(firebaseUser.uid, pushToken);
            console.log('✅ Push token stored for user:', firebaseUser.uid);
          } else {
            console.log('⚠️ No push token received during initialization');
          }
        } catch (error) {
          console.error('Error setting up user:', error);
        }
      } else {
        setUser(null);
        // Clear stored user ID
        await AsyncStorage.removeItem('@userId');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
