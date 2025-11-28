import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Article, getFeaturedArticles } from "@/services/articleService";
import { getCounsellors } from "@/services/userService";
import {
    CounsellorProfileData,
    UserProfile,
    UserProfileData,
} from "@/types/user";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COUNSELOR_CARD_WIDTH = SCREEN_WIDTH * 0.75;

export default function UserDashboard() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [counsellors, setCounsellors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);

  const userProfileData = userProfile as UserProfileData;

  // Colors - Dark theme primary (matching tab bar)
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    surfaceElevated: isDarkColorScheme ? "#334155" : "#F1F5F9",
    text: isDarkColorScheme ? "#F8FAFC" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    textMuted: isDarkColorScheme ? "#64748B" : "#94A3B8",
    primary: "#8B5CF6",
    primaryLight: "#A78BFA",
    secondary: "#10B981",
    accent: "#EC4899",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
    cardBg: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    inputBg: isDarkColorScheme ? "#334155" : "#F1F5F9",
  };

  // Quick action colors
  const quickActionColors = {
    booking: ["#8B5CF6", "#7C3AED"],
    messages: ["#10B981", "#059669"],
    journal: ["#EC4899", "#DB2777"],
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

  const loadCounsellors = async () => {
    try {
      const filters = userProfileData?.primaryConcerns
        ? { specializations: userProfileData.primaryConcerns }
        : undefined;
      const data = await getCounsellors(filters);
      setCounsellors(data);
    } catch (error) {
      console.error("Error loading counsellors:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFeaturedArticles = async () => {
    try {
      setArticlesLoading(true);
      const articles = await getFeaturedArticles();
      setFeaturedArticles(articles);
    } catch (error) {
      console.error("Failed to load featured articles:", error);
    } finally {
      setArticlesLoading(false);
    }
  };

  useEffect(() => {
    loadCounsellors();
    loadFeaturedArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCounsellors();
    loadFeaturedArticles();
  };

  const handleCounsellorPress = (counsellor: CounsellorProfileData) => {
    router.push({
      pathname: "/profile/[userId]",
      params: { userId: counsellor.uid },
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const filteredCounsellors = counsellors.filter(
    (counsellor) =>
      counsellor.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ("specializations" in counsellor &&
        counsellor.specializations?.some((spec) =>
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        ))
  );

  // Counselor card component
  const renderCounsellorCard = (counsellor: CounsellorProfileData, index: number) => {
    return (
      <Pressable
        key={counsellor.uid}
        onPress={() => handleCounsellorPress(counsellor)}
        style={{
          width: COUNSELOR_CARD_WIDTH,
          marginRight: 16,
        }}
      >
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: 20,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDarkColorScheme ? 0.3 : 0.1,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          {/* Top gradient section */}
          <LinearGradient
            colors={["#8B5CF6", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ height: 80, position: "relative" }}
          >
            <View
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                backgroundColor: "rgba(255,255,255,0.25)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ADE80", marginRight: 6 }} />
              <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>Available</Text>
            </View>
          </LinearGradient>

          {/* Profile image */}
          <View style={{ alignItems: "center", marginTop: -40 }}>
            {counsellor.photoURL ? (
              <Image
                source={{ uri: counsellor.photoURL }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  borderWidth: 3,
                  borderColor: colors.cardBg,
                }}
              />
            ) : (
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  borderWidth: 3,
                  borderColor: colors.cardBg,
                  backgroundColor: colors.surfaceElevated,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="person" size={36} color={colors.textSecondary} />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={{ padding: 16, paddingTop: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
                textAlign: "center",
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              Dr. {counsellor.displayName}
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {counsellor.specializations?.[0]?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Mental Health Expert"}
            </Text>

            {/* Stats */}
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 14 }}>
              <View style={{ alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginLeft: 4 }}>4.9</Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Rating</Text>
              </View>
              <View style={{ width: 1, backgroundColor: colors.border }} />
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{counsellor.yearsExperience || 5}+</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Years</Text>
              </View>
              <View style={{ width: 1, backgroundColor: colors.border }} />
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>${counsellor.hourlyRate || 80}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Per hr</Text>
              </View>
            </View>

            {/* Connect button */}
            <Pressable onPress={() => handleCounsellorPress(counsellor)}>
              <LinearGradient
                colors={["#8B5CF6", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "600" }}>Connect</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  if (!userProfileData || userProfileData.role !== "user") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.surfaceElevated,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ============ OLD STYLE HEADER ============ */}
        <Animated.View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Greeting and Profile */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <View>
              <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 4 }}>
                {getGreeting()} 👋
              </Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>
                {userProfileData?.firstName || userProfileData?.displayName?.split(" ")[0] || "there"}
              </Text>
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
              {userProfileData?.photoURL ? (
                <Image
                  source={{ uri: userProfileData.photoURL }}
                  style={{ width: 48, height: 48, borderRadius: 16 }}
                />
              ) : (
                <Ionicons name="person" size={22} color={colors.textSecondary} />
              )}
            </Pressable>
          </View>

          {/* Mood Card - OLD STYLE */}
          <Pressable onPress={() => router.push("/(resources)/journal" as any)}>
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: colors.surfaceElevated,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <Text style={{ fontSize: 28 }}>🌤️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 2 }}>
                  How are you feeling today?
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Track your daily mood & wellness
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

        {/* ============ QUICK ACTIONS - OLD STYLE (3 equal cards) ============ */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 14 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {[
              { icon: "calendar-outline", label: "Book\nSession", colors: quickActionColors.booking, route: "/(main)/sessions" },
              { icon: "chatbubbles-outline", label: "Messages", colors: quickActionColors.messages, route: "/chat" },
              { icon: "journal-outline", label: "Journal", colors: quickActionColors.journal, route: "/(resources)/journal" },
            ].map((action, index) => (
              <Pressable
                key={index}
                onPress={() => router.push(action.route as any)}
                style={{
                  flex: 1,
                  backgroundColor: colors.cardBg,
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
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

        {/* ============ SEARCH BAR ============ */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: colors.inputBg,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
            }}
          >
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <Input
              placeholder="Search counselors by name or specialty..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                paddingVertical: 14,
                paddingHorizontal: 12,
                fontSize: 15,
                color: colors.text,
                backgroundColor: "transparent",
                borderWidth: 0,
              }}
            />
          </View>
        </View>

        {/* ============ RECOMMENDED COUNSELORS - NEW STYLE ============ */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
              Recommended for You
            </Text>
            <Pressable onPress={() => router.push("/(main)/Counselors")}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>See All</Text>
            </Pressable>
          </View>

          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {[1, 2, 3].map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: COUNSELOR_CARD_WIDTH,
                    marginRight: 16,
                    backgroundColor: colors.cardBg,
                    borderRadius: 20,
                    height: 280,
                  }}
                >
                  <View style={{ height: 80, backgroundColor: colors.surfaceElevated, borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
                  <View style={{ padding: 16, alignItems: "center" }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceElevated, marginTop: -56 }} />
                    <View style={{ height: 18, backgroundColor: colors.surfaceElevated, borderRadius: 6, width: "70%", marginTop: 12 }} />
                    <View style={{ height: 14, backgroundColor: colors.surfaceElevated, borderRadius: 6, width: "50%", marginTop: 8 }} />
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : filteredCounsellors.length === 0 ? (
            <View style={{ paddingHorizontal: 20, paddingVertical: 40, alignItems: "center" }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.surfaceElevated,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="people-outline" size={36} color={colors.textSecondary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                No counselors found
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center" }}>
                Try adjusting your search criteria
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              decelerationRate="fast"
              snapToInterval={COUNSELOR_CARD_WIDTH + 16}
            >
              {filteredCounsellors.slice(0, 5).map((counsellor, index) =>
                renderCounsellorCard(counsellor as CounsellorProfileData, index)
              )}
            </ScrollView>
          )}
        </View>

        {/* ============ FEATURED STORIES ============ */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
              Featured Stories
            </Text>
            <Pressable onPress={() => router.push("/(resources)/articles" as any)}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>See All</Text>
            </Pressable>
          </View>

          {articlesLoading ? (
            <View style={{ gap: 12 }}>
              {[1, 2].map((_, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.cardBg,
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: "row",
                  }}
                >
                  <View style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: colors.surfaceElevated, marginRight: 14 }} />
                  <View style={{ flex: 1, justifyContent: "center" }}>
                    <View style={{ height: 16, backgroundColor: colors.surfaceElevated, borderRadius: 6, marginBottom: 8 }} />
                    <View style={{ height: 14, backgroundColor: colors.surfaceElevated, borderRadius: 6, width: "70%" }} />
                  </View>
                </View>
              ))}
            </View>
          ) : featuredArticles.length > 0 ? (
            <View style={{ gap: 12 }}>
              {featuredArticles.slice(0, 3).map((article) => (
                <Pressable
                  key={article.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(resources)/articles/[articleId]" as any,
                      params: { articleId: article.id },
                    })
                  }
                >
                  <View
                    style={{
                      backgroundColor: colors.cardBg,
                      borderRadius: 16,
                      padding: 14,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 14,
                        backgroundColor: colors.surfaceElevated,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 14,
                      }}
                    >
                      <Ionicons name="document-text" size={28} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: colors.text,
                          marginBottom: 4,
                          lineHeight: 20,
                        }}
                        numberOfLines={2}
                      >
                        {article.title}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                        <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>
                          {article.readTime || 5} min read
                        </Text>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textMuted, marginHorizontal: 8 }} />
                        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "500" }}>
                          {article.category || "Wellness"}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
              }}
            >
              <Ionicons name="newspaper-outline" size={40} color={colors.textSecondary} />
              <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 12 }}>
                No stories available
              </Text>
              <Pressable
                onPress={() => router.push("/(resources)/articles/create" as any)}
                style={{ marginTop: 16 }}
              >
                <LinearGradient
                  colors={["#8B5CF6", "#7C3AED"]}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "600" }}>Write a Story</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>

        {/* ============ WELLNESS RESOURCES ============ */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 14 }}>
            Wellness Resources
          </Text>
          <View style={{ gap: 12 }}>
            {[
              { icon: "leaf-outline", label: "Meditation", desc: "Calm your mind", color: "#10B981", route: "/(resources)/meditation" },
              { icon: "fitness-outline", label: "Breathing", desc: "Reduce stress", color: "#06B6D4", route: "/(resources)/breathing" },
              { icon: "moon-outline", label: "Sleep", desc: "Better rest", color: "#8B5CF6", route: "/(resources)/sleep" },
            ].map((item, index) => (
              <Pressable
                key={index}
                onPress={() => router.push(item.route as any)}
                style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: `${item.color}20`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{item.label}</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
