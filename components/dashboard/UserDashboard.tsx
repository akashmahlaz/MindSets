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
const CARD_WIDTH = SCREEN_WIDTH * 0.78;

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

  // Premium Material Design 3 colors
  const colors = {
    background: isDarkColorScheme ? "#0F172A" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#334155" : "#F1F5F9",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#6366F1",
    primaryContainer: isDarkColorScheme ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.08)",
    secondary: "#10B981",
    secondaryContainer: isDarkColorScheme ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.08)",
    accent: "#8B5CF6",
    accentContainer: isDarkColorScheme ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.08)",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
    card: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    cardAlt: isDarkColorScheme ? "#1E2632" : "#F8FAFC",
  };

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const loadCounsellors = async () => {
    try {
      const filters = userProfileData?.primaryConcerns
        ? {
            specializations: userProfileData.primaryConcerns,
          }
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

  useEffect(() => {
    loadCounsellors();
    loadFeaturedArticles();
  }, []);

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

  const filteredCounsellors = counsellors.filter(
    (counsellor) =>
      counsellor.displayName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      ("specializations" in counsellor &&
        counsellor.specializations?.some((spec) =>
          spec.toLowerCase().includes(searchQuery.toLowerCase()),
        )),
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getSpecializationLabel = (spec: string | undefined) => {
    const labels: Record<string, string> = {
      anxiety: "Anxiety & Stress",
      depression: "Depression",
      relationship: "Relationships",
      trauma: "Trauma & PTSD",
      "stress-management": "Stress Management",
    };
    return spec ? labels[spec] || spec.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase()) : "General Counseling";
  };

  const renderCounsellorCard = (counsellor: CounsellorProfileData, index: number) => {
    return (
      <Pressable
        key={counsellor.uid}
        onPress={() => handleCounsellorPress(counsellor)}
        style={{
          width: CARD_WIDTH,
          marginRight: 16,
          marginLeft: index === 0 ? 0 : 0,
        }}
      >
        <View 
          style={{
            backgroundColor: colors.surface,
            borderRadius: 24,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDarkColorScheme ? 0.4 : 0.1,
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          {/* Profile Image with Gradient Overlay */}
          <View style={{ height: 180, position: "relative" }}>
            {counsellor.photoURL ? (
              <Image
                source={{ uri: counsellor.photoURL }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={isDarkColorScheme ? ["#1E293B", "#334155"] : ["#E0E7FF", "#C7D2FE"]}
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View 
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 24,
                    backgroundColor: colors.primaryContainer,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="person" size={40} color={colors.primary} />
                </View>
              </LinearGradient>
            )}
            {/* Availability Badge */}
            <View 
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                backgroundColor: "rgba(16, 185, 129, 0.95)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFF", marginRight: 6 }} />
              <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>Available</Text>
            </View>
            
            {/* Bottom gradient overlay */}
            <LinearGradient
              colors={["transparent", isDarkColorScheme ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)"]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
              }}
            />
          </View>
          
          {/* Content */}
          <View style={{ padding: 18 }}>
            {/* Name & Rating */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Text 
                style={{ 
                  fontSize: 18, 
                  fontWeight: "800", 
                  color: colors.text,
                  flex: 1,
                  letterSpacing: -0.3,
                }}
                numberOfLines={1}
              >
                Dr. {counsellor.displayName}
              </Text>
              <View style={{ 
                flexDirection: "row", 
                alignItems: "center",
                backgroundColor: "#FEF3C7",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#B45309", marginLeft: 4 }}>4.9</Text>
              </View>
            </View>
            
            {/* Specialization */}
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 14 }}>
              {getSpecializationLabel(counsellor.specializations?.[0])}
            </Text>
            
            {/* Experience & Rate */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ 
                  width: 28, height: 28, borderRadius: 8, 
                  backgroundColor: colors.surfaceVariant, 
                  alignItems: "center", justifyContent: "center", marginRight: 8 
                }}>
                  <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
                </View>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: "600" }}>
                  {counsellor.yearsExperience || "5+"}yrs exp
                </Text>
              </View>
              <View style={{ 
                backgroundColor: colors.primaryContainer, 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: 10 
              }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>
                  ${counsellor.hourlyRate || "80"}
                  <Text style={{ fontSize: 12, fontWeight: "600" }}>/hr</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  if (!userProfileData || userProfileData.role !== "user") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View 
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="hourglass-outline" size={32} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"} 
        backgroundColor={colors.background} 
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Premium Header Section */}
        <Animated.View 
          style={{ 
            paddingHorizontal: 24, 
            paddingTop: 20, 
            paddingBottom: 24,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 4, fontWeight: "500" }}>
                {getGreeting()} 👋
              </Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
                {userProfileData?.firstName || userProfileData?.displayName?.split(" ")[0] || "there"}
              </Text>
            </View>
            
            <Pressable 
              onPress={() => router.push("/profile")}
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={["#6366F1", "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 52,
                  height: 52,
                  padding: 2,
                }}
              >
                <View style={{
                  flex: 1,
                  borderRadius: 16,
                  backgroundColor: colors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
              </LinearGradient>
            </Pressable>
          </View>
          
          {/* Premium Mood Check Card */}
          <Pressable onPress={() => router.push("/(resources)/journal" as any)}>
            <LinearGradient
              colors={isDarkColorScheme ? ["#1E293B", "#334155"] : ["#EEF2FF", "#E0E7FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View 
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: colors.primaryContainer,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Text style={{ fontSize: 28 }}>🌤️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
                  How are you feeling today?
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  Track your daily mood & wellness
                </Text>
              </View>
              <View style={{ 
                width: 36, height: 36, borderRadius: 12, 
                backgroundColor: colors.primary + "15",
                alignItems: "center", justifyContent: "center" 
              }}>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 16, letterSpacing: -0.3 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {[
              { icon: "calendar-outline", label: "Book\nSession", color: "#6366F1", gradient: ["#6366F1", "#8B5CF6"], route: "/(main)/sessions" },
              { icon: "chatbubbles-outline", label: "Messages", color: "#10B981", gradient: ["#10B981", "#059669"], route: "/chat" },
              { icon: "journal-outline", label: "Journal", color: "#EC4899", gradient: ["#EC4899", "#DB2777"], route: "/(resources)/journal" },
            ].map((action, index) => (
              <Pressable
                key={index}
                onPress={() => router.push(action.route as any)}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  padding: 18,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDarkColorScheme ? 0.2 : 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <LinearGradient
                  colors={action.gradient as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name={action.icon as any} size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text, textAlign: "center", lineHeight: 18 }}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Search Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View 
            style={{
              backgroundColor: colors.card,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDarkColorScheme ? 0.15 : 0.04,
              shadowRadius: 6,
              elevation: 2,
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

        {/* Recommended Counselors */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
              Recommended for You
            </Text>
            <Pressable onPress={() => router.push("/(main)/Counselors")}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>See All</Text>
            </Pressable>
          </View>
          
          {loading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {[1, 2, 3].map((_, index) => (
                <View 
                  key={index}
                  style={{
                    width: CARD_WIDTH,
                    marginRight: 16,
                    backgroundColor: colors.card,
                    borderRadius: 20,
                    overflow: "hidden",
                  }}
                >
                  <View style={{ height: 180, backgroundColor: colors.cardAlt }} />
                  <View style={{ padding: 16 }}>
                    <View style={{ height: 20, backgroundColor: colors.cardAlt, borderRadius: 6, marginBottom: 8 }} />
                    <View style={{ height: 16, backgroundColor: colors.cardAlt, borderRadius: 6, width: "60%", marginBottom: 12 }} />
                    <View style={{ height: 16, backgroundColor: colors.cardAlt, borderRadius: 6, width: "40%" }} />
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : filteredCounsellors.length === 0 ? (
            <View style={{ paddingHorizontal: 24, paddingVertical: 40, alignItems: "center" }}>
              <View 
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.cardAlt,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="people-outline" size={36} color={colors.textSecondary} />
              </View>
              <Text style={{ fontSize: 17, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
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
              contentContainerStyle={{ paddingHorizontal: 24 }}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + 16}
            >
              {filteredCounsellors.slice(0, 5).map((counsellor, index) =>
                renderCounsellorCard(counsellor as CounsellorProfileData, index)
              )}
            </ScrollView>
          )}
        </View>

        {/* Featured Stories */}
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
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
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: "row",
                  }}
                >
                  <View style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: colors.cardAlt, marginRight: 16 }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ height: 16, backgroundColor: colors.cardAlt, borderRadius: 6, marginBottom: 8 }} />
                    <View style={{ height: 14, backgroundColor: colors.cardAlt, borderRadius: 6, width: "80%", marginBottom: 8 }} />
                    <View style={{ height: 12, backgroundColor: colors.cardAlt, borderRadius: 6, width: "40%" }} />
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
                      pathname: "/articles/[articleId]" as any,
                      params: { articleId: article.id },
                    })
                  }
                >
                  <View 
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDarkColorScheme ? 0.15 : 0.04,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    <View 
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        backgroundColor: colors.primary + "15",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 16,
                      }}
                    >
                      <Ionicons name="document-text" size={28} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text 
                        style={{ fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 4 }}
                        numberOfLines={2}
                      >
                        {article.title}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4 }}>
                          {article.readTime || 5} min read
                        </Text>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textSecondary, marginHorizontal: 8 }} />
                        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "500" }}>
                          {article.category || "Health"}
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
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDarkColorScheme ? 0.15 : 0.04,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Ionicons name="newspaper-outline" size={40} color={colors.textSecondary} />
              <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 12 }}>
                No articles available
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
