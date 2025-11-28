import { useAuth } from "@/context/AuthContext";
import {
    Article,
    deleteArticle,
    getArticle,
    incrementArticleViews,
} from "@/services/articleService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    Share,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import Animated, {
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
  danger: "#EF4444",
  dangerSoft: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)",
});

export default function ArticleDetail() {
  const router = useRouter();
  const { articleId } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 200], [0, 1], "clamp");
    return { opacity };
  });

  useEffect(() => {
    if (articleId && typeof articleId === "string") {
      loadArticle(articleId);
    }
  }, [articleId]);
  const loadArticle = async (id: string) => {
    try {
      setLoading(true);
      const articleData = await getArticle(id);
      setArticle(articleData);

      // Increment view count (non-blocking)
      if (articleData) {
        incrementArticleViews(id);
      }
    } catch (error) {
      console.error("Failed to load article:", error);
      Alert.alert("Error", "Failed to load article");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!article) return;

    try {
      await Share.share({
        message: `Check out this article: ${article.title}`,
        title: article.title,
      });
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const handleDelete = () => {
    if (!article || !userProfile) return;

    Alert.alert(
      "Delete Article",
      "Are you sure you want to delete this article? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteArticle(article.id);
              Alert.alert("Success", "Article deleted successfully");
              router.back();
            } catch (error) {
              console.error("Failed to delete article:", error);
              Alert.alert("Error", "Failed to delete article");
            }
          },
        },
      ],
    );
  };
  const handleEdit = () => {
    if (!article) return;
    router.push({
      pathname: "/(resources)/articles/edit/[articleId]",
      params: { articleId: article.id },
    });
  };

  const isAuthor = userProfile?.uid === article?.authorId;

  // Perplexity-style Loading Screen
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}>
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
          </View>

          {/* Skeleton */}
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Category */}
            <View style={{ flexDirection: "row", marginBottom: 16 }}>
              <View style={{ width: 80, height: 24, borderRadius: 12, backgroundColor: colors.surface }} />
              <View style={{ width: 60, height: 24, borderRadius: 12, backgroundColor: colors.surface, marginLeft: 8 }} />
            </View>

            {/* Title */}
            <View style={{ height: 32, borderRadius: 8, backgroundColor: colors.surface, marginBottom: 8 }} />
            <View style={{ height: 32, borderRadius: 8, backgroundColor: colors.surface, width: "70%", marginBottom: 24 }} />

            {/* Meta */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface }} />
              <View style={{ marginLeft: 12 }}>
                <View style={{ width: 100, height: 16, borderRadius: 8, backgroundColor: colors.surface, marginBottom: 4 }} />
                <View style={{ width: 80, height: 12, borderRadius: 6, backgroundColor: colors.surface }} />
              </View>
            </View>

            {/* Image */}
            <View style={{ height: 220, borderRadius: 16, backgroundColor: colors.surface, marginBottom: 32 }} />

            {/* Content lines */}
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={i} style={{
                height: 16,
                borderRadius: 8,
                backgroundColor: colors.surface,
                marginBottom: 12,
                width: i % 3 === 0 ? "100%" : i % 2 === 0 ? "85%" : "95%",
              }} />
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // Not Found State
  if (!article) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}>
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
          </View>

          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.surface,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}>
              <Ionicons name="newspaper-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={{
              fontSize: 22,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 8,
              textAlign: "center",
            }}>
              Article not found
            </Text>
            <Text style={{
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 32,
            }}>
              This article doesn't exist or has been removed.
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 28,
                paddingVertical: 14,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 15 }}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Floating Header (appears on scroll) */}
      <Animated.View style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: colors.background,
          paddingTop: insets.top,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        },
        headerAnimatedStyle,
      ]}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: colors.surface,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={{
            flex: 1,
            fontSize: 15,
            fontWeight: "600",
            color: colors.text,
            marginHorizontal: 12,
          }} numberOfLines={1}>
            {article.title}
          </Text>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Initial Header */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}>
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

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {isAuthor && (
              <>
                <TouchableOpacity
                  onPress={handleEdit}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: colors.surface,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="create-outline" size={18} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDelete}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: colors.dangerSoft,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={handleShare}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.surface,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="share-outline" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Article Content */}
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* Article Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            {/* Category & Meta */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
              <View style={{
                backgroundColor: colors.primarySoft,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
              }}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
                  {article.category}
                </Text>
              </View>
              {article.isFeatured && (
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "rgba(251, 191, 36, 0.15)" : "rgba(251, 191, 36, 0.1)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  marginLeft: 8,
                }}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={{ color: "#F59E0B", fontSize: 13, fontWeight: "600", marginLeft: 4 }}>
                    Featured
                  </Text>
                </View>
              )}
            </View>

            {/* Title - Large, Bold, Readable */}
            <Text style={{
              fontSize: 28,
              fontWeight: "700",
              color: colors.text,
              lineHeight: 36,
              letterSpacing: -0.5,
              marginBottom: 16,
            }}>
              {article.title}
            </Text>

            {/* Description/Subtitle */}
            <Text style={{
              fontSize: 18,
              color: colors.textSecondary,
              lineHeight: 26,
              marginBottom: 24,
            }}>
              {article.description}
            </Text>

            {/* Author & Meta Row */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 16,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.borderSubtle,
              marginBottom: 24,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  overflow: "hidden",
                  backgroundColor: colors.surface,
                }}>
                  {article.authorPhotoURL ? (
                    <Image
                      source={{ uri: article.authorPhotoURL }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <LinearGradient
                      colors={[colors.primary, colors.accent]}
                      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                    >
                      <Text style={{ fontSize: 18, fontWeight: "600", color: "#FFF" }}>
                        {article.authorName?.charAt(0)?.toUpperCase() || "A"}
                      </Text>
                    </LinearGradient>
                  )}
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                    {article.authorName}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>
                    {article.createdAt?.toDate?.()?.toLocaleDateString("en-US", { 
                      month: "long", 
                      day: "numeric", 
                      year: "numeric" 
                    }) || "Recently"}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginLeft: 4 }}>
                    {article.readTime} min read
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginLeft: 4 }}>
                    {article.viewCount} views
                  </Text>
                </View>
              </View>
            </View>

            {/* Featured Image */}
            {article.imageUrl && (
              <View style={{
                marginBottom: 32,
                borderRadius: 16,
                overflow: "hidden",
                ...Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 12,
                  },
                  android: { elevation: 4 },
                }),
              }}>
                <Image
                  source={{ uri: article.imageUrl }}
                  style={{ width: "100%", height: 220 }}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>

          {/* Article Content - Clean Typography */}
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{
              fontSize: 17,
              color: colors.text,
              lineHeight: 28,
              letterSpacing: 0.1,
            }}>
              {article.content}
            </Text>
          </View>

          {/* Tags Section */}
          {article.tags && article.tags.length > 0 && (
            <View style={{ paddingHorizontal: 20, marginTop: 40 }}>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}>
                <Ionicons name="pricetags-outline" size={16} color={colors.textMuted} />
                <Text style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.textMuted,
                  marginLeft: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>
                  Tags
                </Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {article.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: colors.surface,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Share CTA */}
          <View style={{ paddingHorizontal: 20, marginTop: 48 }}>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 8,
              }}>
                Enjoyed this article?
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
                marginBottom: 16,
              }}>
                Share it with someone who might benefit
              </Text>
              <TouchableOpacity
                onPress={handleShare}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Ionicons name="share-social-outline" size={18} color="#FFF" />
                <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 15, marginLeft: 8 }}>
                  Share Article
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}
