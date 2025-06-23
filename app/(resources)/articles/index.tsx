import { useAuth } from "@/context/AuthContext";
import {
  Article,
  getAllArticles,
  getUserArticles,
} from "@/services/articleService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ArticlesIndex() {
  const router = useRouter();
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

  const renderArticleCard = (article: Article) => (
    <Pressable
      key={article.id}
      onPress={() => handleArticlePress(article.id)}
      className="mb-4 active:opacity-95"
    >
      <View className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <View className="flex-row">
          {/* Article Image */}
          <View className="w-24 h-24">
            {article.imageUrl ? (
              <Image
                source={{ uri: article.imageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 items-center justify-center">
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color="#6B7280"
                />
              </View>
            )}
          </View>

          {/* Article Content */}
          <View className="flex-1 p-4">
            <View className="flex-row items-start justify-between mb-2">
              <Text
                className="text-base font-semibold text-foreground flex-1 mr-2"
                numberOfLines={2}
              >
                {article.title}
              </Text>
              {article.isFeatured && (
                <View className="bg-primary/10 px-2 py-1 rounded-full">
                  <Text className="text-primary text-xs font-medium">
                    Featured
                  </Text>
                </View>
              )}
            </View>

            <Text
              className="text-sm text-muted-foreground mb-3"
              numberOfLines={2}
            >
              {article.description}
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-xs text-muted-foreground mr-3">
                  {article.readTime} min read
                </Text>
                <Text className="text-xs text-primary font-medium">
                  {article.category}
                </Text>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="eye-outline" size={12} color="#6B7280" />
                <Text className="text-xs text-muted-foreground ml-1">
                  {article.viewCount}
                </Text>
              </View>
            </View>

            {/* Author Info */}
            <View className="flex-row items-center mt-3 pt-3 border-t border-border">
              <View className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-2">
                {article.authorPhotoURL ? (
                  <Image
                    source={{ uri: article.authorPhotoURL }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Text className="text-xs">👤</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs text-muted-foreground">
                {article.authorName}
              </Text>
              <Text className="text-xs text-muted-foreground ml-auto">
                {article.createdAt?.toDate?.()?.toLocaleDateString() ||
                  "Recent"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 border-b border-border bg-card">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-background"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text className="text-xl font-bold text-foreground">Articles</Text>

          <TouchableOpacity
            onPress={() => router.push("/(resources)/articles/create")}
            className="w-10 h-10 items-center justify-center rounded-full bg-primary"
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-background border border-border rounded-lg px-3 py-2 mb-4">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search articles..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-foreground"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-background rounded-lg p-1">
          <TouchableOpacity
            onPress={() => setSelectedTab("all")}
            className={`flex-1 py-2 px-4 rounded-md ${
              selectedTab === "all" ? "bg-primary" : "bg-transparent"
            }`}
          >
            <Text
              className={`text-center font-medium ${
                selectedTab === "all" ? "text-white" : "text-muted-foreground"
              }`}
            >
              All Articles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab("my")}
            className={`flex-1 py-2 px-4 rounded-md ${
              selectedTab === "my" ? "bg-primary" : "bg-transparent"
            }`}
          >
            <Text
              className={`text-center font-medium ${
                selectedTab === "my" ? "text-white" : "text-muted-foreground"
              }`}
            >
              My Articles
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Articles List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          // Loading State
          Array.from({ length: 5 }).map((_, index) => (
            <View key={index} className="mb-4">
              <View className="bg-card border border-border rounded-xl overflow-hidden">
                <View className="flex-row">
                  <View className="w-24 h-24 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <View className="flex-1 p-4">
                    <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                    <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4 animate-pulse" />
                    <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : filteredArticles.length > 0 ? (
          filteredArticles.map(renderArticleCard)
        ) : (
          // Empty State
          <View className="flex-1 items-center justify-center py-16">
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text className="text-xl font-semibold text-foreground mt-4 mb-2">
              {selectedTab === "my" ? "No articles yet" : "No articles found"}
            </Text>
            <Text className="text-muted-foreground text-center mb-6 px-8">
              {selectedTab === "my"
                ? "Start sharing your knowledge by writing your first article!"
                : "Try adjusting your search terms or check back later."}
            </Text>
            {selectedTab === "my" && (
              <TouchableOpacity
                onPress={() => router.push("/articles/create" as any)}
                className="bg-primary px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-medium">Write Article</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button - Only show for counsellors or admins */}
      {(userProfile?.role === "counsellor" ||
        userProfile?.role === "admin") && (
        <TouchableOpacity
          onPress={() => router.push("/articles/create" as any)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
