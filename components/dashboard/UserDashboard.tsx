import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
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
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserDashboard() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [counsellors, setCounsellors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);

  const userProfileData = userProfile as UserProfileData;

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
      console.log("Loading featured articles...");
      const articles = await getFeaturedArticles();
      console.log("Loaded articles:", articles.length, articles);
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
    loadFeaturedArticles(); // Also refresh articles
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
  const renderCounsellorCard = (counsellor: CounsellorProfileData) => {
    return (
      <Pressable
        key={counsellor.uid}
        onPress={() => handleCounsellorPress(counsellor)}
        className="mr-4 active:opacity-95"
        style={{ width: 280 }}
      >
        <View className="bg-card border border-border rounded-xl p-4 shadow-sm">
          {/* Profile Section */}
          <View className="flex-row items-center mb-3">
            <View className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-3">
              {counsellor.photoURL ? (
                <Image
                  source={{ uri: counsellor.photoURL }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-primary/10">
                  <Text className="text-xl">👨‍⚕️</Text>
                </View>
              )}
            </View>

            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text
                  className="text-sm font-semibold text-foreground flex-1"
                  numberOfLines={1}
                >
                  Dr. {counsellor.displayName}
                </Text>
                {/* Verification Badge */}
                <View className="ml-1 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="checkmark-circle"
                      size={10}
                      color="#3B82F6"
                    />
                    <Text className="text-blue-600 dark:text-blue-400 text-xs ml-0.5 font-medium">
                      Verified
                    </Text>
                  </View>
                </View>
              </View>
              
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-muted-foreground">
                  {counsellor.yearsExperience || "5+"} years exp.
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="star" size={10} color="#F59E0B" />
                  <Text className="text-xs text-muted-foreground ml-1">
                    4.8 (120)
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Specialization */}
          <View className="mb-3">
            <Text className="text-sm text-foreground font-medium mb-1">
              {counsellor.specializations?.[0] === "anxiety" &&
                "Anxiety Specialist"}
              {counsellor.specializations?.[0] === "depression" &&
                "Depression Therapy"}
              {counsellor.specializations?.[0] === "relationship" &&
                "Relationship Counseling"}
              {counsellor.specializations?.[0] === "trauma" && "Trauma Therapy"}
              {counsellor.specializations?.[0] === "stress-management" &&
                "Stress Management"}
              {!counsellor.specializations?.[0] && "General Counseling"}
              {counsellor.specializations?.[0] &&
                ![
                  "anxiety",
                  "depression",
                  "relationship",
                  "trauma",
                  "stress-management",
                ].includes(counsellor.specializations[0]) &&
                counsellor.specializations[0]
                  .replace("-", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
            </Text>

            {counsellor.specializations &&
              counsellor.specializations.length > 1 && (
                <Text className="text-xs text-muted-foreground">
                  +{counsellor.specializations.length - 1} more specializations
                </Text>
              )}
          </View>
          
          {/* Rate and Status */}
          <View className="flex-row justify-between items-center pt-2 border-t border-border">
            <View>
              <Text className="text-sm font-semibold text-primary">
                ${counsellor.hourlyRate || "80"}/session
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
              <Text className="text-xs text-muted-foreground">
                Available
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  if (!userProfileData || userProfileData.role !== "user") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-foreground">Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6">
          {/* Header */}
          <View className="py-4 border-b border-border">
            <Text className="text-2xl font-bold text-foreground">
              Hi,
              {userProfileData?.firstName ||
                userProfileData?.displayName ||
                "there"}
              ! 👋
            </Text>
            <Text className="text-muted-foreground">
              Connect with the right mental health professional
            </Text>
          </View>
          {/* Search */}
          <View className="py-4">
            <Input
              placeholder="Search counselors by name or specialization..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-card"
            />
          </View>
          {/* Recommended based on concerns */}
          {userProfileData?.primaryConcerns?.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Recommended based on your concerns:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {userProfileData.primaryConcerns.slice(0, 3).map((concern) => (
                  <View
                    key={concern}
                    className="px-2 py-1 bg-primary/10 rounded-full"
                  >
                    <Text className="text-primary text-xs">
                      {concern
                        .replace("-", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {/* Counsellors Section */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-foreground">
                Available Counselors
              </Text>
              {filteredCounsellors.length > 0 && (
                <Pressable>
                  <Text className="text-primary text-sm font-medium">
                    See All ({filteredCounsellors.length})
                  </Text>
                </Pressable>
              )}
            </View>
            {loading ? (
              /* Loading Skeleton */
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 4 }}
              >
                <View className="flex-row">
                  {[...Array(3)].map((_, index) => (
                    <View key={index} className="mr-4" style={{ width: 180 }}>
                      {/* Skeleton Image */}
                      <View className="w-full h-48 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse mb-3" />

                      {/* Skeleton Content */}
                      <View>
                        <View className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                        <View className="w-28 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : filteredCounsellors.length === 0 ? (
              <View className="py-12 items-center">
                <Ionicons name="people-outline" size={64} color="#9CA3AF" />
                <Text className="text-muted-foreground mt-4 text-center text-lg">
                  No counselors found
                </Text>
                <Text className="text-sm text-muted-foreground text-center mt-1">
                  Try adjusting your search or pull to refresh
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 4 }}
              >
                <View className="flex-row">
                  {filteredCounsellors.map((counsellor) =>
                    renderCounsellorCard(counsellor as CounsellorProfileData),
                  )}
                </View>
              </ScrollView>
            )}
            <Text className="text-muted-foreground text-center text-sm mb-4">
              Swipe left or right to navigate through counselors
            </Text>
          </View>
          {/* Quick Actions */}
          <View className="px-6 py-6 border-t border-border mt-6">
            <Text className="text-xl font-bold text-foreground mb-4">
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <TouchableOpacity
                className="flex-1 min-w-[140px] bg-primary/10 border border-primary/20 rounded-xl p-4 flex-row items-center"
                onPress={() => router.push("/(main)/sessions")}
              >
                <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mr-3">
                  <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold text-sm">
                    Schedule
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    Book session
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 min-w-[140px] bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex-row items-center"
                onPress={() => router.push("/chat")}
              >
                <View className="w-10 h-10 bg-green-100 dark:bg-green-800/30 rounded-full items-center justify-center mr-3">
                  <Ionicons
                    name="chatbubbles-outline"
                    size={20}
                    color="#22C55E"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold text-sm">
                    Messages
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    View chats
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          {/* Articles Section */}
          <View className="px-6 py-6 border-t border-border">
            <TouchableOpacity>
              
            </TouchableOpacity>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-foreground">
                Featured Articles
              </Text>
              <Pressable onPress={() => router.push("/articles" as any)}>
                <Text className="text-black dark:text-blue-400 text-sm font-medium">
                  See All
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              <View className="flex-row">
                {articlesLoading ? (
                  // Loading state
                  Array.from({ length: 2 }).map((_, index) => (
                    <View key={index} className="mr-4" style={{ width: 280 }}>
                      <View className="bg-card border border-border rounded-xl overflow-hidden">
                        <View className="w-full h-32 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        <View className="p-4">
                          <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                          <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse" />
                          <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                        </View>
                      </View>
                    </View>
                  ))
                ) : featuredArticles.length > 0 ? (
                  featuredArticles.map((article, index) => (
                    <Pressable
                      key={article.id}
                      className="mr-4"
                      style={{ width: 280 }}
                      onPress={() =>
                        router.push({
                          pathname: "/articles/[articleId]" as any,
                          params: { articleId: article.id },
                        })
                      }
                    >
                      <View className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        {/* Article Content - Horizontal Layout */}
                        <View className="flex-row p-4">
                          {/* Left side - Text content */}
                          <View className="flex-1 pr-3">
                            <Text
                              className="text-sm font-semibold text-foreground mb-2"
                              numberOfLines={2}
                            >
                              {article.title}
                            </Text>
                            <Text
                              className="text-xs text-muted-foreground mb-3"
                              numberOfLines={2}
                            >
                              {article.description ||
                                article.content?.substring(0, 80) + "..."}
                            </Text>
                            <View className="flex-row items-center justify-between">
                              <Text className="text-xs text-muted-foreground">
                                {article.readTime || 5} min read
                              </Text>
                              <Text className="text-xs text-primary font-medium">
                                {article.category || "Health"}
                              </Text>
                            </View>
                          </View>
                          
                          {/* Right side - Image */}
                          <View className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                            {article.imageUrl ? (
                              <Image
                                source={{ uri: article.imageUrl }}
                                className="w-full h-full"
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                className={`w-full h-full ${index % 2 === 0 ? "bg-blue-100 dark:bg-blue-900/30" : "bg-green-100 dark:bg-green-900/30"} items-center justify-center`}
                              >
                                <Ionicons
                                  name={
                                    index % 2 === 0
                                      ? "library-outline"
                                      : "heart-outline"
                                  }
                                  size={20}
                                  color={index % 2 === 0 ? "#3B82F6" : "#22C55E"}
                                />
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  // Empty state
                  <View className="flex-1 items-center justify-center py-8">
                    <Ionicons
                      name="document-text-outline"
                      size={48}
                      color="#9CA3AF"
                    />
                    <Text className="text-muted-foreground text-center mt-2">
                      No articles available at the moment
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
          {/* Resources Section */}
          <View className="px-6 py-6 border-t border-border">
            <Text className="text-xl font-bold text-foreground mb-4">
              Resources
            </Text>
            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => router.push("/(main)")}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex-row items-center"
              >
                <View className="w-10 h-10 bg-blue-100 dark:bg-blue-800/30 rounded-full items-center justify-center mr-3">
                  <Ionicons name="book-outline" size={20} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">
                    Mental Health Resources
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    Guides, tips, and educational content
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(main)")}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex-row items-center"
              >
                <View className="w-10 h-10 bg-green-100 dark:bg-green-800/30 rounded-full items-center justify-center mr-3">
                  <Ionicons
                    name="help-circle-outline"
                    size={20}
                    color="#22C55E"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">
                    Frequently Asked Questions
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    Quick answers to common questions
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
