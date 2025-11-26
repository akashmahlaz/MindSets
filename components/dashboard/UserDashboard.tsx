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
  View
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
        className="active:opacity-95"
      >
        <View className="bg-card rounded-lg p-6 shadow-sm">
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
                  <Ionicons name="medical" size={24} color="#6B7280" />
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
        <View className="px-6 pt-8">
          {/* Header */}
          <View className="mb-16">
            <Text className="text-3xl font-semibold text-foreground mb-2">
              Hi, {userProfileData?.firstName ||
                userProfileData?.displayName ||
                "there"}
            </Text>
          </View>
          {/* Search */}
          <View className="mb-16">
            <Input
              placeholder="Search counselors..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {/* Counsellors Section */}
          <View className="mb-16">
            <Text className="text-2xl font-semibold text-foreground mb-8">
              Available Counselors
            </Text>
            {loading ? (
              /* Loading Skeleton */
              <View className="flex-row flex-wrap gap-4">
                {[...Array(4)].map((_, index) => (
                  <View key={index} className="flex-1 min-w-[160px]">
                    <View className="w-full h-48 rounded-lg bg-muted animate-pulse mb-3" />
                    <View className="w-32 h-6 bg-muted rounded animate-pulse mb-2" />
                    <View className="w-28 h-4 bg-muted rounded animate-pulse" />
                  </View>
                ))}
              </View>
            ) : filteredCounsellors.length === 0 ? (
              <View className="py-16 items-center">
                <Text className="text-muted-foreground text-center text-lg font-semibold mb-2">
                  No counselors found
                </Text>
                <Text className="text-sm text-muted-foreground text-center leading-relaxed">
                  Try adjusting your search
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-4">
                {filteredCounsellors.map((counsellor) => (
                  <View key={counsellor.uid} className="flex-1 min-w-[160px]">
                    {renderCounsellorCard(counsellor as CounsellorProfileData)}
                  </View>
                ))}
              </View>
            )}
          </View>
          {/* Quick Actions */}
          <View className="mb-16">
            <Text className="text-2xl font-semibold text-foreground mb-6">
              Quick Actions
            </Text>
            <View className="space-y-4">
              <Pressable
                onPress={() => router.push("/(main)/sessions")}
                className="py-4"
              >
                <Text className="text-foreground font-semibold text-base">
                  Schedule Session
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/chat")}
                className="py-4"
              >
                <Text className="text-foreground font-semibold text-base">
                  Messages
                </Text>
              </Pressable>
            </View>
          </View>
          {/* Articles Section */}
          <View className="mb-16">
            <Text className="text-2xl font-semibold text-foreground mb-8">
              Featured Articles
            </Text>
            <View className="space-y-6">
              {articlesLoading ? (
                // Loading state
                Array.from({ length: 2 }).map((_, index) => (
                  <View key={index}>
                    <View className="bg-card rounded-lg p-6 shadow-sm">
                      <View className="h-4 bg-muted rounded mb-2 animate-pulse" />
                      <View className="h-3 bg-muted rounded mb-1 animate-pulse" />
                      <View className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                    </View>
                  </View>
                ))
              ) : featuredArticles.length > 0 ? (
                  featuredArticles.map((article) => (
                    <Pressable
                      key={article.id}
                      onPress={() =>
                        router.push({
                          pathname: "/articles/[articleId]" as any,
                          params: { articleId: article.id },
                        })
                      }
                    >
                      <View className="bg-card rounded-lg p-6 shadow-sm">
                        <Text
                          className="text-base font-semibold text-foreground mb-2"
                          numberOfLines={2}
                        >
                          {article.title}
                        </Text>
                        <Text
                          className="text-sm text-muted-foreground mb-4"
                          numberOfLines={2}
                        >
                          {article.description ||
                            article.content?.substring(0, 100) + "..."}
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
                    </Pressable>
                  ))
                ) : (
                  // Empty state
                  <View className="py-8 items-center">
                    <Text className="text-muted-foreground text-center">
                      No articles available
                    </Text>
                  </View>
                )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
