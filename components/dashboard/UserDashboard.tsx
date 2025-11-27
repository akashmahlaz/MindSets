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
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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
const CARD_WIDTH = SCREEN_WIDTH * 0.75;

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

  // Colors based on theme
  const colors = {
    background: isDarkColorScheme ? "#0F1419" : "#FAFBFC",
    card: isDarkColorScheme ? "#171D26" : "#FFFFFF",
    cardAlt: isDarkColorScheme ? "#1E2632" : "#F8FAFC",
    text: isDarkColorScheme ? "#F0F2F5" : "#1E2530",
    textSecondary: isDarkColorScheme ? "#8B95A5" : "#747B8A",
    primary: isDarkColorScheme ? "#6B8CF5" : "#4A6CF4",
    secondary: isDarkColorScheme ? "#4CC38A" : "#3FA57A",
    accent: isDarkColorScheme ? "#B79CFC" : "#A78BFA",
    border: isDarkColorScheme ? "#323A48" : "#E2E5E9",
  };

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
            backgroundColor: colors.card,
            borderRadius: 20,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
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
              <View 
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  backgroundColor: colors.cardAlt,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View 
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: isDarkColorScheme ? "#2A3544" : "#E8ECF0",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="person" size={40} color={colors.textSecondary} />
                </View>
              </View>
            )}
            {/* Availability Badge */}
            <View 
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                backgroundColor: "rgba(63, 165, 122, 0.9)",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFF", marginRight: 5 }} />
              <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>Available</Text>
            </View>
          </View>
          
          {/* Content */}
          <View style={{ padding: 16 }}>
            {/* Name & Rating */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Text 
                style={{ 
                  fontSize: 17, 
                  fontWeight: "700", 
                  color: colors.text,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                Dr. {counsellor.displayName}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, marginLeft: 4 }}>4.9</Text>
              </View>
            </View>
            
            {/* Specialization */}
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
              {getSpecializationLabel(counsellor.specializations?.[0])}
            </Text>
            
            {/* Experience & Rate */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 6 }}>
                  {counsellor.yearsExperience || "5+"}yrs exp
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
                ${counsellor.hourlyRate || "80"}<Text style={{ fontSize: 12, fontWeight: "500" }}>/session</Text>
              </Text>
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
        {/* Header Section */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 4 }}>
                {getGreeting()} 👋
              </Text>
              <Text style={{ fontSize: 26, fontWeight: "700", color: colors.text }}>
                {userProfileData?.firstName || userProfileData?.displayName?.split(" ")[0] || "there"}
              </Text>
            </View>
            
            <Pressable 
              onPress={() => router.push("/profile")}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.card,
                borderWidth: 2,
                borderColor: colors.primary + "30",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person" size={22} color={colors.primary} />
            </Pressable>
          </View>
          
          {/* Mood Check Card */}
          <Pressable>
            <View 
              style={{
                backgroundColor: isDarkColorScheme ? "#1E2B4A" : "#EEF4FF",
                borderRadius: 16,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View 
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.primary + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Text style={{ fontSize: 24 }}>🌤️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 2 }}>
                  How are you feeling today?
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Track your daily mood & wellness
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Pressable>
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {[
              { icon: "calendar-outline", label: "Book Session", color: colors.primary, route: "/(main)/sessions" },
              { icon: "chatbubbles-outline", label: "Messages", color: colors.secondary, route: "/chat" },
              { icon: "journal-outline", label: "Journal", color: colors.accent, route: "/(resources)/journal" },
            ].map((action, index) => (
              <Pressable
                key={index}
                onPress={() => router.push(action.route as any)}
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View 
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: action.color + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, textAlign: "center" }}>
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
              borderWidth: 1,
              borderColor: colors.border,
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
                    borderWidth: 1,
                    borderColor: colors.border,
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

        {/* Featured Articles */}
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
              Wellness Resources
            </Text>
            <Pressable>
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
                    borderWidth: 1,
                    borderColor: colors.border,
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
                      borderWidth: 1,
                      borderColor: colors.border,
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
                borderWidth: 1,
                borderColor: colors.border,
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
