import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Article, getUserArticles } from "@/services/articleService";
import {
    getUpcomingSessions,
    getUserSessions,
} from "@/services/sessionService";
import { getAllUsers } from "@/services/userService";
import { CounsellorProfileData, UserProfile } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CLIENT_CARD_WIDTH = SCREEN_WIDTH * 0.42;

// Organic blob background component
const BlobDecoration = ({ color, size, style }: { color: string; size: number; style?: any }) => (
  <View style={[{ width: size, height: size, position: "absolute" }, style]}>
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Path
        d="M45.7,-62.3C58.9,-53.4,69.3,-39.5,74.2,-23.8C79.1,-8.1,78.5,9.3,72.2,24.4C65.9,39.5,53.8,52.3,39.5,60.6C25.2,68.9,8.6,72.7,-7.5,72.1C-23.6,71.5,-39.2,66.5,-51.8,56.7C-64.4,46.9,-74,32.4,-77.3,16.4C-80.6,0.4,-77.6,-17.1,-69.8,-31.5C-62,-45.9,-49.4,-57.2,-35.5,-65.7C-21.6,-74.2,-6.3,-79.9,6.1,-78.3C18.5,-76.7,32.4,-71.2,45.7,-62.3Z"
        fill={color}
        transform="translate(100 100)"
      />
    </Svg>
  </View>
);

export default function CounsellorDashboard() {
  const { isDarkColorScheme } = useColorScheme();
  const { userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [myStories, setMyStories] = useState<Article[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [stats, setStats] = useState<{
    upcomingSessions: number;
    totalClients: number;
    weeklyHours: number;
    rating: number | null;
    totalStories: number;
  }>({
    upcomingSessions: 0,
    totalClients: 0,
    weeklyHours: 0,
    rating: null,
    totalStories: 0,
  });

  // Premium colors matching the app design system
  const colors = {
    background: isDarkColorScheme ? "#0F1117" : "#FFFFFF",
    surface: isDarkColorScheme ? "#1A1D24" : "#FFFFFF",
    surfaceElevated: isDarkColorScheme ? "#252830" : "#F8FAFB",
    text: isDarkColorScheme ? "#F3F4F6" : "#1F2937",
    textSecondary: isDarkColorScheme ? "#9CA3AF" : "#6B7280",
    textMuted: isDarkColorScheme ? "#6B7280" : "#9CA3AF",
    primary: "#2AA79D",
    primaryLight: "#3A9C94",
    secondary: "#0D9488",
    accent: "#F472B6",
    success: "#22C55E",
    warning: "#FBBF24",
    error: "#EF4444",
    border: isDarkColorScheme ? "#2D3139" : "#E5E7EB",
    cardShadow: isDarkColorScheme ? "rgba(0,0,0,0.4)" : "rgba(42,167,157,0.1)",
    blobPrimary: isDarkColorScheme ? "rgba(42,167,157,0.15)" : "rgba(42,167,157,0.12)",
    blobSecondary: isDarkColorScheme ? "rgba(107,114,128,0.1)" : "rgba(107,114,128,0.08)",
  };

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const counsellorProfile = userProfile as CounsellorProfileData;

  const loadDashboardData = async () => {
    try {
      if (!userProfile?.uid) return;

      const upcomingSessions = await getUpcomingSessions(userProfile.uid, "counselor");
      const allSessions = await getUserSessions(userProfile.uid, "counselor");

      const uniqueClientIds = [...new Set(allSessions.map((session) => session.clientId))];
      const allUsers = await getAllUsers(userProfile.uid);

      let clientUsers = allUsers.filter((user) => uniqueClientIds.includes(user.uid));

      if (clientUsers.length === 0 && allUsers.length > 0) {
        clientUsers = allUsers
          .filter((user) => user.role === "user" && user.uid !== userProfile.uid)
          .slice(0, 5);
      }

      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const weekSessions = allSessions.filter(
        (session) => session.date >= weekStart && session.date <= now
      );
      const weeklyHours = weekSessions.reduce((total, session) => total + session.duration, 0) / 60;

      setClients(clientUsers);
      setStats({
        upcomingSessions: upcomingSessions.length,
        totalClients: clientUsers.length,
        weeklyHours: Math.round(weeklyHours * 10) / 10,
        rating: counsellorProfile.averageRating || null,
        totalStories: myStories.length,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMyStories = async () => {
    try {
      setStoriesLoading(true);
      if (userProfile?.uid) {
        const stories = await getUserArticles(userProfile.uid);
        setMyStories(stories);
      }
    } catch (err) {
      console.error("Error loading stories:", err);
    } finally {
      setStoriesLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadMyStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
    loadMyStories();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Client card component - matching the beautiful counsellor card style
  const renderClientCard = (client: UserProfile, index: number) => {
    const gradientSets = [
      ["#2AA79D", "#0D9488"],
      ["#3B82F6", "#2563EB"],
      ["#F472B6", "#EC4899"],
      ["#FBBF24", "#F59E0B"],
    ];
    const gradient = gradientSets[index % 4];

    return (
      <Pressable
        key={client.uid}
        onPress={() => router.push({ pathname: "/profile/[userId]", params: { userId: client.uid } })}
        style={{ width: CLIENT_CARD_WIDTH, marginRight: 14 }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            overflow: "hidden",
            shadowColor: colors.cardShadow,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 1,
            shadowRadius: 14,
            elevation: 5,
            borderWidth: isDarkColorScheme ? 0 : 1,
            borderColor: colors.border,
          }}
        >
          {/* Header with organic background */}
          <View style={{ height: 70, position: "relative", backgroundColor: isDarkColorScheme ? "#1C2128" : "#E8F5F3" }}>
            <BlobDecoration color={`${colors.primary}25`} size={80} style={{ top: -20, left: -20 }} />
            <BlobDecoration color={`${colors.secondary}20`} size={60} style={{ top: 10, right: -15 }} />
            
            {/* Online status */}
            <View
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                backgroundColor: isDarkColorScheme ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 4 }} />
              <Text style={{ color: isDarkColorScheme ? "#FFF" : "#1F2937", fontSize: 9, fontWeight: "600" }}>Active</Text>
            </View>
          </View>

          {/* Profile photo overlapping */}
          <View style={{ alignItems: "center", marginTop: -35 }}>
            <View style={{ padding: 3, borderRadius: 35, backgroundColor: colors.surface }}>
              {client.photoURL ? (
                <Image source={{ uri: client.photoURL }} style={{ width: 64, height: 64, borderRadius: 32 }} />
              ) : (
                <LinearGradient
                  colors={gradient as any}
                  style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: "#FFF", fontSize: 24, fontWeight: "700" }}>
                    {client.displayName?.charAt(0) || "?"}
                  </Text>
                </LinearGradient>
              )}
            </View>
          </View>

          {/* Content */}
          <View style={{ padding: 14, paddingTop: 10 }}>
            <Text
              style={{ fontSize: 15, fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: 6 }}
              numberOfLines={1}
            >
              {client.displayName || "Client"}
            </Text>
            
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  backgroundColor: isDarkColorScheme ? "rgba(42,167,157,0.15)" : "rgba(42,167,157,0.1)",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>Client</Text>
              </View>
            </View>

            {/* Action button */}
            <Pressable
              onPress={() => router.push({ pathname: "/profile/[userId]", params: { userId: client.uid } })}
              style={{
                backgroundColor: isDarkColorScheme ? "rgba(42,167,157,0.15)" : "rgba(42,167,157,0.1)",
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person-outline" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600", marginLeft: 6 }}>View Profile</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  if (!counsellorProfile || counsellorProfile.role !== "counsellor") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.surfaceElevated,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}>
            <Ionicons name="hourglass-outline" size={28} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 16, color: colors.text }}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Verification Status Banner - Only show if NOT verified */}
        {counsellorProfile.verificationStatus === "pending" && (
          <View style={{
            marginHorizontal: 20,
            marginTop: 12,
            marginBottom: 8,
            backgroundColor: isDarkColorScheme ? "rgba(251, 191, 36, 0.12)" : "rgba(251, 191, 36, 0.1)",
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: isDarkColorScheme ? "rgba(251, 191, 36, 0.25)" : "rgba(251, 191, 36, 0.3)",
          }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isDarkColorScheme ? "rgba(251, 191, 36, 0.2)" : "rgba(251, 191, 36, 0.15)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}>
              <Ionicons name="time-outline" size={24} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.warning, marginBottom: 2 }}>
                Verification Pending
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                Your profile is under review. You'll be notified once approved.
              </Text>
            </View>
          </View>
        )}

        {counsellorProfile.verificationStatus === "rejected" && (
          <View style={{
            marginHorizontal: 20,
            marginTop: 12,
            marginBottom: 8,
            backgroundColor: isDarkColorScheme ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.1)",
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: isDarkColorScheme ? "rgba(239, 68, 68, 0.25)" : "rgba(239, 68, 68, 0.3)",
          }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isDarkColorScheme ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.15)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}>
              <Ionicons name="close-circle-outline" size={24} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.error, marginBottom: 2 }}>
                Verification Declined
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                Please contact support for more information.
              </Text>
            </View>
          </View>
        )}

        {/* ============ HEADER ============ */}
        <Animated.View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <View>
              <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 4 }}>
                {getGreeting()} 
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>
                  Dr. {counsellorProfile.firstName}
                </Text>
                {counsellorProfile.verificationStatus === "verified" && (
                  <View style={{
                    marginLeft: 10,
                    backgroundColor: "rgba(34, 197, 94, 0.12)",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                  }}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    <Text style={{ color: colors.success, fontSize: 10, fontWeight: "700", marginLeft: 3 }}>Verified</Text>
                  </View>
                )}
              </View>
            </View>

            <Pressable
              onPress={() => router.push("/profile")}
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: colors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {counsellorProfile?.photoURL ? (
                <Image source={{ uri: counsellorProfile.photoURL }} style={{ width: 48, height: 48, borderRadius: 16 }} />
              ) : (
                <Ionicons name="person" size={22} color={colors.textSecondary} />
              )}
            </Pressable>
          </View>

          {/* Today's Overview Card */}
          <Pressable onPress={() => router.push("/(main)/sessions" as any)}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 18,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: isDarkColorScheme ? "rgba(42,167,157,0.15)" : "rgba(42,167,157,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <Text style={{ fontSize: 28 }}></Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 2 }}>
                  {stats.upcomingSessions > 0 
                    ? `${stats.upcomingSessions} Session${stats.upcomingSessions > 1 ? "s" : ""} Today`
                    : "No Sessions Today"}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  {stats.upcomingSessions > 0 ? "Tap to view your schedule" : "Your schedule is clear"}
                </Text>
              </View>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="chevron-forward" size={20} color="#FFF" />
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {/* ============ VERIFICATION STATUS ============ */}
        {counsellorProfile.verificationStatus === "pending" && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{
              backgroundColor: "rgba(251, 191, 36, 0.1)",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(251, 191, 36, 0.3)",
            }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: "rgba(251, 191, 36, 0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}>
                <Ionicons name="time" size={24} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.warning, marginBottom: 2 }}>
                  Verification Pending
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                  Your credentials are being reviewed (3-5 days)
                </Text>
              </View>
            </View>
          </View>
        )}

        {counsellorProfile.verificationStatus === "rejected" && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "rgba(239, 68, 68, 0.3)",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}>
                  <Ionicons name="alert-circle" size={24} color={colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.error }}>
                    Application Needs Updates
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {counsellorProfile.verificationNotes || "Please review and resubmit"}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => router.push("/profile/edit" as any)}
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.error, fontWeight: "700", fontSize: 14 }}>Update Application</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ============ QUICK ACTIONS ============ */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 14 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {[
              { icon: "chatbubbles-outline", label: "Messages", colors: ["#2AA79D", "#0D9488"], route: "/chat" },
              { icon: "calendar-outline", label: "Schedule", colors: ["#3B82F6", "#2563EB"], route: "/(main)/sessions" },
              { icon: "create-outline", label: "Write\nStory", colors: ["#F472B6", "#EC4899"], route: "/(resources)/articles/create" },
            ].map((action, index) => (
              <Pressable
                key={index}
                onPress={() => router.push(action.route as any)}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: isDarkColorScheme ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <LinearGradient
                  colors={action.colors as any}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <Ionicons name={action.icon as any} size={24} color="#FFF" />
                </LinearGradient>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.text,
                    textAlign: "center",
                    lineHeight: 18,
                  }}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ============ STATS OVERVIEW ============ */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 14 }}>
            Overview
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
            {[
              { icon: "calendar", value: stats.upcomingSessions, label: "Upcoming", color: colors.primary },
              { icon: "people", value: stats.totalClients, label: "Clients", color: "#3B82F6" },
              { icon: "time", value: `${stats.weeklyHours}h`, label: "This Week", color: "#F472B6" },
              { icon: "star", value: stats.rating && stats.rating > 0 ? stats.rating.toFixed(1) : "New", label: "Rating", color: "#FBBF24" },
            ].map((stat, index) => (
              <View key={index} style={{ width: "50%", paddingHorizontal: 6, marginBottom: 12 }}>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: isDarkColorScheme ? 0 : 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: `${stat.color}15`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text }}>{stat.value}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ============ YOUR CLIENTS ============ */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
              Your Clients
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              {clients.length} active
            </Text>
          </View>

          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {[1, 2, 3].map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: CLIENT_CARD_WIDTH,
                    marginRight: 14,
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    height: 200,
                  }}
                >
                  <View style={{ height: 70, backgroundColor: colors.surfaceElevated, borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
                  <View style={{ padding: 14, alignItems: "center" }}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceElevated, marginTop: -46 }} />
                    <View style={{ height: 16, backgroundColor: colors.surfaceElevated, borderRadius: 6, width: "70%", marginTop: 12 }} />
                    <View style={{ height: 12, backgroundColor: colors.surfaceElevated, borderRadius: 6, width: "50%", marginTop: 8 }} />
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : clients.length === 0 ? (
            <View style={{ paddingHorizontal: 20 }}>
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 32,
                alignItems: "center",
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border,
              }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.surfaceElevated,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}>
                  <Ionicons name="people-outline" size={28} color={colors.textSecondary} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 6 }}>
                  No Clients Yet
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 20 }}>
                  Your clients will appear here once you start sessions
                </Text>
              </View>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {clients.map((client, index) => renderClientCard(client, index))}
            </ScrollView>
          )}
        </View>

        {/* ============ MY STORIES ============ */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
              My Stories
            </Text>
            <Pressable onPress={() => router.push("/(resources)/articles" as any)}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>See All</Text>
            </Pressable>
          </View>

          {storiesLoading ? (
            <View style={{ gap: 12 }}>
              {[1, 2].map((_, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: "row",
                  }}
                >
                  <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: colors.surfaceElevated, marginRight: 14 }} />
                  <View style={{ flex: 1, justifyContent: "center" }}>
                    <View style={{ height: 16, backgroundColor: colors.surfaceElevated, borderRadius: 6, marginBottom: 8 }} />
                    <View style={{ height: 12, backgroundColor: colors.surfaceElevated, borderRadius: 6, width: "60%" }} />
                  </View>
                </View>
              ))}
            </View>
          ) : myStories.length > 0 ? (
            <View style={{ gap: 12 }}>
              {myStories.slice(0, 3).map((story, index) => (
                <Pressable
                  key={story.id}
                  onPress={() => router.push({ pathname: "/(resources)/articles/[articleId]" as any, params: { articleId: story.id } })}
                >
                  <View style={{
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: isDarkColorScheme ? 0 : 1,
                    borderColor: colors.border,
                  }}>
                    <View style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      backgroundColor: isDarkColorScheme ? "rgba(42,167,157,0.15)" : "rgba(42,167,157,0.1)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}>
                      <Ionicons name="document-text" size={24} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{
                        backgroundColor: story.isPublished ? "rgba(34, 197, 94, 0.12)" : "rgba(251, 191, 36, 0.12)",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        alignSelf: "flex-start",
                        marginBottom: 6,
                      }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: story.isPublished ? colors.success : colors.warning }}>
                          {story.isPublished ? "PUBLISHED" : "DRAFT"}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 }} numberOfLines={1}>
                        {story.title}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
                        <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>{story.viewCount || 0} views</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </View>
                </Pressable>
              ))}

              {/* Write new story button */}
              <Pressable onPress={() => router.push("/(resources)/articles/create" as any)}>
                <View style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: colors.border,
                }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isDarkColorScheme ? "rgba(42,167,157,0.15)" : "rgba(42,167,157,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}>
                    <Ionicons name="add" size={22} color={colors.primary} />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.primary }}>Write a New Story</Text>
                </View>
              </Pressable>
            </View>
          ) : (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 32,
              alignItems: "center",
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border,
            }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}>
                <Ionicons name="create-outline" size={28} color={colors.textSecondary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 6 }}>
                Share Your Expertise
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", marginBottom: 16, lineHeight: 20 }}>
                Write stories to help clients understand mental health topics
              </Text>
              <Pressable onPress={() => router.push("/(resources)/articles/create" as any)}>
                <LinearGradient
                  colors={["#2AA79D", "#0D9488"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}
                >
                  <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "700" }}>Write Your First Story</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
