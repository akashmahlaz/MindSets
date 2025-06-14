import { auth } from '@/firebaseConfig';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { connectUserToStream, disconnectUserFromStream } from '../context/streamClient';
import { createUserProfile, updateUserStatus } from '../services/userService';

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

  // Fetch Stream token from backend
  const fetchStreamToken = async (firebaseUser: User): Promise<string> => {
    const idToken = await firebaseUser.getIdToken();
    const response = await fetch('https://us-central1-mental-health-f7b7f.cloudfunctions.net/generateStreamToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ userId: firebaseUser.uid }),
    });
    const data = await response.json();
    return data.token;
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };  const logout = async () => {
    if (user) {
      await updateUserStatus(user.uid, 'offline');
    }
    await disconnectUserFromStream();
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          // Create or update user profile in Firestore
          await createUserProfile(firebaseUser);
          
          // Connect to Stream
          const streamToken = await fetchStreamToken(firebaseUser);
          await connectUserToStream(firebaseUser, streamToken);
        } catch (error) {
          console.error('Error setting up user:', error);
        }
      } else {
        setUser(null);
        await disconnectUserFromStream();
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
