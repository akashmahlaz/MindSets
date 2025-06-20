import "@/app/global.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useVideo } from "@/context/VideoContext";
import { getUserProfile } from "@/services/userService";
import { UserProfile } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { chatClient, isChatConnected, connectToChat } = useChat();
  const { createCall } = useVideo();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        console.log("No userId provided");
        setError(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        console.log("Loading user data for:", userId);

        // Load user profile data
        const profile = await getUserProfile(userId as string);

        // Also fetch user from Stream Chat if chatClient is available
        let streamUser = null;
        if (chatClient) {
          try {
            const response = await chatClient.queryUsers({
              id: userId as string,
            });
            if (response.users.length > 0) {
              streamUser = response.users[0];
              setProfileUser(streamUser);
            }
          } catch (streamError) {
            console.error("Error fetching Stream user:", streamError);
            // Don't fail the whole operation if Stream fails
          }
        }

        if (profile) {
          setUserData(profile);
          console.log("User data loaded:", profile);
        } else {
          console.log("User not found:", userId);
          setError(true);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId, chatClient]);
  const startChat = async (targetUser: UserProfile) => {
    if (!user || !chatClient) {
      Alert.alert("Error", "Chat not available");
      return;
    }

    if (!isChatConnected) {
      try {
        await connectToChat();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        Alert.alert("Error", "Failed to connect to chat");
        return;
      }
    }

    try {
      const { createOrGetDirectChannel } = await import(
        "@/services/chatHelpers"
      );
      const channel = await createOrGetDirectChannel(user, targetUser.uid);
      router.push(`/chat/${channel.id}` as any);
    } catch (error) {
      Alert.alert(
        "Chat Error",
        `Failed to start chat with ${targetUser.displayName}. Please try again.`,
      );
    }
  };
  const generateCallId = (user1: string, user2: string) => {
    return [user1, user2].sort().join("-");
  };

  const handleStartCall = async () => {
    if (!user?.uid || !userData) {
      Alert.alert("Error", "Unable to start call. Please try again.");
      return;
    }

    try {
      const callId = generateCallId(user.uid, userData.uid);
      const call = await createCall(callId, [userData.uid], false); // Voice call

      if (!call) {
        throw new Error("Failed to create call");
      }
    } catch (error) {
      console.error("Error starting voice call:", error);
      Alert.alert(
        "Error",
        "Failed to start call. Please check your connection and try again.",
      );
    }
  };

  const handleStartVideoCall = async () => {
    if (!user?.uid || !userData) {
      Alert.alert("Error", "Unable to start video call. Please try again.");
      return;
    }

    try {
      const callId = generateCallId(user.uid, userData.uid);
      const call = await createCall(callId, [userData.uid], true); // Video call

      if (!call) {
        throw new Error("Failed to create call");
      }
    } catch (error) {
      console.error("Error starting video call:", error);
      Alert.alert(
        "Error",
        "Failed to start video call. Please check your connection and try again.",
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-1">
          {/* Header Skeleton */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-20 h-6 rounded" />
            <View className="w-10" />
          </View>

          <View className="flex-1 px-4 py-6">
            {/* Profile Card Skeleton */}
            <Card className="mb-6">
              <CardContent className="items-center py-8">
                {/* Avatar Skeleton */}
                <View className="relative mb-4">
                  <Skeleton className="w-24 h-24 rounded-full" />
                  <Skeleton className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full" />
                </View>

                {/* Name and Email Skeleton */}
                <Skeleton className="w-32 h-7 rounded mb-2" />
                <Skeleton className="w-40 h-5 rounded mb-2" />

                {/* Status Skeleton */}
                <View className="flex-row items-center">
                  <Skeleton className="w-2 h-2 rounded-full mr-2" />
                  <Skeleton className="w-16 h-4 rounded" />
                </View>
              </CardContent>
            </Card>

            {/* Action Buttons Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="w-20 h-6 rounded" />
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Message Button Skeleton */}
                <View className="flex-row items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                  <Skeleton className="w-12 h-12 rounded-full mr-4" />
                  <View className="flex-1">
                    <Skeleton className="w-20 h-5 rounded mb-1" />
                    <Skeleton className="w-28 h-4 rounded" />
                  </View>
                  <Skeleton className="w-5 h-5 rounded" />
                </View>

                {/* Voice Call Button Skeleton */}
                <View className="flex-row items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                  <Skeleton className="w-12 h-12 rounded-full mr-4" />
                  <View className="flex-1">
                    <Skeleton className="w-24 h-5 rounded mb-1" />
                    <Skeleton className="w-32 h-4 rounded" />
                  </View>
                  <Skeleton className="w-5 h-5 rounded" />
                </View>

                {/* Video Call Button Skeleton */}
                <View className="flex-row items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                  <Skeleton className="w-12 h-12 rounded-full mr-4" />
                  <View className="flex-1">
                    <Skeleton className="w-26 h-5 rounded mb-1" />
                    <Skeleton className="w-30 h-4 rounded" />
                  </View>
                  <Skeleton className="w-5 h-5 rounded" />
                </View>
              </CardContent>
            </Card>
          </View>
        </View>
      </SafeAreaView>
    );
  } // Only show error state if loading is complete AND there's an error AND no userData
  if (!loading && (!userData || error)) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center px-6">
        <Ionicons name="person-circle-outline" size={80} color="#9CA3AF" />
        <Text className="text-foreground text-xl font-semibold mt-4">
          User not found
        </Text>
        <Text className="text-muted-foreground text-center mt-2">
          This user may not exist or has been removed.
        </Text>
        <Button
          onPress={() => router.back()}
          className="mt-6"
          variant="outline"
        >
          <Text>Go Back</Text>
        </Button>
      </SafeAreaView>
    );
  }

  // Only render profile if we have userData
  if (!userData) {
    return null; // This should not happen, but prevents TypeScript errors
  }

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-full hover:bg-accent"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">Profile</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 px-4 py-6">
          {/* Profile Card */}
          <Card className="mb-6">
            <CardContent className="items-center py-8">
              <View className="relative mb-4">
                <Avatar
                  className="w-24 h-24"
                  alt={userData.displayName || "User Avatar"}
                >
                  <AvatarImage
                    source={{ uri: userData.photoURL || undefined }}
                  />
                  <AvatarFallback className="bg-primary">
                    <Text className="text-primary-foreground text-2xl font-bold">
                      {getInitials(userData.displayName)}
                    </Text>
                  </AvatarFallback>
                </Avatar>
                <View
                  className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-card ${getStatusColor(userData.status)}`}
                />
              </View>

              <Text className="text-2xl font-bold text-foreground mb-1">
                {userData.displayName}
              </Text>
              <Text className="text-muted-foreground mb-2">
                {userData.email}
              </Text>
              <View className="flex-row items-center">
                <View
                  className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(userData.status)}`}
                />
                <Text className="text-sm text-muted-foreground capitalize">
                  {userData.status}
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <Text className="text-lg font-semibold text-foreground">
                Connect
              </Text>
            </CardHeader>
            <CardContent className="space-y-3">
              <TouchableOpacity
                onPress={() => startChat(userData)}
                className="flex-row items-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
              >
                <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-4">
                  <Ionicons name="chatbubble" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">Message</Text>
                  <Text className="text-muted-foreground text-sm">
                    Send a message
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleStartCall}
                className="flex-row items-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              >
                <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center mr-4">
                  <Ionicons name="call" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">
                    Voice Call
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    Start a voice call
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleStartVideoCall}
                className="flex-row items-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
              >
                <View className="w-12 h-12 bg-purple-500 rounded-full items-center justify-center mr-4">
                  <Ionicons name="videocam" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">
                    Video Call
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    Start a video call
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </CardContent>
          </Card>
        </View>
      </View>
    </SafeAreaView>
  );
}
