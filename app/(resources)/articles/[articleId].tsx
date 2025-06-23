import { useAuth } from "@/context/AuthContext";
import {
  Article,
  deleteArticle,
  getArticle,
  incrementArticleViews,
} from "@/services/articleService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ArticleDetail() {
  const router = useRouter();
  const { articleId } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 py-4 border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-card"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {/* Loading skeleton */}
          <View className="mb-6">
            <View className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />
            <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
            <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          </View>

          <View className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6 animate-pulse" />

          {Array.from({ length: 8 }).map((_, index) => (
            <View key={index} className="mb-2">
              <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
          <Text className="text-xl font-semibold text-foreground mt-4 mb-2">
            Article not found
          </Text>
          <Text className="text-muted-foreground text-center mb-6">
            The article you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 border-b border-border bg-card">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-background"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <View className="flex-row items-center space-x-2">
            {isAuthor && (
              <>
                <TouchableOpacity
                  onPress={handleEdit}
                  className="w-10 h-10 items-center justify-center rounded-full bg-background"
                >
                  <Ionicons name="create-outline" size={24} color="#000" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDelete}
                  className="w-10 h-10 items-center justify-center rounded-full bg-background"
                >
                  <Ionicons name="trash-outline" size={24} color="#DC2626" />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={handleShare}
              className="w-10 h-10 items-center justify-center rounded-full bg-background"
            >
              <Ionicons name="share-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Article Header */}
        <View className="px-6 py-6">
          {/* Category & Featured Badge */}
          <View className="flex-row items-center mb-4">
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary text-sm font-medium">
                {article.category}
              </Text>
            </View>
            {article.isFeatured && (
              <View className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full ml-2">
                <Text className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
                  Featured
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-foreground mb-4 leading-tight">
            {article.title}
          </Text>

          {/* Description */}
          <Text className="text-lg text-muted-foreground mb-6 leading-relaxed">
            {article.description}
          </Text>

          {/* Article Meta */}
          <View className="flex-row items-center justify-between mb-6 p-4 bg-card border border-border rounded-xl">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-3">
                {article.authorPhotoURL ? (
                  <Image
                    source={{ uri: article.authorPhotoURL }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Text className="text-lg">👤</Text>
                  </View>
                )}
              </View>
              <View>
                <Text className="text-foreground font-semibold">
                  {article.authorName}
                </Text>
                <Text className="text-muted-foreground text-sm">
                  {article.createdAt?.toDate?.()?.toLocaleDateString() ||
                    "Recently published"}
                </Text>
              </View>
            </View>

            <View className="items-end">
              <View className="flex-row items-center mb-1">
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text className="text-muted-foreground text-sm ml-1">
                  {article.readTime} min read
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="eye-outline" size={16} color="#6B7280" />
                <Text className="text-muted-foreground text-sm ml-1">
                  {article.viewCount} views
                </Text>
              </View>
            </View>
          </View>

          {/* Featured Image */}
          {article.imageUrl && (
            <View className="mb-6">
              <Image
                source={{ uri: article.imageUrl }}
                className="w-full h-48 rounded-xl"
                resizeMode="cover"
              />
            </View>
          )}
        </View>

        {/* Article Content */}
        <View className="px-6 pb-8">
          <View className="bg-card border border-border rounded-xl p-6">
            <Text className="text-base text-foreground leading-relaxed">
              {article.content}
            </Text>
          </View>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <View className="mt-6">
              <Text className="text-sm font-semibold text-foreground mb-3">
                Tags
              </Text>
              <View className="flex-row flex-wrap">
                {article.tags.map((tag, index) => (
                  <View
                    key={index}
                    className="bg-secondary/50 px-3 py-1 rounded-full mr-2 mb-2"
                  >
                    <Text className="text-secondary-foreground text-sm">
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
