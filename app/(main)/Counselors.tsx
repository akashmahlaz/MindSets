import "@/app/global.css";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/lib/useColorScheme';
import { getCounsellors } from '@/services/userService';
import { CounsellorProfileData, UserProfile, UserProfileData } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CounselorsScreen() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [counsellors, setCounsellors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userProfileData = userProfile as UserProfileData;

  const loadCounsellors = async () => {
    try {
      const filters = userProfileData?.primaryConcerns ? {
        specializations: userProfileData.primaryConcerns,
      } : undefined;

      const data = await getCounsellors(filters);
      setCounsellors(data);
    } catch (error) {
      console.error('Error loading counsellors:', error);
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
      pathname: '/profile/[userId]',
      params: { userId: counsellor.uid }
    });
  };

  const handleStartChat = (counsellor: CounsellorProfileData) => {
    router.push({
      pathname: '/users/chat',
      params: { userId: counsellor.uid }
    });
  };

  const filteredCounsellors = counsellors.filter(counsellor =>
    counsellor.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ('specializations' in counsellor &&
      counsellor.specializations?.some(spec =>
        spec.toLowerCase().includes(searchQuery.toLowerCase())
      ))
  );

  const renderCounsellorCard = (counsellor: CounsellorProfileData) => {
    return (
      <Pressable
        key={counsellor.uid}
        onPress={() => handleCounsellorPress(counsellor)}
        className="bg-white dark:bg-card rounded-2xl mr-4 shadow-lg border border-gray-100 dark:border-border active:opacity-95"
        style={{ width: 220, elevation: 6 }}
      >
        {/* Card Content */}
        <View className="overflow-hidden rounded-2xl">
          {/* Profile Image - Smaller but still prominent */}
          <View className="relative">
            <View className="w-full h-44 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
              {counsellor.photoURL ? (
                <Image
                  source={{ uri: counsellor.photoURL }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-800/30 dark:to-indigo-800/30">
                  <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
                    <Text className="text-4xl">👨‍⚕️</Text>
                  </View>
                </View>
              )}
            </View>
            {/* Professional badge/status */}
            <View className={`absolute top-3 right-3 px-2 py-1 rounded-full shadow-md ${counsellor.status === 'online' ? 'bg-green-500' :
              counsellor.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
              }`}>
              <Text className="text-white text-xs font-medium">
                {counsellor.status === 'online' ? 'Available' :
                  counsellor.status === 'away' ? 'Away' : 'Offline'}
              </Text>
            </View>
          </View>
          {/* Professional Info - Compact but readable */}
          <View className="p-4">
            <View className="items-center mb-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-foreground text-center mb-1" numberOfLines={1}>
                {counsellor.displayName}
              </Text>
              <Text className="text-xs text-gray-600 dark:text-muted-foreground text-center leading-relaxed mb-2" numberOfLines={2}>
                {counsellor.specializations?.slice(0, 1).map(spec =>
                  spec === 'anxiety' ? 'Specializes in anxiety' :
                    spec === 'depression' ? 'Focuses on depression' :
                      spec === 'stress-management' ? 'Expert in stress issues' :
                        spec === 'relationship-issues' ? 'Relationship counseling' :
                          spec === 'trauma-therapy' ? 'Trauma specialist' :
                            `Specializes in ${spec.replace('-', ' ')}`
                )[0] || 'General counseling specialist'}
              </Text>
              {/* Professional credentials - More compact */}
              <View className="flex-row items-center space-x-3 mb-3">
                {counsellor.yearsExperience && (
                  <View className="flex-row items-center">
                    <Ionicons name="school-outline" size={12} color="#6B7280" />
                    <Text className="text-xs text-gray-500 dark:text-muted-foreground ml-1">
                      {counsellor.yearsExperience}y
                    </Text>
                  </View>
                )}
                {counsellor.averageRating && (
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={12} color="#FCD34D" />
                    <Text className="text-xs text-gray-500 dark:text-muted-foreground ml-1">
                      {counsellor.averageRating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            {/* Action Buttons - More compact */}

          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? '#0f172a' : '#ffffff'}
      />

      {/* Header */}
      <View className="px-6 py-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Browse Counselors</Text>
        <Text className="text-muted-foreground">Find the right mental health professional</Text>
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
          <View className="py-4">
            <Input
              placeholder="Search counselors by name or specialization..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-card"
            />
          </View>

          {/* Filter Info */}
          {userProfileData?.primaryConcerns?.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Recommended based on your concerns:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {userProfileData.primaryConcerns.slice(0, 3).map((concern) => (
                  <View key={concern} className="px-2 py-1 bg-primary/10 rounded-full">
                    <Text className="text-primary text-xs">
                      {concern.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Counsellors Section */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-foreground">Browse Counselors</Text>
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
                  {[...Array(3)].map((_, index) => (<View
                    key={index}
                    className="bg-card rounded-2xl mr-4 border border-border overflow-hidden"
                    style={{ width: 220 }}
                  >
                    {/* Skeleton Image */}
                    <View className="w-full h-44 bg-gray-200 dark:bg-gray-700 animate-pulse" />

                    {/* Skeleton Content */}
                    <View className="p-4">
                      <View className="items-center space-y-1 mb-3">
                        <View className="w-28 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <View className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <View className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </View>
                      <View className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
                    renderCounsellorCard(counsellor as CounsellorProfileData)
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
