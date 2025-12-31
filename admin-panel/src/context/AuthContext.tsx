"use client";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, sendEmailVerification, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: string;
  isAdmin: boolean;
  emailVerified: boolean;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ needsVerification: boolean; email: string } | void>;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          // Check if user is admin
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const userData = userDoc.data();
          
          const isAdmin = userData?.role === "admin" || userData?.isAdmin === true;
          
          if (isAdmin) {
            // Check email verification
            if (!firebaseUser.emailVerified) {
              // Sign out unverified users - they need to verify first
              await signOut(auth);
              setUser(null);
              setLoading(false);
              return;
            }
            
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: userData?.displayName || firebaseUser.displayName,
              photoURL: userData?.photoURL || firebaseUser.photoURL,
              role: userData?.role || "admin",
              isAdmin: true,
              emailVerified: firebaseUser.emailVerified,
            });
          } else {
            // Not an admin, sign them out
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ needsVerification: boolean; email: string } | void> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      const userData = userDoc.data();
      
      const isAdmin = userData?.role === "admin" || userData?.isAdmin === true;
      
      if (!isAdmin) {
        await signOut(auth);
        throw new Error("You do not have admin privileges");
      }
      
      // Check email verification
      if (!userCredential.user.emailVerified) {
        // Send verification email
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        setLoading(false);
        return { needsVerification: true, email: userCredential.user.email || email };
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.emailVerified) {
      await sendEmailVerification(currentUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
}
