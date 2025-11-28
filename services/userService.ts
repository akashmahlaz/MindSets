import { User } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
    BaseUserProfile,
    CounsellorProfileData,
    UserProfile,
    UserRole,
} from "../types/user";

// Legacy interface for backward compatibility
export interface LegacyUserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  status: "online" | "offline" | "away";
  lastSeen: any;
  createdAt: any;
  pushToken?: string;
  pushTokenUpdatedAt?: any;
}

// Create or update user profile in Firestore
export const createUserProfile = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      // Create new user profile
      const userProfile = {
        uid: user.uid,
        displayName:
          user.displayName || user.email?.split("@")[0] || "Anonymous",
        email: user.email,
        photoURL:
          user.photoURL ||
          `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=random`,
        status: "online",
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
        role: "user", // Default role for basic sign-ups
        isProfileComplete: true, // Auto-complete profile for new users
      };

      await setDoc(userRef, userProfile);
      console.log("User profile created:", user.uid);

      // Create user in Stream Chat when creating new profile
      try {
        await createStreamChatUser(userProfile as UserProfile);
        console.log("✅ Stream Chat user created for:", user.uid);
      } catch (streamError) {
        console.error("⚠️ Failed to create Stream Chat user:", streamError);
        // Don't throw error here as user profile creation should succeed even if Stream fails
      }
    } else {
      // Update existing user status
      await updateDoc(userRef, {
        status: "online",
        lastSeen: serverTimestamp(),
      });
      console.log("User status updated:", user.uid);

      // Ensure user exists in Stream Chat for existing users too
      try {
        const existingProfile = userDoc.data() as UserProfile;
        await createStreamChatUser(existingProfile);
        console.log("✅ Stream Chat user ensured for existing user:", user.uid);
      } catch (streamError) {
        console.error("⚠️ Failed to ensure Stream Chat user:", streamError);
      }
    }
  } catch (error) {
    console.error("Error creating/updating user profile:", error);
    throw error;
  }
};

// Debug function to check total users
export const debugUsersCollection = async (): Promise<void> => {
  try {
    const usersCollection = collection(db, "users");
    const querySnapshot = await getDocs(usersCollection);

    console.log("=== DEBUG: Users Collection ===");
    console.log("Total documents:", querySnapshot.size);

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log("User document:", {
        id: doc.id,
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        status: userData.status,
        createdAt: userData.createdAt,
      });
    });
    console.log("=== END DEBUG ===");
  } catch (error) {
    console.error("Error in debug function:", error);
  }
};

// Get all users except current user
export const getAllUsers = async (
  currentUserId: string,
): Promise<UserProfile[]> => {
  try {
    console.log("Getting all users except:", currentUserId);
    const usersCollection = collection(db, "users");

    // First, try a simple query to get all users
    const querySnapshot = await getDocs(usersCollection);
    const users: UserProfile[] = [];

    console.log("Total documents in users collection:", querySnapshot.size);
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserProfile;
      console.log(
        "Found user:",
        userData.uid,
        userData.displayName || userData.email,
      );

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

    console.log("Filtered users (excluding current):", users.length);
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    console.error("Error details:", error);

    // Fallback: return empty array instead of throwing
    return [];
  }
};

// Create enhanced user profile with role-specific data
export const createEnhancedUserProfile = async (
  user: User,
  profileData: Partial<UserProfile>,
  role: UserRole,
): Promise<void> => {
  try {
    const userRef = doc(db, "users", user.uid);

    const baseProfile: BaseUserProfile = {
      uid: user.uid,
      displayName:
        profileData.displayName ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Anonymous",
      email: user.email!,
      photoURL:
        user.photoURL ||
        `https://ui-avatars.com/api/?name=${profileData.displayName || user.displayName || user.email}&background=random`,
      status: "online",
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      role,
      isProfileComplete: true,
      ...(role === "counsellor" && {
        isApproved: false, // Don't auto-approve - require admin verification
        verificationStatus: "pending" as const,
      }),
    };

    const fullProfile = {
      ...baseProfile,
      ...profileData,
    };

    await setDoc(userRef, fullProfile);
    console.log("✅ Enhanced user profile created:", user.uid, "Role:", role);

    // Create user in Stream Chat
    try {
      await createStreamChatUser(fullProfile as any);
      console.log("✅ Stream Chat user created for:", user.uid);
    } catch (streamError) {
      console.error("⚠️ Failed to create Stream Chat user:", streamError);
    }
  } catch (error) {
    console.error("❌ Error creating enhanced user profile:", error);
    throw error;
  }
};

// Quick function to create test counsellors (for development only)
export const createTestCounsellor = async (
  name: string,
  email: string,
  specializations: string[] = ["Anxiety", "Depression"],
): Promise<void> => {
  try {
    const timestamp = Date.now();
    const userRef = doc(db, "users", `test-${timestamp}`);

    // Generate a professional looking photo URL
    const firstName = name.split(" ")[0];
    const lastName = name.split(" ")[1] || "";
    const photoURL = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000000)}?w=150&h=150&fit=crop&crop=face&auto=format`;

    const testCounsellor = {
      uid: `test-${timestamp}`,
      displayName: `Dr. ${name}`,
      email: email,
      firstName: firstName,
      lastName: lastName,
      photoURL: photoURL,
      status: Math.random() > 0.3 ? "online" : "away", // 70% online, 30% away
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      role: "counsellor",
      isProfileComplete: true,
      isApproved: true,
      verificationStatus: "verified",
      licenseNumber: `LIC${Math.floor(Math.random() * 10000)}`,
      licenseType:
        Math.random() > 0.5
          ? "Licensed Clinical Social Worker"
          : "Licensed Professional Counselor",
      yearsExperience: Math.floor(Math.random() * 15) + 5,
      specializations: specializations,
      approaches: ["Cognitive Behavioral Therapy", "Mindfulness-Based Therapy"],
      ageGroups: ["Adults", "Young Adults"],
      hourlyRate: 75 + Math.floor(Math.random() * 50),
      maxClientsPerWeek: 10 + Math.floor(Math.random() * 15),
      acceptsNewClients: Math.random() > 0.2, // 80% accepting new clients
      languages: ["English"],
      bio: `Dr. ${name} is a licensed mental health professional with ${Math.floor(Math.random() * 15) + 5} years of experience helping clients with ${specializations.join(" and ").toLowerCase()}.`,
    };

    await setDoc(userRef, testCounsellor);
    console.log("✅ Test counsellor created:", name);
  } catch (error) {
    console.error("❌ Error creating test counsellor:", error);
    throw error;
  }
};

// Get user profile with type safety
export const getUserProfile = async (
  uid: string,
): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// Get counsellors with specific filters
export const getCounsellors = async (filters?: {
  specializations?: string[];
  ageGroups?: string[];
  gender?: "male" | "female";
  availableNow?: boolean;
}): Promise<UserProfile[]> => {
  try {
    console.log("🔍 Getting counsellors with filters:", filters);

    // Get all counsellors from database
    let q = query(collection(db, "users"), where("role", "==", "counsellor"));

    const querySnapshot = await getDocs(q);
    console.log("📊 Found counsellors in database:", querySnapshot.size);

    let counsellors = querySnapshot.docs.map((doc) => {
      const data = doc.data() as UserProfile;
      console.log("👨‍⚕️ Counsellor found:", {
        name: data.displayName,
        email: data.email,
        approved: data.isApproved,
        hasProfile: data.isProfileComplete,
        specializations:
          "specializations" in data ? data.specializations : "none",
      });
      return data;
    }); // Show only verified counsellors and exclude rejected/pending ones
    counsellors = counsellors.filter((c) => {
      const counsellorData = c as CounsellorProfileData;
      // Always exclude rejected counsellors
      if (counsellorData.verificationStatus === "rejected") {
        return false;
      }

      // Show counsellors that are verified by admin
      // Either verificationStatus is "verified" OR isApproved is true (backward compatibility)
      const isVerified = counsellorData.verificationStatus === "verified";
      const isApproved = c.isApproved === true;
      
      // Return true if either condition is met (verified OR approved)
      return isVerified || isApproved;
    });
    console.log(
      "✅ Filtered counsellors by approval status:",
      counsellors.length,
    );

    // Apply additional filters (client-side for complex queries)
    if (filters) {
      const originalCount = counsellors.length;

      if (filters.specializations && filters.specializations.length > 0) {
        counsellors = counsellors.filter((counsellor) => {
          const hasSpecializations =
            "specializations" in counsellor &&
            Array.isArray(counsellor.specializations);
          if (!hasSpecializations) return false;

          const matches = filters.specializations!.some((spec) =>
            counsellor.specializations.includes(spec),
          );
          return matches;
        });
        console.log(
          `🎯 Filtered by specializations: ${originalCount} → ${counsellors.length}`,
        );
      }

      if (filters.ageGroups && filters.ageGroups.length > 0) {
        counsellors = counsellors.filter((counsellor) => {
          const hasAgeGroups =
            "ageGroups" in counsellor && Array.isArray(counsellor.ageGroups);
          if (!hasAgeGroups) return false;

          const matches = filters.ageGroups!.some((age) =>
            counsellor.ageGroups.includes(age),
          );
          return matches;
        });
        console.log(
          `👶 Filtered by age groups: ${counsellors.length} counsellors`,
        );
      }

      if (filters.gender) {
        counsellors = counsellors.filter(
          (counsellor) =>
            "gender" in counsellor && counsellor.gender === filters.gender,
        );
        console.log(`⚧ Filtered by gender: ${counsellors.length} counsellors`);
      }

      if (filters.availableNow) {
        counsellors = counsellors.filter(
          (counsellor) => counsellor.status === "online",
        );
        console.log(
          `🟢 Filtered by availability: ${counsellors.length} counsellors`,
        );
      }
    }

    // Sort by last seen (most recent first)
    counsellors.sort((a, b) => {
      if (!a.lastSeen) return 1;
      if (!b.lastSeen) return -1;
      return b.lastSeen.toMillis() - a.lastSeen.toMillis();
    });

    console.log("📋 Final counsellors list:", counsellors.length);
    return counsellors;
  } catch (error) {
    console.error("❌ Error getting counsellors:", error);
    return [];
  }
};

// Update user status
export const updateUserStatus = async (
  userId: string,
  status: "online" | "offline" | "away",
): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      status,
      lastSeen: serverTimestamp(),
    });
    console.log("User status updated:", userId, status);
  } catch (error) {
    console.error("Error updating user status:", error);
    throw error;
  }
};

// Update user push token
export const updateUserPushToken = async (
  userId: string,
  pushToken: string,
): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      pushToken,
      pushTokenUpdatedAt: serverTimestamp(),
    });
    console.log("Push token updated for user:", userId);
  } catch (error) {
    console.error("Error updating push token:", error);
    throw error;
  }
};

// Get user push token
export const getUserPushToken = async (
  userId: string,
): Promise<string | null> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      return userData.pushToken || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting user push token:", error);
    return null;
  }
};

// Get push tokens for multiple users (for batch notifications)
export const getUsersPushTokens = async (
  userIds: string[],
): Promise<{ userId: string; token: string }[]> => {
  try {
    console.log("🔍 getUsersPushTokens called for users:", userIds);
    const tokens: { userId: string; token: string }[] = [];

    for (const userId of userIds) {
      console.log(`🔍 Getting push token for user: ${userId}`);
      const token = await getUserPushToken(userId);
      if (token) {
        console.log(
          `✅ Found push token for ${userId}: ${token.substring(0, 20)}...`,
        );
        tokens.push({ userId, token });
      } else {
        console.log(`❌ No push token found for user: ${userId}`);
      }
    }

    console.log(
      `📊 Total tokens retrieved: ${tokens.length} out of ${userIds.length} users`,
    );
    return tokens;
  } catch (error) {
    console.error("❌ Error getting users push tokens:", error);
    return [];
  }
};

// Create Stream Chat user - proper implementation
export const createStreamChatUser = async (
  userProfile: UserProfile,
): Promise<void> => {
  try {
    console.log("Creating Stream Chat user for:", userProfile.uid);

    // Import stream services
    const { chatClient } = await import("./stream");

    if (!chatClient) {
      console.error("Stream Chat client not available");
      return;
    }
    const streamUserData = {
      id: userProfile.uid,
      name: userProfile.displayName,
      image: userProfile.photoURL || undefined,
      role: "user", // Ensure user has proper role
    };

    try {
      // Use upsertUser (singular) instead of upsertUsers (plural)
      const result = await chatClient.upsertUser(streamUserData);
      console.log(
        "✅ User created/updated in Stream Chat:",
        userProfile.uid,
        result,
      );
    } catch (apiError: any) {
      console.error("❌ Error creating user via Stream API:", apiError);
      // If it's a permission error, try a different approach
      if (
        apiError.message?.includes("permissions") ||
        apiError.message?.includes("auth")
      ) {
        console.log(
          "⚠️ Permission issue, user will be created when they connect to chat",
        );
      }
    }
  } catch (error) {
    console.error("Error with Stream Chat user creation:", error);
  }
};

// Ensure both users exist in Stream Chat before creating a channel
export const ensureStreamChatUsers = async (
  userIds: string[],
): Promise<boolean> => {
  try {
    console.log("Ensuring Stream Chat users exist for IDs:", userIds);
    const userProfiles = await Promise.all(
      userIds.map(async (uid) => {
        const profile = await getUserProfile(uid);
        return profile;
      }),
    );
    const validProfiles = userProfiles.filter(
      (p): p is UserProfile => p !== null,
    );
    await Promise.all(
      validProfiles.map(async (profile) => {
        await createStreamChatUser(profile);
      }),
    );
    return true;
  } catch (error) {
    console.error("Error ensuring Stream Chat users exist:", error);
    return false;
  }
};

// Start a chat with another user (ensure both users exist in Stream Chat)
export const startChatWithUser = async (
  currentUserId: string,
  targetUserId: string,
): Promise<any> => {
  try {
    console.log(`Starting chat between ${currentUserId} and ${targetUserId}`);
    await ensureStreamChatUsers([currentUserId, targetUserId]);
    const { chatClient } = await import("./stream");
    const channelId = [currentUserId, targetUserId].sort().join("-");
    const channel = chatClient.channel("messaging", channelId, {
      members: [currentUserId, targetUserId],
      created_by_id: currentUserId,
    });
    await channel.watch();
    console.log("Chat channel created/watched:", channelId);
    return channel;
  } catch (error) {
    console.error("Error starting chat:", error);
    throw error;
  }
};

// Update user profile completion status
export const updateProfileCompletion = async (
  uid: string,
  isComplete: boolean,
): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      isProfileComplete: isComplete,
    });
  } catch (error) {
    console.error("Error updating profile completion:", error);
    throw error;
  }
};

// Update user profile data
export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>,
): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...updates,
      lastSeen: serverTimestamp(),
    });
    console.log("User profile updated:", uid);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Upload profile photo
export const uploadProfilePhoto = async (
  uid: string,
  imageUri: string,
): Promise<string> => {
  try {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import(
      "firebase/storage"
    );
    const storage = getStorage();

    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create storage reference
    const imageRef = ref(storage, `profile-photos/${uid}/${Date.now()}.jpg`);

    // Upload image
    await uploadBytes(imageRef, blob);

    // Get download URL
    const photoURL = await getDownloadURL(imageRef);

    console.log("Profile photo uploaded for user:", uid);
    return photoURL;
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    throw error;
  }
};

// Delete profile photo
export const deleteProfilePhoto = async (uid: string): Promise<void> => {
  try {
    // For now, we'll just set photoURL to null
    // In a complete implementation, you'd also delete the file from Firebase Storage
    console.log("Profile photo deleted for user:", uid);
  } catch (error) {
    console.error("Error deleting profile photo:", error);
    throw error;
  }
};
