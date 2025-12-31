import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where
} from "firebase/firestore";
import { db } from "./firebase";

export interface User {
  id: string;
  uid: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  photoURL?: string;
  role: "user" | "counsellor" | "admin";
  status?: "online" | "offline" | "suspended";
  isProfileComplete?: boolean;
  primaryConcerns?: string[];
  createdAt?: Timestamp;
  lastSeen?: Timestamp;
  pushToken?: string;
  disabled?: boolean;
}

// Fetch all users
export const fetchUsers = async (): Promise<User[]> => {
  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Fetch single user
export const fetchUser = async (userId: string): Promise<User | null> => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

// Update user
export const updateUser = async (
  userId: string,
  data: Partial<User>
): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (
  userId: string,
  role: "user" | "counsellor" | "admin"
): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      role,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

// Disable/Enable user
export const toggleUserStatus = async (
  userId: string,
  disabled: boolean
): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      disabled,
      status: disabled ? "suspended" : "offline",
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    throw error;
  }
};

// Delete user (soft delete - just marks as deleted)
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // Call API route to delete from both Auth and Firestore
    const response = await fetch("/api/users", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete user");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Bulk delete users
export const bulkDeleteUsers = async (userIds: string[]): Promise<{ success: string[]; failed: string[] }> => {
  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userIds, action: "bulk-delete" }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete users");
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error bulk deleting users:", error);
    throw error;
  }
};

// Fetch users by role
export const fetchUsersByRole = async (
  role: "user" | "counsellor" | "admin"
): Promise<User[]> => {
  try {
    const q = query(
      collection(db, "users"),
      where("role", "==", role),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  } catch (error) {
    console.error("Error fetching users by role:", error);
    throw error;
  }
};

// Get user stats
export const getUserStats = async () => {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const users = snapshot.docs.map((doc) => doc.data());
    
    return {
      total: users.length,
      users: users.filter((u) => u.role === "user").length,
      counsellors: users.filter((u) => u.role === "counsellor").length,
      admins: users.filter((u) => u.role === "admin").length,
      online: users.filter((u) => u.status === "online").length,
      suspended: users.filter((u) => u.disabled || u.status === "suspended").length,
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw error;
  }
};
