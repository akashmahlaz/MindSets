import "@/app/global.css";
import ReviewDisplay from "@/components/profile/ReviewDisplay";
import ReviewSubmission from "@/components/profile/ReviewSubmission";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
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
import Svg, { Path } from "react-native-svg";

Dimensions.get("window");

// Organic blob shapes for background
const BlobBackground = ({ isDark }: { isDark: boolean }) => {
  const blobColor1 = isDark ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.2)";
  const blobColor2 = isDark ? "rgba(107, 114, 128, 0.12)" : "rgba(107, 114, 128, 0.15)";

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
      {/* Top-left blob */}
      <Svg
        width={280}
        height={280}
        viewBox="0 0 200 200"
        style={{ position: "absolute", top: -50, left: -80 }}
      >
        <Path
          d="M45.7,-62.3C58.9,-53.4,69.3,-39.5,74.2,-23.8C79.1,-8.1,78.5,9.3,72.2,24.4C65.9,39.5,53.8,52.3,39.5,60.6C25.2,68.9,8.6,72.7,-7.5,72.1C-23.6,71.5,-39.2,66.5,-51.8,56.7C-64.4,46.9,-74,32.4,-77.3,16.4C-80.6,0.4,-77.6,-17.1,-69.8,-31.5C-62,-45.9,-49.4,-57.2,-35.5,-65.7C-21.6,-74.2,-6.3,-79.9,6.1,-78.3C18.5,-76.7,32.4,-71.2,45.7,-62.3Z"
          fill={blobColor1}
          transform="translate(100, 100)"
        />
      </Svg>

      {/* Top-right blob */}
      <Svg
        width={220}
        height={220}
        viewBox="0 0 200 200"
        style={{ position: "absolute", top: 20, right: -60 }}
      >
        <Path
          d="M39.5,-51.6C52.3,-43.5,64.5,-32.6,69.4,-18.9C74.3,-5.2,71.9,11.4,65.1,25.4C58.3,39.4,47.1,50.9,33.9,57.8C20.7,64.7,5.5,67.1,-9.8,66C-25.1,64.9,-40.4,60.2,-51.8,50.8C-63.2,41.4,-70.7,27.3,-73.5,12.1C-76.3,-3.1,-74.4,-19.4,-66.9,-32.2C-59.4,-45,-46.4,-54.3,-32.9,-62.1C-19.4,-69.9,-5.4,-76.2,5.6,-73.5C16.6,-70.8,26.7,-59.7,39.5,-51.6Z"
          fill={blobColor2}
          transform="translate(100, 100)"
        />
      </Svg>

      {/* Bottom-right blob */}
      <Svg
        width={200}
        height={200}
        viewBox="0 0 200 200"
        style={{ position: "absolute", bottom: 100, right: -50 }}
      >
        <Path
          d="M44.5,-58.3C57.5,-49.7,67.7,-36.4,72.3,-21.4C76.9,-6.4,75.9,10.3,69.9,24.7C63.9,39.1,52.9,51.2,39.6,58.9C26.3,66.6,10.7,69.9,-4.4,69.1C-19.5,68.3,-34.1,63.4,-46,54.2C-57.9,45,-67.1,31.5,-71.4,16.1C-75.7,0.7,-75.1,-16.6,-68.5,-30.6C-61.9,-44.6,-49.3,-55.3,-35.6,-63.6C-21.9,-71.9,-7.1,-77.8,5.2,-76.3C17.5,-74.8,31.5,-66.9,44.5,-58.3Z"
          fill={blobColor1}
          transform="translate(100, 100)"
        />
      </Svg>
    </View>
  );
};

type TabType = "about" | "reviews" | "details";

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { chatClient, isChatConnected, connectToChat } = useChat();
  const { isDarkColorScheme } = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("about");

  const isCounsellor = userData?.role === "counsellor";
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
    tagBg: isDarkColorScheme ? "#2D3139" : "#E5E7EB",
    tabActive: isDarkColorScheme ? "#1A1D24" : "#FFFFFF",
    tabInactive: isDarkColorScheme ? "transparent" : "transparent",
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

  const startChat = async (targetUser: UserProfile) => {
    if (!user || !chatClient) {
      Alert.alert("Error", "Chat not available");
      return;
    }

    if (!isChatConnected) {
      try {
        await connectToChat();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch {
        Alert.alert("Error", "Failed to connect to chat");
        return;
      }
    }

    try {
      const { createOrGetDirectChannel } = await import("@/services/chatHelpers");
      const channel = await createOrGetDirectChannel(user, targetUser.uid);
      router.push(`/(main)/chat/${channel.id}` as any);
    } catch {
      Alert.alert(
        "Chat Error",
        `Failed to start chat with ${targetUser.displayName}. Please try again.`
      );
    }
  };

  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    if (userId) {
      const loadUserData = async () => {
        try {
          const profile = await getUserProfile(userId as string);
          if (profile) setUserData(profile);
        } catch (error) {
          console.error("Error refreshing profile:", error);
        }
      };
      loadUserData();
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

  // Loading State
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]}>
        <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />
        <BlobBackground isDark={isDarkColorScheme} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <View
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: colors.surfaceVariant,
              marginBottom: 20,
            }}
          />
          <View style={{ width: 200, height: 24, borderRadius: 8, backgroundColor: colors.surfaceVariant, marginBottom: 12 }} />
          <View style={{ width: 120, height: 16, borderRadius: 6, backgroundColor: colors.surfaceVariant }} />
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (!loading && (!userData || error)) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}
      >
        <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />
        <BlobBackground isDark={isDarkColorScheme} />
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.surfaceVariant,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Ionicons name="person-circle-outline" size={50} color={colors.textSecondary} />
        </View>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 8 }}>User not found</Text>
        <Text style={{ color: colors.textSecondary, textAlign: "center", marginBottom: 24 }}>
          This user may not exist or has been removed.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border }}
        >
          <Text style={{ color: colors.text, fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!userData) return null;

  // Tab Content Renderers
  const renderAboutTab = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {/* About Me */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 }}>About Me</Text>
        <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 24 }}>
          {counsellorData.bio ||
            "Compassionate psychologist dedicated to helping clients navigate life's challenges. I specialize in evidence-based practices to foster resilience and well-being, creating a safe space for healing."}
        </Text>
      </View>

      {/* My Approach */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 }}>My Approach</Text>
        <View style={{ gap: 10 }}>
          {(counsellorData.approaches || ["Cognitive Behavioral Therapy (CBT)", "Mindfulness-Based Stress Reduction", "Solution-Focused Brief Therapy"]).map(
            (approach: string, index: number) => (
              <View key={index} style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 20, marginRight: 10 }}></Text>
                <Text style={{ fontSize: 15, color: colors.text }}>{approach}</Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* Education & Certifications */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 }}>Education & Certifications</Text>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 15, color: colors.textSecondary }}>
            {counsellorData.licenseType || "Psy.D."} in Clinical Psychology
          </Text>
        </View>
      </View>

      {/* Client Reviews Preview */}
      <View>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 12 }}>Client Reviews</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
          {[1, 2].map((_, index) => (
            <View
              key={index}
              style={{
                width: 260,
                backgroundColor: isDarkColorScheme ? "rgba(96, 165, 250, 0.08)" : "rgba(96, 165, 250, 0.08)",
                borderRadius: 16,
                padding: 16,
                marginRight: 12,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ flexDirection: "row" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name="star" size={14} color="#FBBF24" style={{ marginRight: 2 }} />
                  ))}
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Jun 17, 2022</Text>
              </View>
              <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }} numberOfLines={3}>
                Dr. {userData.displayName?.split(" ")[0]} is incredibly insightful and supportive. She helped me develop practical tools
                to manage my anxiety. – Sarah K.
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );

  const renderReviewsTab = () => (
    <View>
      <ReviewDisplay counsellorId={userData.uid} onWriteReview={() => setShowReviewModal(true)} showWriteReviewButton={!!canReview} />
    </View>
  );

  const renderDetailsTab = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], gap: 16 }}>
      {/* Session Rate */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="card-outline" size={20} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginLeft: 8 }}>Session Rate</Text>
        </View>
        <Text style={{ fontSize: 32, fontWeight: "800", color: colors.primary }}>
          ${counsellorData.hourlyRate || 80}
          <Text style={{ fontSize: 16, fontWeight: "500", color: colors.textSecondary }}>/hour</Text>
        </Text>
      </View>

      {/* Professional Information */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginLeft: 8 }}>Professional Info</Text>
        </View>

        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.textSecondary }}>License Type</Text>
            <Text style={{ color: colors.text, fontWeight: "600" }}>{counsellorData.licenseType || "N/A"}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.textSecondary }}>License Number</Text>
            <Text style={{ color: colors.text, fontWeight: "600" }}>{counsellorData.licenseNumber || "N/A"}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.textSecondary }}>Years Experience</Text>
            <Text style={{ color: colors.text, fontWeight: "600" }}>{counsellorData.yearsExperience || 0}+ years</Text>
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.textSecondary }}>Total Reviews</Text>
            <Text style={{ color: colors.text, fontWeight: "600" }}>{counsellorData.totalReviews || 0}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.textSecondary }}>Average Rating</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="star" size={14} color="#FBBF24" />
              <Text style={{ color: colors.text, fontWeight: "600", marginLeft: 4 }}>
                {counsellorData.averageRating?.toFixed(1) || "N/A"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contact */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginLeft: 8 }}>Contact</Text>
        </View>
        <Text style={{ color: colors.textSecondary }}>{userData.email}</Text>
      </View>
    </Animated.View>
  );

  // User Profile View (for when counsellors view users)
  const renderUserProfileContent = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], gap: 16 }}>
      {/* Client Information */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Ionicons name="person-outline" size={20} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginLeft: 8 }}>Client Information</Text>
        </View>

        <View style={{ gap: 14 }}>
          {userProfileData.firstName && userProfileData.lastName && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.textSecondary }}>Full Name</Text>
              <Text style={{ color: colors.text, fontWeight: "600" }}>
                {userProfileData.firstName} {userProfileData.lastName}
              </Text>
            </View>
          )}
          {userProfileData.gender && (
            <>
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
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
                    <View
                      key={index}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: colors.primaryContainer,
                        borderRadius: 16,
                      }}
                    >
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
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 10,
                    backgroundColor:
                      userProfileData.severityLevel === "severe"
                        ? "#FEE2E2"
                        : userProfileData.severityLevel === "moderate"
                        ? "#FEF3C7"
                        : "#D1FAE5",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color:
                        userProfileData.severityLevel === "severe"
                          ? "#DC2626"
                          : userProfileData.severityLevel === "moderate"
                          ? "#D97706"
                          : "#059669",
                    }}
                  >
                    {userProfileData.severityLevel.charAt(0).toUpperCase() + userProfileData.severityLevel.slice(1)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Crisis Alert */}
        {userProfileData.inCrisis && (
          <View
            style={{
              marginTop: 16,
              padding: 14,
              backgroundColor: "#FEF2F2",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#FECACA",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Ionicons name="warning" size={18} color="#DC2626" />
              <Text style={{ color: "#DC2626", fontWeight: "700", marginLeft: 8, fontSize: 14 }}>Crisis Alert</Text>
            </View>
            <Text style={{ color: "#991B1B", fontSize: 12, lineHeight: 18 }}>
              This client has indicated they are in crisis. Please prioritize immediate support.
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      {/* Organic Blob Background */}
      <BlobBackground isDark={isDarkColorScheme} />

      {/* Header with Back and Share */}
      <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDarkColorScheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Alert.alert("Share", "Share profile functionality")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDarkColorScheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: !isOwnProfile ? 100 + insets.bottom : insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Section */}
        <View style={{ alignItems: "center", paddingTop: insets.top + 60, paddingHorizontal: 20, paddingBottom: 20 }}>
          {/* Circular Profile Photo with Border */}
          <View
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              borderWidth: 4,
              borderColor: colors.primary,
              padding: 4,
              backgroundColor: colors.background,
              marginBottom: 20,
            }}
          >
            {userData.photoURL ? (
              <Image
                source={{ uri: userData.photoURL }}
                style={{ width: "100%", height: "100%", borderRadius: 66 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 66,
                  backgroundColor: colors.primaryContainer,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 48, fontWeight: "800", color: colors.primary }}>
                  {getInitials(userData.displayName || "U")}
                </Text>
              </View>
            )}
          </View>

          {/* Name */}
          <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text, textAlign: "center", marginBottom: 4 }}>
            {isCounsellor ? `Dr. ${userData.displayName}, ${counsellorData.licenseType || "Psy.D."}` : userData.displayName}
          </Text>

          {/* Specializations Tags */}
          {isCounsellor && counsellorData.specializations && counsellorData.specializations.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 12, marginBottom: 8 }}>
              {counsellorData.specializations.slice(0, 3).map((spec, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.tagBg,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: "500" }}>
                    {spec.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Experience Badge */}
          {isCounsellor && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <Text style={{ fontSize: 18, marginRight: 6 }}></Text>
              <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: "500" }}>
                {counsellorData.yearsExperience || 0}+ Years Experience
              </Text>
            </View>
          )}
        </View>

        {/* Tabs for Counsellors */}
        {isCounsellor && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View
              style={{
                flexDirection: "row",
                backgroundColor: colors.surfaceVariant,
                borderRadius: 16,
                padding: 4,
              }}
            >
              {(["about", "reviews", "details"] as TabType[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: activeTab === tab ? colors.tabActive : colors.tabInactive,
                    shadowColor: activeTab === tab ? "#000" : "transparent",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: activeTab === tab ? 0.1 : 0,
                    shadowRadius: 4,
                    elevation: activeTab === tab ? 2 : 0,
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 14,
                      fontWeight: activeTab === tab ? "700" : "500",
                      color: activeTab === tab ? colors.text : colors.textSecondary,
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Tab Content */}
        <View style={{ paddingHorizontal: 20 }}>
          {isCounsellor ? (
            <>
              {activeTab === "about" && renderAboutTab()}
              {activeTab === "reviews" && renderReviewsTab()}
              {activeTab === "details" && renderDetailsTab()}
            </>
          ) : (
            renderUserProfileContent()
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons - Fixed */}
      {!isOwnProfile && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.background,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            flexDirection: "row",
            gap: 12,
          }}
        >
          {/* Message Button */}
          <TouchableOpacity
            onPress={() => startChat(userData)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: colors.surfaceVariant,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="mail-outline" size={20} color={colors.text} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginLeft: 8 }}>Message</Text>
          </TouchableOpacity>

          {/* Book Session Button */}
          <TouchableOpacity
            onPress={() => Alert.alert("Book Session", "This would open the booking flow.")}
            style={{ flex: 1.2 }}
          >
            <LinearGradient
              colors={[colors.primary, "#0D9488"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 16,
                borderRadius: 16,
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#FFF" />
              <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700", marginLeft: 8 }}>Book Session</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Review Submission Modal */}
      <Modal visible={showReviewModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowReviewModal(false)}>
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
