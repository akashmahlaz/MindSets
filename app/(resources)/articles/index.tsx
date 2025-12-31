import { useAuth } from "@/context/AuthContext";
import {
    Article,
    getAllArticles,
    getUserArticles,
} from "@/services/articleService";
import { getSavedArticleIds, saveArticle, unsaveArticle } from "@/services/userService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "discover" | "my-stories" | "bookmarks";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_HEIGHT = SCREEN_HEIGHT * 0.55; // Big cards like Perplexity

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
  primary: "#2AA79D", // MindSets teal
  primarySoft: isDark ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.1)",
  accent: isDark ? "#2AA79D" : "#2AA79D",
  success: "#2AA79D",
  warning: "#F59E0B",
});

// Category tabs like Perplexity
const CATEGORIES = [
  { id: "for-you", label: "For You" },
  { id: "top-stories", label: "Top Stories" },
  { id: "mental-health", label: "Mental Health" },
  { id: "wellness", label: "Wellness" },
  { id: "relationships", label: "Relationships" },
  { id: "self-care", label: "Self Care" },
];

// Main tabs
const MAIN_TABS = [
  { id: "discover", label: "Discover", icon: "compass-outline" },
  { id: "my-stories", label: "My Stories", icon: "person-outline" },
  { id: "bookmarks", label: "Bookmarks", icon: "bookmark-outline" },
];

export default function StoriesIndex() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getColors(isDark);
  const { userProfile } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Article[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("for-you");
  const [activeTab, setActiveTab] = useState<TabType>("discover");

  // Load bookmarked article IDs
  const loadBookmarkedIds = useCallback(async () => {
    if (!userProfile?.uid) return;
    try {
      // Get saved article IDs from user profile (single Firebase call)
      const savedIds = await getSavedArticleIds(userProfile.uid);
      setBookmarkedIds(new Set(savedIds));
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    }
  }, [userProfile?.uid]);

  // Load bookmarked articles when we have both articles and bookmarked IDs
  useEffect(() => {
    if (articles.length > 0 && bookmarkedIds.size > 0) {
      const bookmarked = articles.filter(article => bookmarkedIds.has(article.id));
      setBookmarkedArticles(bookmarked);
    } else if (bookmarkedIds.size === 0) {
      setBookmarkedArticles([]);
    }
  }, [articles, bookmarkedIds]);

  useEffect(() => {
    loadStories();
    loadBookmarkedIds();
  }, [activeTab, loadBookmarkedIds]);

  const loadStories = async () => {
    try {
      setLoading(true);
      const data = await getAllArticles();
      setArticles(data);
      if (userProfile?.uid) {
        const userData = await getUserArticles(userProfile.uid);
        setUserArticles(userData);
      }
    } catch (error) {
      console.error("Failed to load stories:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStories();
  };

  // Toggle bookmark
  const handleBookmark = async (articleId: string, e: any) => {
    e.stopPropagation(); // Prevent card press
    if (!userProfile?.uid) return;
    
    try {
      const isCurrentlyBookmarked = bookmarkedIds.has(articleId);
      
      if (isCurrentlyBookmarked) {
        await unsaveArticle(userProfile.uid, articleId);
        setBookmarkedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(articleId);
          return newSet;
        });
        setBookmarkedArticles(prev => prev.filter(a => a.id !== articleId));
      } else {
        await saveArticle(userProfile.uid, articleId);
        setBookmarkedIds(prev => new Set([...prev, articleId]));
        const article = articles.find(a => a.id === articleId);
        if (article) {
          setBookmarkedArticles(prev => [...prev, article]);
        }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  // Filter stories by category or show user's stories or bookmarks
  const filteredStories = activeTab === "my-stories" 
    ? userArticles
    : activeTab === "bookmarks"
    ? bookmarkedArticles
    : articles.filter((article) => {
        if (selectedCategory === "for-you") return true;
        if (selectedCategory === "top-stories") return article.isFeatured || article.viewCount > 10;
        return article.category.toLowerCase().includes(selectedCategory.replace("-", " "));
      });
  const handleStoryPress = (storyId: string) => {
    router.push({
      pathname: "/articles/[articleId]" as any,
      params: { articleId: storyId },
    });
  };

  // Perplexity-style Big Story Card (vertical scroll)
  const renderBigStoryCard = (article: Article) => (
    <Pressable
      key={article.id}
      onPress={() => handleStoryPress(article.id)}
      style={{
        marginBottom: 24,
        marginHorizontal: 16,
      }}
    >
      {/* Big Image Card with Rounded Corners */}
      <View style={{
        height: CARD_HEIGHT,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: colors.surface,
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.4 : 0.15,
            shadowRadius: 20,
          },
          android: { elevation: 8 },
        }),
      }}>
        {/* Full Card Image */}
        {article.imageUrl ? (
          <Image
            source={{ uri: article.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={isDark ? ["#1a3a38", "#0d1f1e"] : ["#e0f2f1", "#b2dfdb"]}
            style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}
          >
            <Ionicons name="newspaper-outline" size={64} color={colors.primary} />
          </LinearGradient>
        )}

        {/* Gradient Overlay for Text Readability */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
            justifyContent: "flex-end",
            padding: 20,
            paddingBottom: 24,
          }}
        >
          {/* Title - Big & Bold */}
          <Text style={{
            fontSize: 24,
            fontWeight: "700",
            color: "#FFFFFF",
            lineHeight: 32,
            marginBottom: 12,
            letterSpacing: -0.5,
          }} numberOfLines={3}>
            {article.title}
          </Text>

          {/* Description Preview */}
          <Text style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.85)",
            lineHeight: 22,
            marginBottom: 16,
          }} numberOfLines={2}>
            {article.description}
          </Text>

          {/* Author Row */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Author Avatar */}
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "rgba(255,255,255,0.2)",
                marginRight: 10,
              }}>
                {article.authorPhotoURL ? (
                  <Image source={{ uri: article.authorPhotoURL }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 14, color: "#FFF" }}>👤</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: "rgba(255,255,255,0.9)" }}>
                {article.authorName}
              </Text>
            </View>

            {/* Bookmark Icon */}
            <TouchableOpacity 
              onPress={(e) => handleBookmark(article.id, e)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: bookmarkedIds.has(article.id) ? colors.primary : "rgba(255,255,255,0.15)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons 
                name={bookmarkedIds.has(article.id) ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color="#FFF" 
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

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
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Header - Stories Style */}
      <View style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: colors.background,
      }}>
        {/* Top Row - Back, Title, Add */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={{ 
            fontSize: 20, 
            fontWeight: "700", 
            color: colors.text,
            letterSpacing: -0.3,
          }}>
            Stories
          </Text>

          {/* Add Button - All users can create stories */}
          <TouchableOpacity
            onPress={() => router.push("/(resources)/articles/create")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="add-circle-outline" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Main Tabs - Discover / My Stories */}
        <View style={{
          flexDirection: "row",
          backgroundColor: colors.surface,
          borderRadius: 14,
          padding: 4,
          marginBottom: 16,
        }}>
          {MAIN_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id as TabType)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: activeTab === tab.id ? colors.background : "transparent",
                ...(activeTab === tab.id && Platform.OS === "ios" ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                } : {}),
                ...(activeTab === tab.id && Platform.OS === "android" ? { elevation: 2 } : {}),
              }}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
                color={activeTab === tab.id ? colors.primary : colors.textMuted} 
              />
              <Text style={{
                fontSize: 14,
                fontWeight: "600",
                color: activeTab === tab.id ? colors.text : colors.textMuted,
                marginLeft: 6,
              }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Tabs - Only show on Discover tab */}
        {activeTab === "discover" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: selectedCategory === category.id 
                    ? colors.primary 
                    : colors.surface,
                  marginRight: 8,
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: selectedCategory === category.id ? "#FFFFFF" : colors.textSecondary,
                }}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Stories - Big Vertical Scrolling Cards */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
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
          // Skeleton Loading - Big Cards
          <>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={{
                marginBottom: 24,
                marginHorizontal: 16,
                height: CARD_HEIGHT,
                borderRadius: 24,
                backgroundColor: colors.surface,
                overflow: "hidden",
              }}>
                <View style={{ flex: 1, backgroundColor: colors.surfaceHover }} />
                <View style={{ 
                  position: "absolute", 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  padding: 20,
                  backgroundColor: "rgba(0,0,0,0.5)",
                }}>
                  <View style={{ height: 28, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 12, width: "90%" }} />
                  <View style={{ height: 16, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.15)", width: "70%" }} />
                </View>
              </View>
            ))}
          </>
        ) : filteredStories.length > 0 ? (
          // Big Story Cards
          filteredStories.map((story) => renderBigStoryCard(story))
        ) : (
          // Empty State
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 20 }}>
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.surface,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}>
              <Ionicons 
                name={activeTab === "my-stories" ? "create-outline" : activeTab === "bookmarks" ? "bookmark-outline" : "newspaper-outline"} 
                size={48} 
                color={colors.textMuted} 
              />
            </View>
            <Text style={{
              fontSize: 22,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 8,
            }}>
              {activeTab === "my-stories" ? "No stories yet" : activeTab === "bookmarks" ? "No bookmarks yet" : "No stories found"}
            </Text>
            <Text style={{
              fontSize: 16,
              color: colors.textSecondary,
              textAlign: "center",
              paddingHorizontal: 40,
              lineHeight: 24,
            }}>
              {activeTab === "my-stories" 
                ? "Share your thoughts and experiences with the community"
                : activeTab === "bookmarks"
                ? "Bookmark stories to save them for later reading"
                : "Check back later for new content"}
            </Text>
            {activeTab !== "bookmarks" && (
              <TouchableOpacity
                onPress={() => router.push("/articles/create" as any)}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 28,
                  paddingVertical: 16,
                  borderRadius: 24,
                  marginTop: 28,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons name="create-outline" size={20} color="#FFF" />
                <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 16, marginLeft: 8 }}>
                  Write Story
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
