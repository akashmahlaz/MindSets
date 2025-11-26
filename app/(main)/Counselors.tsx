import "@/app/global.css";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CounselorsScreen() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [counsellors, setCounsellors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCounsellors();
  };

  const handleCounsellorPress = (counsellor: CounsellorProfileData) => {
    router.push({
      pathname: "/profile/[userId]",
      params: { userId: counsellor.uid },
    });
  };

  const handleStartChat = (counsellor: CounsellorProfileData) => {
    router.push({
      pathname: "/users/chat",
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
          {/* Profile Image */}
          <View className="w-full h-48 rounded-lg overflow-hidden bg-muted mb-4 relative">
            {counsellor.photoURL ? (
              <Image
                source={{ uri: counsellor.photoURL }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center bg-gray-200 dark:bg-gray-700">
                <Ionicons name="medical" size={48} color="#9CA3AF" />
              </View>
            )}
          </View>
          {/* Info Section */}
          <View>
            <View className="flex-row items-center mb-1">
              <Text
                className="text-lg font-bold text-gray-900 dark:text-white flex-1"
                numberOfLines={1}
              >
                Dr. {counsellor.displayName}
              </Text>
            </View>
            <Text
              className="text-sm text-gray-600 dark:text-gray-400"
              numberOfLines={2}
            >
              {counsellor.specializations?.[0] === "anxiety" &&
                "Specializes in anxiety"}
              {counsellor.specializations?.[0] === "depression" &&
                "Focuses on depression"}
              {counsellor.specializations?.[0] === "relationship" &&
                "Relationship counseling"}
              {counsellor.specializations?.[0] === "trauma" &&
                "Trauma specialist"}
              {counsellor.specializations?.[0] === "stress-management" &&
                "Stress management expert"}
              {!counsellor.specializations?.[0] && "General counseling"}
              {counsellor.specializations?.[0] &&
                ![
                  "anxiety",
                  "depression",
                  "relationship",
                  "trauma",
                  "stress-management",
                ].includes(counsellor.specializations[0]) &&
                `Specializes in ${counsellor.specializations[0].replace("-", " ")}`}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? "#0f172a" : "#ffffff"}
      />

      {/* Header */}
      <View className="px-6 pt-8 pb-6">
        <Text className="text-3xl font-semibold text-foreground mb-2">
          Browse Counselors
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6">
          {/* Search */}
          <View className="mb-8">
            <Input
              placeholder="Search counselors..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Counsellors Section */}
          <View className="mb-16">

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
                      <View className="w-full h-48 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse mb-3" />

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
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
