import { auth } from "@/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { disablePushNotifications } from "../lib/pushNotificationHelpers";
import { pushNotificationService } from "../lib/pushNotificationService";
import { requestNotificationPermissions } from "../lib/requestPermissions";
import {
  createUserProfile,
  createEnhancedUserProfile,
  updateUserPushToken,
  updateUserStatus,
  getUserProfile,
} from "../services/userService";
import { UserProfile, UserRole } from "../types/user";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signUpEnhanced: (
    email: string,
    password: string,
    profileData: Partial<UserProfile>,
    role: UserRole,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signUpEnhanced = async (
    email: string,
    password: string,
    profileData: Partial<UserProfile>,
    role: UserRole,
  ) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    await createEnhancedUserProfile(userCredential.user, profileData, role);
  };

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    }
  };
  const logout = async () => {
    if (user) {
      await updateUserStatus(user.uid, "offline");
    }

    // Disable push notifications when user logs out
    await disablePushNotifications();

    await signOut(auth);
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Store user ID for push token updates
        await AsyncStorage.setItem("@userId", firebaseUser.uid);

        try {
          // Create or update user profile in Firestore
          await createUserProfile(firebaseUser);

          // Fetch enhanced user profile
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);

          // Request notification permissions when user signs in
          await requestNotificationPermissions();

          // Initialize push notifications and store token
          const pushToken = await pushNotificationService.initialize();
          if (pushToken) {
            await updateUserPushToken(firebaseUser.uid, pushToken);
            console.log("✅ Push token stored for user:", firebaseUser.uid);
          } else {
            console.log("⚠️ No push token received during initialization");
          }
        } catch (error) {
          console.error("Error setting up user:", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        // Clear stored user ID
        await AsyncStorage.removeItem("@userId");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signUpEnhanced,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
