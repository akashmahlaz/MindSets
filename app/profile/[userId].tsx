import "@/app/global.css";
import ReviewDisplay from "@/components/profile/ReviewDisplay";
import ReviewSubmission from "@/components/profile/ReviewSubmission";
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
    Dimensions,
    Image,
    Modal,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.42;

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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const isCounsellor = userData?.role === "counsellor";
  const isUserProfile = userData?.role === "user";
  const counsellorData = userData as CounsellorProfileData;
  const userProfileData = userData as any;
  const isOwnProfile = user?.uid === userId;
  const canReview = user && !isOwnProfile && isCounsellor;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const colors = {
    background: isDarkColorScheme ? "#0F1117" : "#F5F7FA",
    cardBg: isDarkColorScheme ? "#1A1D24" : "#FFFFFF",
    text: isDarkColorScheme ? "#F3F4F6" : "#1F2937",
    textSecondary: isDarkColorScheme ? "#9CA3AF" : "#6B7280",
    primary: "#2AA79D",
    primaryLight: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.1)",
    border: isDarkColorScheme ? "#2D3139" : "#E5E7EB",
    skeleton: isDarkColorScheme ? "#2D3139" : "#E5E7EB",
    surface: isDarkColorScheme ? "#1A1D24" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#252830" : "#F3F4F6",
    primaryContainer: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.1)",
    secondaryContainer: isDarkColorScheme ? "rgba(96, 165, 250, 0.15)" : "rgba(96, 165, 250, 0.1)",
    secondary: "#60A5FA",
    warningContainer: isDarkColorScheme ? "rgba(251, 191, 36, 0.15)" : "rgba(251, 191, 36, 0.1)",
    warning: "#FBBF24",
    accentContainer: isDarkColorScheme ? "rgba(168, 85, 247, 0.15)" : "rgba(168, 85, 247, 0.1)",
    accent: "#A855F7",
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        setError(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(false);
        const profile = await getUserProfile(userId as string);
        if (profile) {
          setUserData(profile);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [userId]);

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

  // Scroll animation for header
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={{ flex: 1 }}>
          {/* Hero Skeleton */}
          <View style={{
            height: HEADER_HEIGHT,
            backgroundColor: colors.surfaceVariant,
          }}>
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 150 }}
            />
          </View>
          
          {/* Content Skeleton */}
          <View style={{ padding: 20, marginTop: -60 }}>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}>
              <View style={{ width: "60%", height: 24, borderRadius: 8, backgroundColor: colors.surfaceVariant, marginBottom: 8 }} />
              <View style={{ width: "40%", height: 16, borderRadius: 6, backgroundColor: colors.surfaceVariant, marginBottom: 16 }} />
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                <View style={{ width: 80, height: 28, borderRadius: 14, backgroundColor: colors.surfaceVariant }} />
                <View style={{ width: 60, height: 28, borderRadius: 14, backgroundColor: colors.surfaceVariant }} />
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.surfaceVariant }} />
                <View style={{ flex: 1, height: 50, borderRadius: 14, backgroundColor: colors.surfaceVariant }} />
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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

  if (!userData) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Floating Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: insets.top + 10,
          left: 16,
          zIndex: 100,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="arrow-back" size={22} color="#FFF" />
      </TouchableOpacity>

      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Story-Style Hero Header */}
        <View style={{ height: HEADER_HEIGHT, position: "relative" }}>
          {/* Background Image or Gradient */}
          {userData.photoURL ? (
            <Image
              source={{ uri: userData.photoURL }}
              style={{
                width: SCREEN_WIDTH,
                height: HEADER_HEIGHT,
                position: "absolute",
              }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={["#0D9488", "#2AA79D", "#14B8A6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: SCREEN_WIDTH,
                height: HEADER_HEIGHT,
                position: "absolute",
              }}
            />
          )}
          
          {/* Dark Gradient Overlay */}
          <LinearGradient
            colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.6)"]}
            locations={[0, 0.4, 1]}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
          />

          {/* Top Badges */}
          <Animated.View style={{
            position: "absolute",
            top: insets.top + 10,
            right: 16,
            flexDirection: "row",
            gap: 8,
            opacity: headerOpacity,
          }}>
            {/* Online Status */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: userData.status === "online" ? "rgba(34, 197, 94, 0.9)" : "rgba(0,0,0,0.5)",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 14,
            }}>
              <View style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: userData.status === "online" ? "#FFF" : "#F59E0B",
                marginRight: 5,
              }} />
              <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>
                {userData.status === "online" ? "Online" : "Away"}
              </Text>
            </View>

            {/* Verified Badge */}
            {isCounsellor && counsellorData.verificationStatus === "verified" && (
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.95)",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 14,
              }}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "700", marginLeft: 4 }}>Verified</Text>
              </View>
            )}
          </Animated.View>

          {/* Bottom Content on Hero */}
          <Animated.View style={{
            position: "absolute",
            bottom: 20,
            left: 16,
            right: 16,
            opacity: headerOpacity,
          }}>
            <Text style={{
              fontSize: 26,
              fontWeight: "800",
              color: "#FFF",
              letterSpacing: -0.5,
              marginBottom: 4,
              textShadowColor: "rgba(0,0,0,0.3)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}>
              {isCounsellor ? `Dr. ${userData.displayName}` : userData.displayName}
            </Text>
            
            {isCounsellor && (
              <Text style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.9)",
                fontWeight: "500",
                marginBottom: 12,
              }}>
                {counsellorData.licenseType} • {counsellorData.yearsExperience}+ years experience
              </Text>
            )}

            {/* Rating Badge for Counsellors */}
            {isCounsellor && counsellorData.averageRating && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 12,
                }}>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "700", marginLeft: 4 }}>
                    {counsellorData.averageRating.toFixed(1)}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginLeft: 4 }}>
                    ({counsellorData.totalReviews || 0} reviews)
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Main Content Area */}
        <View style={{ 
          backgroundColor: colors.background, 
          borderTopLeftRadius: 24, 
          borderTopRightRadius: 24,
          marginTop: -24,
          paddingTop: 24,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 24,
          minHeight: SCREEN_HEIGHT - HEADER_HEIGHT + 24,
        }}>
          
          {/* Quick Action Buttons */}
          {!isOwnProfile && (
            <View style={{ 
              flexDirection: "row", 
              gap: 12, 
              marginBottom: 20,
            }}>
              <TouchableOpacity
                onPress={() => startChat(userData)}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={[colors.primary, "#0D9488"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 14,
                    borderRadius: 14,
                  }}
                >
                  <Ionicons name="chatbubble" size={18} color="#FFF" />
                  <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "700", marginLeft: 8 }}>Message</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleStartVideoCall}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 14,
                  borderRadius: 14,
                  backgroundColor: colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="videocam" size={18} color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600", marginLeft: 8 }}>Video Call</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Price Card for Counsellors */}
          {isCounsellor && (
            <View style={{
              backgroundColor: colors.primaryContainer,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <View>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Session Rate</Text>
                <Text style={{ fontSize: 28, fontWeight: "800", color: colors.primary }}>
                  ${counsellorData.hourlyRate}
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.textSecondary }}>/hour</Text>
                </Text>
              </View>
              {!isOwnProfile && (
                <TouchableOpacity
                  onPress={() => Alert.alert("Book Session", "This would open the booking flow.")}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "700" }}>Book Now</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Specializations */}
          {isCounsellor && counsellorData.specializations && counsellorData.specializations.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
                Specializations
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {counsellorData.specializations.map((spec, index) => (
                  <View key={index} style={{
                    backgroundColor: colors.surfaceVariant,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: "500" }}>
                      {spec.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* About Section */}
          {isCounsellor && (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginLeft: 8 }}>
                  About
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="school-outline" size={18} color={colors.textSecondary} />
                  <Text style={{ color: colors.text, marginLeft: 10, flex: 1 }}>
                    <Text style={{ fontWeight: "600" }}>{counsellorData.licenseType}</Text>
                    {counsellorData.licenseNumber && ` #${counsellorData.licenseNumber}`}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                  <Text style={{ color: colors.text, marginLeft: 10 }}>
                    <Text style={{ fontWeight: "600" }}>{counsellorData.yearsExperience}+</Text> years of experience
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                  <Text style={{ color: colors.text, marginLeft: 10 }}>{userData.email}</Text>
                </View>
              </View>
            </View>
          )}

          {/* User Information for Counsellors viewing Users */}
          {isUserProfile && !isOwnProfile && (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginLeft: 8 }}>
                  Client Information
                </Text>
              </View>

              <View style={{ gap: 14 }}>
                {userProfileData.firstName && userProfileData.lastName && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: colors.textSecondary }}>Full Name</Text>
                    <Text style={{ color: colors.text, fontWeight: "600" }}>
                      {userProfileData.firstName} {userProfileData.lastName}
                    </Text>
                  </View>
                )}
                {userProfileData.gender && (
                  <>
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: colors.textSecondary }}>Gender</Text>
                      <Text style={{ color: colors.text, fontWeight: "600", textTransform: "capitalize" }}>
                        {userProfileData.gender === "prefer-not-to-say" ? "Prefer not to say" : userProfileData.gender}
                      </Text>
                    </View>
                  </>
                )}
                {userProfileData.primaryConcerns && userProfileData.primaryConcerns.length > 0 && (
                  <>
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                    <View>
                      <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>Primary Concerns</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {userProfileData.primaryConcerns.slice(0, 4).map((concern: string, index: number) => (
                          <View key={index} style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: colors.primaryContainer,
                            borderRadius: 16,
                          }}>
                            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "500" }}>
                              {concern.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
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
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
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
                          fontSize: 12,
                          fontWeight: "600",
                          color: userProfileData.severityLevel === "severe" 
                            ? "#DC2626" 
                            : userProfileData.severityLevel === "moderate" 
                              ? "#D97706" 
                              : "#059669",
                        }}>
                          {userProfileData.severityLevel.charAt(0).toUpperCase() + userProfileData.severityLevel.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
                
                {/* Crisis Alert */}
                {userProfileData.inCrisis && (
                  <View style={{
                    marginTop: 8,
                    padding: 14,
                    backgroundColor: "#FEF2F2",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#FECACA",
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <Ionicons name="warning" size={18} color="#DC2626" />
                      <Text style={{ color: "#DC2626", fontWeight: "700", marginLeft: 8, fontSize: 14 }}>
                        Crisis Alert
                      </Text>
                    </View>
                    <Text style={{ color: "#991B1B", fontSize: 12, lineHeight: 18 }}>
                      This client has indicated they are in crisis. Please prioritize immediate support.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* More Actions */}
          {!isOwnProfile && (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 14 }}>
                Quick Actions
              </Text>
              
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={handleStartCall}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: colors.surfaceVariant,
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: colors.secondaryContainer,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}>
                    <Ionicons name="call" size={18} color={colors.secondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>Voice Call</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Start an audio call</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {canReview && (
                  <TouchableOpacity
                    onPress={() => setShowReviewModal(true)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 14,
                      borderRadius: 12,
                      backgroundColor: colors.surfaceVariant,
                    }}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: colors.warningContainer,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}>
                      <Ionicons name="star" size={18} color={colors.warning} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>Write Review</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Share your experience</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}

                {isUserProfile && (
                  <TouchableOpacity
                    onPress={() => Alert.alert("Schedule Session", "This would open the booking flow.")}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 14,
                      borderRadius: 12,
                      backgroundColor: colors.surfaceVariant,
                    }}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: colors.accentContainer,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}>
                      <Ionicons name="calendar" size={18} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>Schedule Session</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Book a therapy session</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
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
        </View>
      </Animated.ScrollView>

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
    </View>
  );
}
