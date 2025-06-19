import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { CounsellorProfileData } from '@/types/user';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CounsellorDashboard() {
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    upcomingSessions: 3,
    totalClients: 12,
    weeklyHours: 25,
    rating: 4.8,
  });

  const counsellorProfile = userProfile as CounsellorProfileData;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  if (!counsellorProfile || counsellorProfile.role !== 'counsellor') {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-foreground">Loading counsellor dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6 py-4">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-2xl font-bold text-foreground">
              Welcome back, Dr. {counsellorProfile.firstName}
            </Text>
            <Text className="text-muted-foreground">
              {counsellorProfile.verificationStatus === 'verified' ? 'Verified Professional' : 'Pending Verification'}
            </Text>
          </View>
          <Button variant="ghost" onPress={handleLogout} className="p-2">
            <Text className="text-primary">Sign Out</Text>
          </Button>
        </View>

        {/* Verification Status */}
        {counsellorProfile.verificationStatus === 'pending' && (
          <Card className="mb-6 border-yellow-500">
            <CardContent className="p-4">
              <View className="flex-row items-center">
                <Text className="text-yellow-600 text-2xl mr-3">⏳</Text>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">Verification Pending</Text>
                  <Text className="text-sm text-muted-foreground">
                    Your credentials are being reviewed. This typically takes 3-5 business days.
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <View className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 items-center">
              <Text className="text-2xl font-bold text-primary">{stats.upcomingSessions}</Text>
              <Text className="text-sm text-muted-foreground">Upcoming Sessions</Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 items-center">
              <Text className="text-2xl font-bold text-primary">{stats.totalClients}</Text>
              <Text className="text-sm text-muted-foreground">Total Clients</Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 items-center">
              <Text className="text-2xl font-bold text-primary">{stats.weeklyHours}</Text>
              <Text className="text-sm text-muted-foreground">Hours This Week</Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 items-center">
              <Text className="text-2xl font-bold text-primary">⭐ {stats.rating}</Text>
              <Text className="text-sm text-muted-foreground">Average Rating</Text>
            </CardContent>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onPress={() => router.push('/chat')}
              className="w-full justify-start"
              variant="outline"
            >
              <Text className="text-foreground">💬 View Messages</Text>
            </Button>
            <Button 
              onPress={() => router.push('/(main)/sessions')}
              className="w-full justify-start"
              variant="outline"
            >
              <Text className="text-foreground">📅 Manage Schedule</Text>
            </Button>
            <Button 
              onPress={() => router.push('/(main)/chat')}
              className="w-full justify-start"
              variant="outline"
            >
              <Text className="text-foreground">👥 Client List</Text>
            </Button>
            <Button 
              onPress={() => router.push('/profile')}
              className="w-full justify-start"
              variant="outline"
            >
              <Text className="text-foreground">⚙️ Profile Settings</Text>
            </Button>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="space-y-3">
              <View className="flex-row justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <View>
                  <Text className="font-medium text-foreground">Session with Alex M.</Text>
                  <Text className="text-sm text-muted-foreground">Anxiety & Stress Management</Text>
                </View>
                <Text className="text-sm text-blue-600 dark:text-blue-400">2:00 PM</Text>
              </View>
              <View className="flex-row justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <View>
                  <Text className="font-medium text-foreground">Session with Sarah K.</Text>
                  <Text className="text-sm text-muted-foreground">Depression Support</Text>
                </View>
                <Text className="text-sm text-green-600 dark:text-green-400">4:00 PM</Text>
              </View>
              <View className="flex-row justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <View>
                  <Text className="font-medium text-foreground">Session with John D.</Text>
                  <Text className="text-sm text-muted-foreground">Relationship Issues</Text>
                </View>
                <Text className="text-sm text-purple-600 dark:text-purple-400">6:00 PM</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Profile Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="space-y-2">
              <Text className="text-foreground">
                <Text className="font-medium">Specializations: </Text>
                {counsellorProfile.specializations?.join(', ') || 'Not specified'}
              </Text>
              <Text className="text-foreground">
                <Text className="font-medium">Experience: </Text>
                {counsellorProfile.yearsExperience} years
              </Text>
              <Text className="text-foreground">
                <Text className="font-medium">License: </Text>
                {counsellorProfile.licenseType}
              </Text>
              <Text className="text-foreground">
                <Text className="font-medium">Rate: </Text>
                ${counsellorProfile.hourlyRate}/hour
              </Text>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
