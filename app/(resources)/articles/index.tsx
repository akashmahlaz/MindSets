import { useAuth } from "@/context/AuthContext";
import {
    Article,
    getAllArticles,
    getUserArticles,
} from "@/services/articleService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Perplexity-inspired color tokens
const getColors = (isDark: boolean) => ({
  background: isDark ? "#0D0D0D" : "#FFFFFF",
  surface: isDark ? "#171717" : "#F9FAFB",
  surfaceHover: isDark ? "#1F1F1F" : "#F3F4F6",
  text: isDark ? "#FAFAFA" : "#111827",
  textSecondary: isDark ? "#A3A3A3" : "#6B7280",
  textMuted: isDark ? "#737373" : "#9CA3AF",
  border: isDark ? "#262626" : "#E5E7EB",
  borderSubtle: isDark ? "#1F1F1F" : "#F3F4F6",
  primary: "#6366F1",
  primarySoft: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.08)",
  accent: isDark ? "#818CF8" : "#4F46E5",
  success: "#10B981",
  warning: "#F59E0B",
});

export default function ArticlesIndex() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getColors(isDark);
  const { userProfile } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "my">("all");

  useEffect(() => {
    loadArticles();
  }, [selectedTab]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      if (selectedTab === "all") {
        const data = await getAllArticles();
        setArticles(data);
      } else if (userProfile?.uid) {
        const data = await getUserArticles(userProfile.uid);
        setUserArticles(data);
      }
    } catch (error) {
      console.error("Failed to load articles:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadArticles();
  };

  const filteredArticles =
    selectedTab === "all"
      ? articles.filter(
          (article) =>
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.category.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : userArticles.filter(
          (article) =>
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.category.toLowerCase().includes(searchQuery.toLowerCase()),
        );
  const handleArticlePress = (articleId: string) => {
    router.push({
      pathname: "/articles/[articleId]" as any,
      params: { articleId },
    });
  };

  // Featured article - first featured or first article
  const featuredArticle = filteredArticles.find(a => a.isFeatured) || filteredArticles[0];
  const remainingArticles = filteredArticles.filter(a => a.id !== featuredArticle?.id);

  // Perplexity-style Featured Card
  const renderFeaturedCard = (article: Article) => (
    <Pressable
      onPress={() => handleArticlePress(article.id)}
      style={{
        marginBottom: 32,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: colors.surface,
        ...Platform.select({
          ios: {
            shadowColor: isDark ? "#000" : "#6366F1",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.4 : 0.12,
            shadowRadius: 24,
          },
          android: {
            elevation: 8,
          },
        }),
      }}
    >
      {/* Hero Image */}
      <View style={{ height: 200, position: "relative" }}>
        {article.imageUrl ? (
          <Image
            source={{ uri: article.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={isDark ? ["#312E81", "#1E1B4B"] : ["#EEF2FF", "#C7D2FE"]}
            style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}
          >
            <Ionicons name="newspaper-outline" size={48} color={colors.primary} />
          </LinearGradient>
        )}
        {/* Gradient Overlay */}
        <LinearGradient
          colors={["transparent", isDark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.4)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
          }}
        />
        {/* Featured Badge */}
        {article.isFeatured && (
          <View style={{
            position: "absolute",
            top: 16,
            left: 16,
            backgroundColor: colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            flexDirection: "row",
            alignItems: "center",
          }}>
            <Ionicons name="star" size={12} color="#FFF" />
            <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600", marginLeft: 4 }}>
              Featured
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={{ padding: 20 }}>
        {/* Category */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={{
            backgroundColor: colors.primarySoft,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>
              {article.category}
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 12 }}>
            {article.readTime} min read
          </Text>
        </View>

        {/* Title */}
        <Text style={{
          fontSize: 22,
          fontWeight: "700",
          color: colors.text,
          lineHeight: 28,
          marginBottom: 8,
          letterSpacing: -0.3,
        }} numberOfLines={2}>
          {article.title}
        </Text>

        {/* Description */}
        <Text style={{
          fontSize: 15,
          color: colors.textSecondary,
          lineHeight: 22,
          marginBottom: 16,
        }} numberOfLines={2}>
          {article.description}
        </Text>

        {/* Author Row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: colors.surfaceHover,
              marginRight: 10,
            }}>
              {article.authorPhotoURL ? (
                <Image source={{ uri: article.authorPhotoURL }} style={{ width: "100%", height: "100%" }} />
              ) : (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 14 }}>👤</Text>
                </View>
              )}
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                {article.authorName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {article.createdAt?.toDate?.()?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) || "Recent"}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
            <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>
              {article.viewCount}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  // Perplexity-style Compact Article Card
  const renderArticleCard = (article: Article, index: number) => (
    <Pressable
      key={article.id}
      onPress={() => handleArticlePress(article.id)}
      style={({ pressed }) => ({
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: pressed ? colors.surfaceHover : colors.surface,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      })}
    >
      <View style={{ flexDirection: "row", padding: 16 }}>
        {/* Left Content */}
        <View style={{ flex: 1, paddingRight: 16 }}>
          {/* Category & Time */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{
              fontSize: 12,
              fontWeight: "600",
              color: colors.primary,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}>
              {article.category}
            </Text>
            <View style={{
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: colors.textMuted,
              marginHorizontal: 8,
            }} />
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              {article.readTime} min
            </Text>
          </View>

          {/* Title */}
          <Text style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.text,
            lineHeight: 22,
            marginBottom: 6,
            letterSpacing: -0.2,
          }} numberOfLines={2}>
            {article.title}
          </Text>

          {/* Description */}
          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
            marginBottom: 12,
          }} numberOfLines={2}>
            {article.description}
          </Text>

          {/* Author & Stats */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>
              {article.authorName}
            </Text>
            <View style={{
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: colors.textMuted,
              marginHorizontal: 8,
            }} />
            <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
            <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>
              {article.viewCount}
            </Text>
          </View>
        </View>

        {/* Thumbnail */}
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: colors.surfaceHover,
        }}>
          {article.imageUrl ? (
            <Image
              source={{ uri: article.imageUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={isDark ? ["#312E81", "#1E1B4B"] : ["#EEF2FF", "#E0E7FF"]}
              style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            >
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            </LinearGradient>
          )}
        </View>
      </View>

      {/* Featured Indicator */}
      {article.isFeatured && (
        <View style={{
          position: "absolute",
          top: 8,
          right: 8,
          backgroundColor: colors.warning,
          width: 6,
          height: 6,
          borderRadius: 3,
        }} />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Minimal Header - Perplexity Style */}
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
        backgroundColor: colors.background,
      }}>
        {/* Top Row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.surface,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>
            Articles
          </Text>

          {(userProfile?.role === "counsellor" || userProfile?.role === "admin") && (
            <TouchableOpacity
              onPress={() => router.push("/(resources)/articles/create")}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          )}

          {!(userProfile?.role === "counsellor" || userProfile?.role === "admin") && (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Search Bar - Minimal */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderRadius: 14,
          paddingHorizontal: 14,
          height: 48,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search articles..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              color: colors.text,
            }}
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Pills - Perplexity Style */}
        <View style={{
          flexDirection: "row",
          marginTop: 16,
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 4,
        }}>
          <TouchableOpacity
            onPress={() => setSelectedTab("all")}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: selectedTab === "all" ? colors.background : "transparent",
              ...Platform.select({
                ios: selectedTab === "all" ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                } : {},
                android: selectedTab === "all" ? { elevation: 2 } : {},
              }),
            }}
          >
            <Text style={{
              textAlign: "center",
              fontWeight: "600",
              fontSize: 14,
              color: selectedTab === "all" ? colors.text : colors.textMuted,
            }}>
              All Articles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab("my")}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: selectedTab === "my" ? colors.background : "transparent",
              ...Platform.select({
                ios: selectedTab === "my" ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                } : {},
                android: selectedTab === "my" ? { elevation: 2 } : {},
              }),
            }}
          >
            <Text style={{
              textAlign: "center",
              fontWeight: "600",
              fontSize: 14,
              color: selectedTab === "my" ? colors.text : colors.textMuted,
            }}>
              My Articles
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Articles List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          // Skeleton Loading - Perplexity Style
          <>
            {/* Featured Skeleton */}
            <View style={{
              marginBottom: 32,
              borderRadius: 20,
              overflow: "hidden",
              backgroundColor: colors.surface,
            }}>
              <View style={{ height: 200, backgroundColor: colors.surfaceHover }} />
              <View style={{ padding: 20 }}>
                <View style={{ flexDirection: "row", marginBottom: 12 }}>
                  <View style={{ width: 60, height: 20, borderRadius: 10, backgroundColor: colors.surfaceHover }} />
                  <View style={{ width: 60, height: 20, borderRadius: 10, backgroundColor: colors.surfaceHover, marginLeft: 12 }} />
                </View>
                <View style={{ height: 24, borderRadius: 8, backgroundColor: colors.surfaceHover, marginBottom: 8 }} />
                <View style={{ height: 16, borderRadius: 8, backgroundColor: colors.surfaceHover, width: "80%" }} />
              </View>
            </View>

            {/* Card Skeletons */}
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={{
                marginBottom: 16,
                borderRadius: 16,
                backgroundColor: colors.surface,
                padding: 16,
                flexDirection: "row",
              }}>
                <View style={{ flex: 1, paddingRight: 16 }}>
                  <View style={{ height: 12, borderRadius: 6, backgroundColor: colors.surfaceHover, width: 80, marginBottom: 8 }} />
                  <View style={{ height: 18, borderRadius: 8, backgroundColor: colors.surfaceHover, marginBottom: 6 }} />
                  <View style={{ height: 14, borderRadius: 7, backgroundColor: colors.surfaceHover, width: "90%" }} />
                </View>
                <View style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: colors.surfaceHover }} />
              </View>
            ))}
          </>
        ) : filteredArticles.length > 0 ? (
          <>
            {/* Featured Article */}
            {featuredArticle && renderFeaturedCard(featuredArticle)}

            {/* Section Header */}
            {remainingArticles.length > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}>
                  More Articles
                </Text>
                <View style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: colors.borderSubtle,
                  marginLeft: 12,
                }} />
              </View>
            )}

            {/* Article List */}
            {remainingArticles.map((article, index) => renderArticleCard(article, index))}
          </>
        ) : (
          // Empty State - Clean Design
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.surface,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}>
              <Ionicons name="newspaper-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={{
              fontSize: 20,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 8,
            }}>
              {selectedTab === "my" ? "No articles yet" : "No articles found"}
            </Text>
            <Text style={{
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: "center",
              paddingHorizontal: 40,
              lineHeight: 22,
            }}>
              {selectedTab === "my"
                ? "Start sharing your knowledge by writing your first article!"
                : "Try adjusting your search or check back later."}
            </Text>
            {selectedTab === "my" && (userProfile?.role === "counsellor" || userProfile?.role === "admin") && (
              <TouchableOpacity
                onPress={() => router.push("/articles/create" as any)}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 12,
                  marginTop: 24,
                }}
              >
                <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 15 }}>
                  Write Article
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
