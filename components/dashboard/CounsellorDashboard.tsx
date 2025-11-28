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
    Alert,
    Animated,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CounsellorDashboard() {
  const { isDarkColorScheme } = useColorScheme();
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [myStories, setMyStories] = useState<Article[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [stats, setStats] = useState({
    upcomingSessions: 0,
    totalClients: 0,
    weeklyHours: 0,
    rating: 4.8,
    totalStories: 0,
  });

  // Premium colors - matching tab bar
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
    surface: isDarkColorScheme ? "#16161F" : "#FFFFFF",
    surfaceElevated: isDarkColorScheme ? "#1C1C28" : "#F8F9FC",
    text: isDarkColorScheme ? "#FFFFFF" : "#1A1A2E",
    textSecondary: isDarkColorScheme ? "#8B8B9E" : "#6B7280",
    textMuted: isDarkColorScheme ? "#5C5C6F" : "#9CA3AF",
    primary: "#7C3AED",
    primaryLight: "#A78BFA",
    secondary: "#06B6D4",
    accent: "#F472B6",
    success: "#10B981",
    warning: "#FBBF24",
    error: "#EF4444",
    gradient1: ["#7C3AED", "#EC4899"] as const,
    gradient2: ["#06B6D4", "#3B82F6"] as const,
    gradient3: ["#F472B6", "#FB923C"] as const,
    gradient4: ["#10B981", "#059669"] as const,
    border: isDarkColorScheme ? "#2A2A3C" : "#E5E7EB",
    cardShadow: isDarkColorScheme ? "rgba(0,0,0,0.5)" : "rgba(99,102,241,0.08)",
  };

  // Premium animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const counsellorProfile = userProfile as CounsellorProfileData;

  const loadDashboardData = async () => {
    try {
      if (!userProfile?.uid) return;

      // Load upcoming sessions
      const upcomingSessions = await getUpcomingSessions(userProfile.uid, "counselor");
      const allSessions = await getUserSessions(userProfile.uid, "counselor");

      // Get unique clients
      const uniqueClientIds = [...new Set(allSessions.map((session) => session.clientId))];
      const allUsers = await getAllUsers(userProfile.uid);

      let clientUsers = allUsers.filter((user) => uniqueClientIds.includes(user.uid));

      // If no clients from sessions, show sample clients for testing
      if (clientUsers.length === 0 && allUsers.length > 0) {
        clientUsers = allUsers
          .filter((user) => user.role === "user" && user.uid !== userProfile.uid)
          .slice(0, 5);
      }

      // Calculate stats
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
        rating: 4.8,
        totalStories: myStories.length,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setStats({
        upcomingSessions: 0,
        totalClients: 0,
        weeklyHours: 0,
        rating: 0,
        totalStories: 0,
      });
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (!counsellorProfile || counsellorProfile.role !== "counsellor") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.surfaceElevated,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}>
            <Ionicons name="hourglass-outline" size={36} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>Loading dashboard...</Text>
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
        {/* Premium Header */}
        <Animated.View
          style={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 20,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 6 }}>
                {getGreeting()} 👋
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -1 }}>
                  Dr. {counsellorProfile.firstName}
                </Text>
                {counsellorProfile.verificationStatus === "verified" && (
                  <View style={{
                    marginLeft: 10,
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  }}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={{ color: colors.success, fontSize: 12, fontWeight: "700", marginLeft: 4 }}>Verified</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Pressable
                onPress={() => router.push("/notifications" as any)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: colors.surfaceElevated,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
              </Pressable>

              <Pressable
                onPress={() => router.push("/profile")}
                style={{ width: 56, height: 56, borderRadius: 20, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={colors.gradient1}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 56, height: 56, padding: 3 }}
                >
                  <View style={{
                    flex: 1,
                    borderRadius: 17,
                    backgroundColor: colors.background,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {counsellorProfile?.photoURL ? (
                      <Image
                        source={{ uri: counsellorProfile.photoURL }}
                        style={{ width: 50, height: 50, borderRadius: 17 }}
                      />
                    ) : (
                      <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary }}>
                        {counsellorProfile.firstName?.charAt(0)}
                      </Text>
                    )}
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Verification Status Cards */}
        {counsellorProfile.verificationStatus === "pending" && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <View style={{
              backgroundColor: "rgba(251, 191, 36, 0.12)",
              borderRadius: 24,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
            }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: "rgba(251, 191, 36, 0.2)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}>
                <Ionicons name="time" size={28} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: colors.warning, marginBottom: 4 }}>
                  Verification In Progress
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                  Your credentials are being reviewed. This typically takes 3-5 business days.
                </Text>
              </View>
            </View>
          </View>
        )}

        {counsellorProfile.verificationStatus === "rejected" && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <View style={{
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              borderRadius: 24,
              padding: 20,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <Ionicons name="alert-circle" size={28} color={colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: colors.error, marginBottom: 4 }}>
                    Application Needs Updates
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                    {counsellorProfile.verificationNotes || "Please review and resubmit your application."}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => router.push("/profile/edit" as any)}
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.error, fontWeight: "700", fontSize: 15 }}>Update Application</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Stats Overview - Premium cards */}
        <Animated.View
          style={{
            paddingHorizontal: 24,
            marginBottom: 28,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 18, letterSpacing: -0.5 }}>
            Dashboard Overview
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
            {[
              { icon: "calendar", label: "Upcoming", value: stats.upcomingSessions, sublabel: "Sessions", gradient: colors.gradient1 },
              { icon: "people", label: "Active", value: stats.totalClients, sublabel: "Clients", gradient: colors.gradient2 },
              { icon: "time", label: "This Week", value: `${stats.weeklyHours}h`, sublabel: "Hours", gradient: colors.gradient3 },
              { icon: "star", label: "Rating", value: stats.rating > 0 ? stats.rating.toFixed(1) : "--", sublabel: "Average", gradient: colors.gradient4 },
            ].map((stat, index) => (
              <View key={index} style={{ width: "50%", paddingHorizontal: 6, marginBottom: 12 }}>
                <View style={{
                  backgroundColor: colors.surface,
                  borderRadius: 24,
                  padding: 20,
                  shadowColor: colors.cardShadow,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 1,
                  shadowRadius: 16,
                  elevation: 4,
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <LinearGradient
                      colors={stat.gradient}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name={stat.icon as any} size={24} color="#FFF" />
                    </LinearGradient>
                    <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>{stat.value}</Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{stat.label}</Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>{stat.sublabel}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 18, letterSpacing: -0.5 }}>
            Quick Actions
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24 }}>
            {[
              { icon: "chatbubbles", label: "Messages", color: "#7C3AED", bgColor: "rgba(124, 58, 237, 0.12)", route: "/chat" },
              { icon: "calendar", label: "Schedule", color: "#06B6D4", bgColor: "rgba(6, 182, 212, 0.12)", route: "/(main)/sessions" },
              { icon: "book", label: "Stories", color: "#F472B6", bgColor: "rgba(244, 114, 182, 0.12)", route: "/(resources)/articles" },
              { icon: "create", label: "Write Story", color: "#10B981", bgColor: "rgba(16, 185, 129, 0.12)", route: "/(resources)/articles/create" },
              { icon: "person", label: "Profile", color: "#FB923C", bgColor: "rgba(251, 146, 60, 0.12)", route: "/profile" },
            ].map((action, index) => (
              <Pressable
                key={index}
                onPress={() => router.push(action.route as any)}
                style={{ alignItems: "center", marginRight: 20 }}
              >
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 22,
                  backgroundColor: action.bgColor,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}>
                  <Ionicons name={action.icon as any} size={28} color={action.color} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, textAlign: "center" }}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Today's Schedule Card */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
              Today&apos;s Schedule
            </Text>
            <Pressable
              onPress={() => router.push("/(main)/sessions" as any)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: colors.surfaceElevated,
                borderRadius: 20,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>View All</Text>
            </Pressable>
          </View>

          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 24,
            shadowColor: colors.cardShadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 1,
            shadowRadius: 16,
            elevation: 4,
          }}>
            {stats.upcomingSessions === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.surfaceElevated,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}>
                  <Ionicons name="calendar-outline" size={36} color={colors.textSecondary} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
                  No Sessions Today
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 20, lineHeight: 20 }}>
                  Your schedule is clear. Perfect time to write a story or update your profile!
                </Text>
                <Pressable onPress={() => router.push("/(main)/sessions" as any)}>
                  <LinearGradient
                    colors={colors.gradient1}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingHorizontal: 28,
                      paddingVertical: 14,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "700" }}>Manage Schedule</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 12 }}>
                  You have {stats.upcomingSessions} upcoming session{stats.upcomingSessions > 1 ? "s" : ""}
                </Text>
                <Pressable onPress={() => router.push("/(main)/sessions" as any)}>
                  <LinearGradient
                    colors={colors.gradient1}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 14,
                      borderRadius: 16,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "700" }}>View Schedule</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* My Stories Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
                My Stories
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                Share your expertise with clients
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(resources)/articles" as any)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: colors.surfaceElevated,
                borderRadius: 20,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>See All</Text>
            </Pressable>
          </View>

          {storiesLoading ? (
            <View style={{ gap: 16 }}>
              {[1, 2].map((_, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 24,
                    padding: 20,
                    flexDirection: "row",
                  }}
                >
                  <View style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: colors.surfaceElevated, marginRight: 16 }} />
                  <View style={{ flex: 1, justifyContent: "center" }}>
                    <View style={{ height: 18, backgroundColor: colors.surfaceElevated, borderRadius: 6, marginBottom: 10 }} />
                    <View style={{ height: 14, backgroundColor: colors.surfaceElevated, borderRadius: 6, width: "70%" }} />
                  </View>
                </View>
              ))}
            </View>
          ) : myStories.length > 0 ? (
            <View style={{ gap: 16 }}>
              {myStories.slice(0, 3).map((story, index) => {
                const categoryColors = [
                  { bg: "rgba(124, 58, 237, 0.12)", text: "#7C3AED" },
                  { bg: "rgba(6, 182, 212, 0.12)", text: "#06B6D4" },
                  { bg: "rgba(244, 114, 182, 0.12)", text: "#F472B6" },
                ];
                const colorSet = categoryColors[index % 3];

                return (
                  <Pressable
                    key={story.id}
                    onPress={() =>
                      router.push({
                        pathname: "/(resources)/articles/[articleId]" as any,
                        params: { articleId: story.id },
                      })
                    }
                  >
                    <View style={{
                      backgroundColor: colors.surface,
                      borderRadius: 24,
                      padding: 18,
                      flexDirection: "row",
                      alignItems: "center",
                      shadowColor: colors.cardShadow,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 1,
                      shadowRadius: 16,
                      elevation: 4,
                    }}>
                      <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 18,
                        backgroundColor: colorSet.bg,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 16,
                      }}>
                        <Ionicons name="document-text" size={32} color={colorSet.text} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{
                          backgroundColor: story.isPublished ? "rgba(16, 185, 129, 0.12)" : "rgba(251, 191, 36, 0.12)",
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 8,
                          alignSelf: "flex-start",
                          marginBottom: 8,
                        }}>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: story.isPublished ? colors.success : colors.warning,
                          }}>
                            {story.isPublished ? "PUBLISHED" : "DRAFT"}
                          </Text>
                        </View>
                        <Text
                          style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 4, lineHeight: 22 }}
                          numberOfLines={2}
                        >
                          {story.title}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
                          <Text style={{ fontSize: 13, color: colors.textMuted, marginLeft: 4 }}>
                            {story.viewCount || 0} views
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: "/(resources)/articles/edit/[articleId]" as any,
                            params: { articleId: story.id },
                          })
                        }
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: colors.surfaceElevated,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}

              {/* Write new story button */}
              <Pressable onPress={() => router.push("/(resources)/articles/create" as any)}>
                <View style={{
                  backgroundColor: colors.surface,
                  borderRadius: 24,
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: colors.border,
                }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "rgba(124, 58, 237, 0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}>
                    <Ionicons name="add" size={26} color={colors.primary} />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>Write a New Story</Text>
                </View>
              </Pressable>
            </View>
          ) : (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 40,
              alignItems: "center",
              shadowColor: colors.cardShadow,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 1,
              shadowRadius: 16,
              elevation: 4,
            }}>
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: colors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}>
                <Ionicons name="create-outline" size={44} color={colors.textSecondary} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
                Share Your Expertise
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 22, paddingHorizontal: 20 }}>
                Write stories to help clients understand mental health topics and build trust with potential clients.
              </Text>
              <Pressable onPress={() => router.push("/(resources)/articles/create" as any)}>
                <LinearGradient
                  colors={colors.gradient1}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingHorizontal: 32,
                    paddingVertical: 16,
                    borderRadius: 24,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="create" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700" }}>Write Your First Story</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>

        {/* Client Management */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
                Your Clients
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                {clients.length} active client{clients.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 24,
              alignItems: "center",
            }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                borderWidth: 3,
                borderColor: colors.surfaceElevated,
                borderTopColor: colors.primary,
              }} />
              <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Loading clients...</Text>
            </View>
          ) : clients.length === 0 ? (
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 40,
              alignItems: "center",
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}>
                <Ionicons name="people-outline" size={36} color={colors.textSecondary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
                No Active Clients Yet
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 }}>
                Your client list will appear here once you start conducting sessions.
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24 }}>
              {clients.map((client, index) => {
                const gradients = [colors.gradient1, colors.gradient2, colors.gradient3];
                const gradient = gradients[index % 3];

                return (
                  <Pressable
                    key={client.uid}
                    onPress={() => router.push({ pathname: "/profile/[userId]", params: { userId: client.uid } })}
                    style={{ marginRight: 16, width: 140 }}
                  >
                    <View style={{
                      backgroundColor: colors.surface,
                      borderRadius: 24,
                      padding: 20,
                      alignItems: "center",
                      shadowColor: colors.cardShadow,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 1,
                      shadowRadius: 12,
                      elevation: 3,
                    }}>
                      <LinearGradient
                        colors={gradient}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 14,
                        }}
                      >
                        {client.photoURL ? (
                          <Image
                            source={{ uri: client.photoURL }}
                            style={{ width: 60, height: 60, borderRadius: 30 }}
                          />
                        ) : (
                          <Text style={{ fontSize: 24, fontWeight: "800", color: "#FFF" }}>
                            {client.displayName?.charAt(0) || "?"}
                          </Text>
                        )}
                      </LinearGradient>
                      <Text
                        style={{ fontSize: 15, fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: 8 }}
                        numberOfLines={1}
                      >
                        {client.displayName || "Unknown"}
                      </Text>
                      <View style={{
                        backgroundColor: "rgba(124, 58, 237, 0.12)",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                      }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>Client</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Professional Profile Summary */}
        <View style={{ paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 18, letterSpacing: -0.5 }}>
            Professional Profile
          </Text>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 24,
            shadowColor: colors.cardShadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 1,
            shadowRadius: 16,
            elevation: 4,
          }}>
            <View style={{ gap: 20 }}>
              {[
                { icon: "ribbon", label: "Specializations", value: counsellorProfile.specializations?.slice(0, 2).join(", ") || "Not specified", gradient: colors.gradient1 },
                { icon: "school", label: "Experience", value: `${counsellorProfile.yearsExperience || 0} years`, gradient: colors.gradient2 },
                { icon: "card", label: "License", value: counsellorProfile.licenseType || "Not specified", gradient: colors.gradient3 },
              ].map((item, index) => (
                <View key={index} style={{ flexDirection: "row", alignItems: "center" }}>
                  <LinearGradient
                    colors={item.gradient}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 16,
                    }}
                  >
                    <Ionicons name={item.icon as any} size={22} color="#FFF" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 2 }}>{item.label}</Text>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{item.value}</Text>
                  </View>
                </View>
              ))}

              {/* Session Rate */}
              <View style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: 20,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: "rgba(251, 191, 36, 0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}>
                    <Ionicons name="cash" size={24} color={colors.warning} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>Session Rate</Text>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>Per hour</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 32, fontWeight: "800", color: colors.warning }}>
                  ${counsellorProfile.hourlyRate || 0}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push("/profile")}
              style={{ marginTop: 24 }}
            >
              <View style={{
                backgroundColor: colors.surfaceElevated,
                paddingVertical: 16,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Ionicons name="create-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Edit Profile</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Logout Button */}
        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <Pressable
            onPress={handleLogout}
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              paddingVertical: 16,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.error }}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
