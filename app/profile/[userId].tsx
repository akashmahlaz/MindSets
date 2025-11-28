import "@/app/global.css";
import ReviewDisplay from "@/components/profile/ReviewDisplay";
import ReviewSubmission from "@/components/profile/ReviewSubmission";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useVideo } from "@/context/VideoContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { getUserProfile } from "@/services/userService";
import { CounsellorProfileData, UserProfile } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Modal,
    ScrollView,
    StatusBar,
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
  const { isDarkColorScheme } = useColorScheme();
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

  // Premium animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Premium Material Design 3 colors
  const colors = {
    background: isDarkColorScheme ? "#0F172A" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#334155" : "#F1F5F9",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#6366F1",
    primaryLight: "#818CF8",
    primaryContainer: isDarkColorScheme ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.08)",
    secondary: "#10B981",
    secondaryContainer: isDarkColorScheme ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.08)",
    accent: "#8B5CF6",
    accentContainer: isDarkColorScheme ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.08)",
    purple: "#8B5CF6",
    warning: "#F59E0B",
    warningContainer: isDarkColorScheme ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.08)",
    error: "#EF4444",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
  };

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
      router.push(`/(main)/chat/${channel.id}` as any);
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
      router.push(`/(main)/chat/${channel.id}` as any);
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
        isVideo: false,
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
        isVideo: true,
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <View style={{ flex: 1 }}>
          {/* Header Skeleton */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceVariant }} />
            <View style={{ width: 100, height: 20, borderRadius: 10, backgroundColor: colors.surfaceVariant }} />
            <View style={{ width: 40 }} />
          </View>

          <View style={{ flex: 1, padding: 20 }}>
            {/* Profile Card Skeleton */}
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 24,
              alignItems: 'center',
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surfaceVariant, marginBottom: 16 }} />
              <View style={{ width: 150, height: 24, borderRadius: 12, backgroundColor: colors.surfaceVariant, marginBottom: 8 }} />
              <View style={{ width: 200, height: 16, borderRadius: 8, backgroundColor: colors.surfaceVariant }} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  } // Only show error state if loading is complete AND there's an error AND no userData
  if (!loading && (!userData || error)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.surfaceVariant,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <Ionicons name="person-circle-outline" size={50} color={colors.textSecondary} />
        </View>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
          User not found
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          This user may not exist or has been removed.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Only render profile if we have userData
  if (!userData) {
    return null; // This should not happen, but prevents TypeScript errors
  }
  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          {/* Premium Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.surfaceVariant,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              {isUserProfile ? "Client Profile" : "Profile"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={{ padding: 20 }}>
            {/* Premium Profile Card */}
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 24,
              marginBottom: 16,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}>
              <View style={{ position: 'relative', marginBottom: 16 }}>
                {userData.photoURL ? (
                  <Avatar className="w-24 h-24" alt={userData.displayName || "User Avatar"}>
                    <AvatarImage source={{ uri: userData.photoURL }} />
                    <AvatarFallback style={{ backgroundColor: colors.primaryContainer }}>
                      <Text style={{ color: colors.primary, fontSize: 28, fontWeight: 'bold' }}>
                        {getInitials(userData.displayName)}
                      </Text>
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' }}>
                      {getInitials(userData.displayName)}
                    </Text>
                  </LinearGradient>
                )}
                <View style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: userData.status === 'online' ? colors.secondary : colors.warning,
                  borderWidth: 3,
                  borderColor: colors.surface,
                }} />
              </View>

              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                {userData.displayName}
              </Text>

              {/* Show counsellor professional info */}
              {isCounsellor && (
                <>
                  <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
                    {counsellorData.licenseType} • {counsellorData.yearsExperience} years experience
                  </Text>
                  {/* Verification Badge */}
                  {counsellorData.verificationStatus === "verified" && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: colors.secondaryContainer,
                      borderRadius: 20,
                    }}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.secondary} />
                      <Text style={{ marginLeft: 6, color: colors.secondary, fontWeight: '600' }}>Verified Professional</Text>
                    </View>
                  )}

                  {/* Rating Display */}
                  {counsellorData.averageRating && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Ionicons name="star" size={18} color={colors.warning} />
                      <Text style={{ marginLeft: 4, color: colors.text, fontWeight: '700', fontSize: 16 }}>
                        {counsellorData.averageRating.toFixed(1)}
                      </Text>
                      <Text style={{ color: colors.textSecondary, marginLeft: 6 }}>
                        ({counsellorData.totalReviews || 0} reviews)
                      </Text>
                    </View>
                  )}
                </>
              )}

              <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>{userData.email}</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: userData.status === 'online' ? colors.secondary : colors.warning,
                  marginRight: 6,
                }} />
                <Text style={{ fontSize: 14, color: colors.textSecondary, textTransform: 'capitalize' }}>
                  {userData.status}
                </Text>
              </View>
            </View>
          {/* Professional Information for Counsellors */}
          {isCounsellor && (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.primaryContainer,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>Professional Information</Text>
              </View>

              <View style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary }}>License</Text>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>
                    {counsellorData.licenseType} #{counsellorData.licenseNumber}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary }}>Experience</Text>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{counsellorData.yearsExperience} years</Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary }}>Rate</Text>
                  <View style={{
                    backgroundColor: colors.primaryContainer,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 10,
                  }}>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>${counsellorData.hourlyRate}/hour</Text>
                  </View>
                </View>
                {counsellorData.specializations && counsellorData.specializations.length > 0 && (
                  <>
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                    <View>
                      <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>Specializations</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {counsellorData.specializations.slice(0, 4).map((spec, index) => (
                          <View key={index} style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: colors.surfaceVariant,
                            borderRadius: 16,
                          }}>
                            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>
                              {spec.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}
          {/* User Information for Counsellors */}
          {isUserProfile && !isOwnProfile && (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.secondaryContainer,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="person-outline" size={18} color={colors.secondary} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>Client Information</Text>
              </View>

              <View style={{ gap: 14 }}>
                {userProfileData.firstName && userProfileData.lastName && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.textSecondary }}>Full Name</Text>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>
                      {userProfileData.firstName} {userProfileData.lastName}
                    </Text>
                  </View>
                )}
                {userProfileData.gender && (
                  <>
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.textSecondary }}>Gender</Text>
                      <Text style={{ color: colors.text, fontWeight: '600', textTransform: 'capitalize' }}>
                        {userProfileData.gender === "prefer-not-to-say" ? "Prefer not to say" : userProfileData.gender}
                      </Text>
                    </View>
                  </>
                )}
                {userProfileData.preferredSessionType && (
                  <>
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.textSecondary }}>Preferred Session Type</Text>
                      <Text style={{ color: colors.text, fontWeight: '600', textTransform: 'capitalize' }}>
                        {userProfileData.preferredSessionType}
                      </Text>
                    </View>
                  </>
                )}
                {userProfileData.primaryConcerns && userProfileData.primaryConcerns.length > 0 && (
                  <>
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                    <View>
                      <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>Primary Concerns</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {userProfileData.primaryConcerns.slice(0, 4).map((concern: string, index: number) => (
                          <View key={index} style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: colors.primaryContainer,
                            borderRadius: 16,
                          }}>
                            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>
                              {concern.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                )}
                {userProfileData.severityLevel && (
                  <>
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.textSecondary }}>Severity Level</Text>
                      <View style={{
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 10,
                        backgroundColor: userProfileData.severityLevel === "severe" 
                          ? "#FEE2E2" 
                          : userProfileData.severityLevel === "moderate" 
                            ? "#FEF3C7" 
                            : "#D1FAE5",
                      }}>
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: userProfileData.severityLevel === "severe" 
                            ? "#DC2626" 
                            : userProfileData.severityLevel === "moderate" 
                              ? "#D97706" 
                              : "#059669",
                        }}>
                        {userProfileData.severityLevel.charAt(0).toUpperCase() +
                          userProfileData.severityLevel.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
                {userProfileData.previousTherapy !== undefined && (
                  <>
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.textSecondary }}>Previous Therapy</Text>
                      <Text style={{ color: colors.text, fontWeight: '600' }}>
                        {userProfileData.previousTherapy ? "Yes" : "No"}
                      </Text>
                    </View>
                  </>
                )}
                {userProfileData.preferredLanguage && (
                  <>
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.textSecondary }}>Preferred Language</Text>
                      <Text style={{ color: colors.text, fontWeight: '600' }}>
                        {userProfileData.preferredLanguage}
                      </Text>
                    </View>
                  </>
                )}
                {userProfileData.availableHours && (
                  <>
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.textSecondary }}>Availability</Text>
                      <Text style={{ color: colors.text, fontWeight: '600' }}>
                        {userProfileData.availableHours.start} - {userProfileData.availableHours.end}
                      </Text>
                    </View>
                  </>
                )}
                {/* Crisis Information - only show to counsellors with appropriate warning */}
                {userProfileData.inCrisis && (
                  <View style={{
                    marginTop: 8,
                    padding: 14,
                    backgroundColor: '#FEF2F2',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#FECACA',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Ionicons name="warning" size={18} color="#DC2626" />
                      <Text style={{ color: '#DC2626', fontWeight: '700', marginLeft: 8, fontSize: 15 }}>
                        Crisis Alert
                      </Text>
                    </View>
                    <Text style={{ color: '#991B1B', fontSize: 13, lineHeight: 18 }}>
                      This client has indicated they are in crisis. Please prioritize immediate support and follow crisis intervention protocols.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* Action Buttons */}
          {!isOwnProfile && (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.accentContainer,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="link-outline" size={18} color={colors.accent} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>Connect</Text>
              </View>
              
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={() => startChat(userData)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: colors.primaryContainer,
                  }}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 14,
                    }}
                  >
                    <Ionicons name="chatbubble" size={22} color="white" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>Message</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Send a message</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleStartCall}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: colors.secondaryContainer,
                  }}
                >
                  <LinearGradient
                    colors={[colors.secondary, '#34D399']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 14,
                    }}
                  >
                    <Ionicons name="call" size={22} color="white" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>Contact</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Start a call</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Review Button for Counsellors */}
                {canReview && (
                  <TouchableOpacity
                    onPress={() => setShowReviewModal(true)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: colors.warningContainer,
                    }}
                  >
                    <LinearGradient
                      colors={['#F59E0B', '#FBBF24']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 14,
                      }}
                    >
                      <Ionicons name="star" size={22} color="white" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>Write Review</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Share your experience</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
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
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.accentContainer,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="medical-outline" size={18} color={colors.accent} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>Actions</Text>
              </View>
              
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    // Navigate to session scheduling
                    Alert.alert(
                      "Schedule Session",
                      "This would navigate to session scheduling with this client.",
                    );
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: colors.accentContainer,
                  }}
                >
                  <LinearGradient
                    colors={[colors.accent, '#A78BFA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 14,
                    }}
                  >
                    <Ionicons name="calendar" size={22} color="white" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>Schedule Session</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Book a therapy session</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    // Navigate to client notes
                    Alert.alert(
                      "Client Notes",
                      "This would open the client notes and treatment history.",
                    );
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: colors.secondaryContainer,
                  }}
                >
                  <LinearGradient
                    colors={['#14B8A6', '#2DD4BF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 14,
                    }}
                  >
                    <Ionicons name="document-text" size={22} color="white" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>Client Notes</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>View treatment notes & history</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: '#FEF2F2',
                    }}
                  >
                    <LinearGradient
                      colors={['#EF4444', '#F87171']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 14,
                      }}
                    >
                      <Ionicons name="medical" size={22} color="white" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>Crisis Support</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Emergency intervention protocols</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Review Submission Modal */}
        <Modal
          visible={showReviewModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowReviewModal(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
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
    </Animated.View>
  );
}
