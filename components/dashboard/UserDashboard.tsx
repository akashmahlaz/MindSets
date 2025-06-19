import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { getCounsellors } from '@/services/userService';
import { CounsellorProfileData, UserProfile, UserProfileData } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UserDashboard() {
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();
  const [counsellors, setCounsellors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userProfileData = userProfile as UserProfileData;
  
  const loadCounsellors = async () => {
    try {
      console.log('🔄 UserDashboard: Loading counsellors...');
      setLoading(true);
      
      const filters = userProfileData?.primaryConcerns ? {
        specializations: userProfileData.primaryConcerns,
      } : undefined;
      
      console.log('🎯 UserDashboard: Using filters:', filters);
      console.log('📋 User primary concerns:', userProfileData?.primaryConcerns);
      
      const data = await getCounsellors(filters);
      console.log('✅ UserDashboard: Received counsellors:', data.length);
      
      if (data.length === 0) {
        console.log('⚠️ No counsellors found. Checking database...');
        // Try without filters to see if there are any counsellors at all
        const allCounsellors = await getCounsellors();
        console.log('📊 Total counsellors in database:', allCounsellors.length);
      }
      
      setCounsellors(data);
    } catch (error) {
      console.error('❌ Error loading counsellors:', error);
      Alert.alert(
        'Error Loading Counsellors',
        'Unable to load counsellors. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCounsellors();
  }, []);
  // Debug function to test database connection
  const debugDatabase = async () => {
    try {
      console.log('🔧 Debug: Testing database connection...');
      const { debugUsersCollection } = await import('@/services/userService');
      await debugUsersCollection();
    } catch (error) {
      console.error('🚨 Debug error:', error);
    }
  };
  // Create test counsellors for testing
  const createTestCounsellors = async () => {
    try {
      console.log('👨‍⚕️ Creating test counsellors...');
      const { createTestCounsellor } = await import('@/services/userService');
      
      // Create diverse test counsellors
      await createTestCounsellor('Sarah Johnson', 'sarah.johnson@mindconnect.com', ['Anxiety', 'Depression']);
      await createTestCounsellor('Mike Chen', 'mike.chen@mindconnect.com', ['Stress Management', 'Career Counseling']);
      await createTestCounsellor('Emma Williams', 'emma.williams@mindconnect.com', ['Relationship Issues', 'Family Therapy']);
      await createTestCounsellor('David Rodriguez', 'david.rodriguez@mindconnect.com', ['Trauma Therapy', 'PTSD']);
      await createTestCounsellor('Lisa Thompson', 'lisa.thompson@mindconnect.com', ['Teen Counseling', 'Academic Stress']);
      await createTestCounsellor('James Park', 'james.park@mindconnect.com', ['Addiction Recovery', 'Life Coaching']);
      
      Alert.alert('Success', '6 test counsellors created! Pull down to refresh and see them.');
      // Auto refresh after creating
      setTimeout(() => {
        loadCounsellors();
      }, 1000);
    } catch (error) {
      console.error('❌ Error creating test counsellors:', error);
      Alert.alert('Error', 'Failed to create test counsellors');
    }
  };

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
      pathname: '/profile/[userId]',
      params: { userId: counsellor.uid }
    });
  };

  const handleStartVideoCall = (counsellor: CounsellorProfileData) => {
    // Navigate to profile first, then user can initiate call from there
    router.push({
      pathname: '/profile/[userId]',
      params: { userId: counsellor.uid }
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };
  const filteredCounsellors = counsellors.filter(counsellor =>
    counsellor.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ('specializations' in counsellor && 
     counsellor.specializations?.some(spec => 
       spec.toLowerCase().includes(searchQuery.toLowerCase())
     ))
  );

  console.log('UserDashboard render: counsellors.length =', counsellors.length);
  console.log('UserDashboard render: filteredCounsellors.length =', filteredCounsellors.length);
  console.log('UserDashboard render: loading =', loading);

  if (!userProfileData || userProfileData.role !== 'user') {
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
      <ScrollView 
        className="flex-1 px-6 py-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-2xl font-bold text-foreground">
              Welcome back, {userProfileData.firstName}
            </Text>
            <Text className="text-muted-foreground">How are you feeling today?</Text>
          </View>          <Pressable 
            onPress={() => router.push('/(main)/profile')}
            className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
          >
            <Text className="text-primary text-sm">⚙️</Text>
          </Pressable>
        </View>        {/* Search Bar */}
        <View className="mb-6">
          <Input
            placeholder="Search for counselors"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="bg-card"
          />
          {/* Debug buttons */}
          <View className="flex-row space-x-2 mt-2">
            <Button onPress={loadCounsellors} className="flex-1" variant="outline">
              <Text>Reload</Text>
            </Button>
            <Button onPress={debugDatabase} className="flex-1" variant="outline">
              <Text>Debug</Text>
            </Button>
            <Button onPress={createTestCounsellors} className="flex-1" variant="outline">
              <Text>Add Test</Text>
            </Button>
          </View>
        </View>        {/* Browse Counsellors */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-foreground">Browse Counselors</Text>
            {filteredCounsellors.length > 0 && (
              <Pressable onPress={() => console.log('Navigate to all counsellors')}>
                <Text className="text-primary text-sm font-medium">See All ({filteredCounsellors.length})</Text>
              </Pressable>
            )}
          </View>
          
          {loading ? (
            // Loading skeleton for counsellors
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              className="mb-6"
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              <View className="flex-row space-x-4">
                {[...Array(4)].map((_, index) => (
                  <Card key={index} className="w-36 bg-card shadow-sm border border-border">
                    <CardContent className="p-4">
                      {/* Skeleton Profile Image */}
                      <View className="items-center mb-3">
                        <View className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </View>
                      {/* Skeleton Text */}
                      <View className="items-center mb-3 min-h-[60px] justify-center">
                        <View className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                        <View className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                        <View className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </View>
                      {/* Skeleton Buttons */}
                      <View className="flex-row space-x-1">
                        <View className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <View className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </View>
                    </CardContent>
                  </Card>
                ))}
              </View>
            </ScrollView>
          ) : filteredCounsellors.length === 0 ? (
            <Card className="p-6">
              <View className="items-center">
                <Text className="text-lg font-semibold text-foreground mb-2">
                  No counsellors found
                </Text>
                <Text className="text-muted-foreground text-center mb-4">
                  {counsellors.length === 0 
                    ? "There are no counsellors in the database yet. Try creating some test counsellors."
                    : "Try adjusting your search or clearing filters."
                  }
                </Text>
                <Text className="text-sm text-muted-foreground text-center">
                  Total counsellors in database: {counsellors.length}
                </Text>
              </View>
            </Card>          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              className="mb-6"
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              <View className="flex-row space-x-4">
                {filteredCounsellors.map((counsellor) => {
                  const counsellorData = counsellor as CounsellorProfileData;
                  return (
                    <Pressable
                      key={counsellor.uid}
                      onPress={() => handleCounsellorPress(counsellorData)}
                      className="active:opacity-80"
                    >
                      <Card className="w-36 bg-card shadow-sm border border-border">
                        <CardContent className="p-4">
                          {/* Profile Image */}
                          <View className="items-center mb-3">
                            <View className="relative">
                              <View className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 items-center justify-center overflow-hidden border-2 border-white dark:border-gray-700 shadow-md">
                                {counsellor.photoURL ? (
                                  <Image
                                    source={{ uri: counsellor.photoURL }}
                                    className="w-full h-full rounded-full"
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <Text className="text-2xl">👨‍⚕️</Text>
                                )}
                              </View>
                              {/* Online status indicator */}
                              <View className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-700 ${
                                counsellor.status === 'online' ? 'bg-green-500' : 
                                counsellor.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                              }`} />
                            </View>
                          </View>

                          {/* Counsellor Info */}
                          <View className="items-center mb-3 min-h-[60px] justify-center">
                            <Text 
                              className="font-semibold text-foreground text-center text-sm leading-tight mb-1" 
                              numberOfLines={2}
                            >
                              {counsellor.displayName}
                            </Text>
                            <Text 
                              className="text-xs text-muted-foreground text-center leading-tight" 
                              numberOfLines={2}
                            >
                              {counsellorData.specializations?.slice(0, 2).join(', ') || 'General Counseling'}
                            </Text>
                            {counsellorData.yearsExperience && (
                              <Text className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {counsellorData.yearsExperience} years exp.
                              </Text>
                            )}
                          </View>
                          
                          {/* Action buttons */}
                          <View className="flex-row space-x-1">
                            <Button 
                              onPress={() => handleStartChat(counsellorData)}
                              className="flex-1 h-8 bg-blue-500 hover:bg-blue-600"
                              size="sm"
                            >
                              <Ionicons name="chatbubble" size={12} color="white" />
                            </Button>
                            <Button 
                              onPress={() => handleStartVideoCall(counsellorData)}
                              className="flex-1 h-8 bg-green-500 hover:bg-green-600"
                              size="sm"
                            >
                              <Ionicons name="videocam" size={12} color="white" />
                            </Button>
                          </View>

                          {/* Rating or availability indicator */}
                          <View className="items-center mt-2">
                            <View className="flex-row items-center">
                              <View className={`w-2 h-2 rounded-full mr-1 ${
                                counsellorData.acceptsNewClients ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <Text className="text-xs text-muted-foreground">
                                {counsellorData.acceptsNewClients ? 'Available' : 'Busy'}
                              </Text>
                            </View>
                          </View>
                        </CardContent>
                      </Card>
                    </Pressable>
                  );
                })}
                
                {/* Show more button if there are more counsellors */}
                {filteredCounsellors.length > 5 && (
                  <Pressable className="active:opacity-80">
                    <Card className="w-36 bg-card shadow-sm border border-dashed border-border">
                      <CardContent className="p-4 h-full justify-center items-center">
                        <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-2">
                          <Ionicons name="add" size={24} color="#6B7280" />
                        </View>
                        <Text className="text-sm text-muted-foreground text-center">
                          View All ({filteredCounsellors.length})
                        </Text>
                      </CardContent>
                    </Card>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row space-x-3">
              <Button 
                onPress={() => router.push('/chat')}
                className="flex-1 bg-green-500"
              >
                <Text className="text-white font-medium">Chat/Call</Text>
              </Button>
              <Button 
                onPress={() => router.push('/(main)/profile')}
                className="flex-1"
                variant="outline"
              >
                <Text className="text-foreground font-medium">Book Session</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* Resources */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-foreground mb-4">Resources</Text>
          
          <View className="space-y-4">
            <Card className="bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">Self-Help</Text>
                    <Text className="text-lg font-bold text-foreground">Managing Stress</Text>
                    <Text className="text-sm text-muted-foreground">
                      Learn techniques to cope with daily stress
                    </Text>
                  </View>
                  <View className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-lg items-center justify-center">
                    <Text className="text-2xl">🧘</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="bg-pink-50 dark:bg-pink-900/20">
              <CardContent className="p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">Mood Tracker</Text>
                    <Text className="text-lg font-bold text-foreground">Track Your Mood</Text>
                    <Text className="text-sm text-muted-foreground">
                      Monitor your emotional well-being over time
                    </Text>
                  </View>
                  <View className="w-16 h-16 bg-pink-100 dark:bg-pink-800 rounded-lg items-center justify-center">
                    <Text className="text-2xl">📊</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
