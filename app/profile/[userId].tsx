import "@/app/global.css";
import ReviewDisplay from "@/components/profile/ReviewDisplay";
import ReviewSubmission from "@/components/profile/ReviewSubmission";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useVideo } from "@/context/VideoContext";
import { getUserProfile } from "@/services/userService";
import { CounsellorProfileData, UserProfile } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const isCounsellor = userData?.role === "counsellor";
  const isUserProfile = userData?.role === "user";
  const counsellorData = userData as CounsellorProfileData;
  const userProfileData = userData as any; // UserProfileData type
  const isOwnProfile = user?.uid === userId;
  const canReview = user && !isOwnProfile && isCounsellor;

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

  const startChat2 = async (targetUser: UserProfile) => {
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
  const generateCallId = () => {
    // Generate unique call ID for ring calls as recommended by Stream.io
    return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleStartCall = async () => {
    if (!user?.uid || !userData) {
      Alert.alert("Error", "Unable to start call. Please try again.");
      return;
    }
    try {
      const callId = generateCallId();
      console.log(
        "Starting voice call with:",
        userData.displayName,
        "Call ID:",
        callId,
      );

      // Create voice call
      const call = await createCall(callId, [userData.uid], false);
      if (!call) {
        throw new Error("Failed to create call");
      }

      console.log("Voice call created, navigating to call screen");
      // Navigate to call screen
      router.push({
        pathname: "/call/[callId]",
        params: {
          callId: call.id,
          callType: call.type,
          isVideo: "false",
        },
      });
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
      const callId = generateCallId();
      console.log(
        "Starting video call with:",
        userData.displayName,
        "Call ID:",
        callId,
      );

      // Create video call
      const call = await createCall(callId, [userData.uid], true);
      if (!call) {
        throw new Error("Failed to create call");
      }

      console.log("Video call created, navigating to call screen");
      // Navigate to call screen
      router.push({
        pathname: "/call/[callId]",
        params: {
          callId: call.id,
          callType: call.type,
          isVideo: "true",
        },
      });
    } catch (error) {
      console.error("Error starting video call:", error);
      Alert.alert(
        "Error",
        "Failed to start video call. Please check your connection and try again.",
      );
    }
  };

  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    // Refresh the profile to update review stats
    if (userId) {
      const loadUserData = async () => {
        try {
          const profile = await getUserProfile(userId as string);
          if (profile) {
            setUserData(profile);
          }
        } catch (error) {
          console.error("Error refreshing profile:", error);
        }
      };
      loadUserData();
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
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-full hover:bg-accent"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">
            {isUserProfile ? "Client Profile" : "Profile"}
          </Text>
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

              {/* Show counsellor professional info */}
              {isCounsellor && (
                <>
                  <Text className="text-muted-foreground mb-2">
                    {counsellorData.licenseType}
                    {counsellorData.yearsExperience} years experience
                  </Text>
                  {/* Verification Badge */}
                  {counsellorData.verificationStatus === "verified" && (
                    <View className="flex-row items-center mb-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="#059669"
                      />
                      <Text className="ml-1 text-green-600">
                        Verified Professional
                      </Text>
                    </View>
                  )}

                  {/* Rating Display */}
                  {counsellorData.averageRating && (
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text className="ml-1 text-foreground font-medium">
                        {counsellorData.averageRating.toFixed(1)}
                      </Text>
                      <Text className="text-muted-foreground ml-1">
                        ({counsellorData.totalReviews || 0} reviews)
                      </Text>
                    </View>
                  )}
                </>
              )}

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
          {/* Professional Information for Counsellors */}
          {isCounsellor && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">License</Text>
                  <Text className="text-foreground font-medium">
                    {counsellorData.licenseType} #{counsellorData.licenseNumber}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Experience</Text>
                  <Text className="text-foreground font-medium">
                    {counsellorData.yearsExperience} years
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Rate</Text>
                  <Text className="text-foreground font-medium">
                    ${counsellorData.hourlyRate}/hour
                  </Text>
                </View>
                {counsellorData.specializations &&
                  counsellorData.specializations.length > 0 && (
                    <View>
                      <Text className="text-muted-foreground mb-2">
                        Specializations
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {counsellorData.specializations
                          .slice(0, 4)
                          .map((spec, index) => (
                            <View
                              key={index}
                              className="px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700"
                            >
                              <Text className="text-gray-700 dark:text-gray-300 text-sm">
                                {spec
                                  .replace("-", " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Text>
                            </View>
                          ))}
                      </View>
                    </View>
                  )}
              </CardContent>
            </Card>
          )}
          {/* User Information for Counsellors */}
          {isUserProfile && !isOwnProfile && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userProfileData.firstName && userProfileData.lastName && (
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Full Name</Text>
                    <Text className="text-foreground font-medium">
                      {userProfileData.firstName} {userProfileData.lastName}
                    </Text>
                  </View>
                )}
                {userProfileData.gender && (
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Gender</Text>
                    <Text className="text-foreground font-medium capitalize">
                      {userProfileData.gender === "prefer-not-to-say"
                        ? "Prefer not to say"
                        : userProfileData.gender}
                    </Text>
                  </View>
                )}
                {userProfileData.preferredSessionType && (
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">
                      Preferred Session Type
                    </Text>
                    <Text className="text-foreground font-medium capitalize">
                      {userProfileData.preferredSessionType}
                    </Text>
                  </View>
                )}
                {userProfileData.primaryConcerns &&
                  userProfileData.primaryConcerns.length > 0 && (
                    <View>
                      <Text className="text-muted-foreground mb-2">
                        Primary Concerns
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {userProfileData.primaryConcerns
                          .slice(0, 4)
                          .map((concern: string, index: number) => (
                            <View
                              key={index}
                              className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800"
                            >
                              <Text className="text-blue-700 dark:text-blue-300 text-sm">
                                {concern
                                  .replace("-", " ")
                                  .replace(/\b\w/g, (l: string) =>
                                    l.toUpperCase(),
                                  )}
                              </Text>
                            </View>
                          ))}
                      </View>
                    </View>
                  )}
                {userProfileData.severityLevel && (
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">
                      Severity Level
                    </Text>
                    <View
                      className={`px-3 py-1 rounded-full border ${
                        userProfileData.severityLevel === "severe"
                          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                          : userProfileData.severityLevel === "moderate"
                            ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          userProfileData.severityLevel === "severe"
                            ? "text-red-700 dark:text-red-300"
                            : userProfileData.severityLevel === "moderate"
                              ? "text-yellow-700 dark:text-yellow-300"
                              : "text-green-700 dark:text-green-300"
                        }`}
                      >
                        {userProfileData.severityLevel.charAt(0).toUpperCase() +
                          userProfileData.severityLevel.slice(1)}
                      </Text>
                    </View>
                  </View>
                )}
                {userProfileData.previousTherapy !== undefined && (
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">
                      Previous Therapy
                    </Text>
                    <Text className="text-foreground font-medium">
                      {userProfileData.previousTherapy ? "Yes" : "No"}
                    </Text>
                  </View>
                )}
                {userProfileData.preferredLanguage && (
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">
                      Preferred Language
                    </Text>
                    <Text className="text-foreground font-medium">
                      {userProfileData.preferredLanguage}
                    </Text>
                  </View>
                )}
                {userProfileData.availableHours && (
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Availability</Text>
                    <Text className="text-foreground font-medium">
                      {userProfileData.availableHours.start}
                      {userProfileData.availableHours.end}
                    </Text>
                  </View>
                )}
                {/* Crisis Information - only show to counsellors with appropriate warning */}
                {userProfileData.inCrisis && (
                  <View className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="warning" size={16} color="#DC2626" />
                      <Text className="text-red-700 dark:text-red-300 font-semibold ml-2">
                        Crisis Alert
                      </Text>
                    </View>
                    <Text className="text-red-600 dark:text-red-400 text-sm">
                      This client has indicated they are in crisis. Please
                      prioritize immediate support and follow crisis
                      intervention protocols.
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>
          )}
          {/* Action Buttons */}
          {!isOwnProfile && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Connect</CardTitle>
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
                    <Text className="text-foreground font-semibold">
                      Message
                    </Text>
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
                      Contact
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                      Start a call
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>


                {/* Review Button for Counsellors */}
                {canReview && (
                  <TouchableOpacity
                    onPress={() => setShowReviewModal(true)}
                    className="flex-row items-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                  >
                    <View className="w-12 h-12 bg-yellow-500 rounded-full items-center justify-center mr-4">
                      <Ionicons name="star" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">
                        Write Review
                      </Text>
                      <Text className="text-muted-foreground text-sm">
                        Share your experience
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                )}
              </CardContent>
            </Card>
          )}
          {/* Reviews Section for Counsellors */}
          {isCounsellor && (
            <ReviewDisplay
              counsellorId={userData.uid}
              onWriteReview={() => setShowReviewModal(true)}
              showWriteReviewButton={!!canReview}
            />
          )}
          {/* Professional Actions for Counsellors viewing Users */}
          {isUserProfile && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <TouchableOpacity
                  onPress={() => {
                    // Navigate to session scheduling
                    Alert.alert(
                      "Schedule Session",
                      "This would navigate to session scheduling with this client.",
                    );
                  }}
                  className="flex-row items-center p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"
                >
                  <View className="w-12 h-12 bg-indigo-500 rounded-full items-center justify-center mr-4">
                    <Ionicons name="calendar" size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">
                      Schedule Session
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                      Book a therapy session
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    // Navigate to client notes
                    Alert.alert(
                      "Client Notes",
                      "This would open the client notes and treatment history.",
                    );
                  }}
                  className="flex-row items-center p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800"
                >
                  <View className="w-12 h-12 bg-teal-500 rounded-full items-center justify-center mr-4">
                    <Ionicons name="document-text" size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">
                      Client Notes
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                      View treatment notes & history
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                {userProfileData.inCrisis && (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        "Crisis Intervention",
                        "This would open crisis intervention protocols and emergency contacts.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Emergency Resources",
                            onPress: () => {
                              // Open emergency resources
                            },
                          },
                        ],
                      );
                    }}
                    className="flex-row items-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  >
                    <View className="w-12 h-12 bg-red-500 rounded-full items-center justify-center mr-4">
                      <Ionicons name="medical" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">
                        Crisis Support
                      </Text>
                      <Text className="text-muted-foreground text-sm">
                        Emergency intervention protocols
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                )}
              </CardContent>
            </Card>
          )}
        </View>

        {/* Review Submission Modal */}
        <Modal
          visible={showReviewModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowReviewModal(false)}
        >
          <SafeAreaView className="flex-1 bg-background">
            <ReviewSubmission
              counsellorId={userData.uid}
              counsellorName={userData.displayName}
              onReviewSubmitted={handleReviewSubmitted}
              onCancel={() => setShowReviewModal(false)}
            />
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}
