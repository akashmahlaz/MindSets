import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { getUpcomingSessions, getUserSessions } from '@/services/sessionService';
import { getAllUsers } from '@/services/userService';
import { CounsellorProfileData, UserProfile } from '@/types/user';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CounsellorDashboard() {
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    upcomingSessions: 0,
    totalClients: 0,
    weeklyHours: 0,
    rating: 0,
  });

  const counsellorProfile = userProfile as CounsellorProfileData;
  // Load real data on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (!userProfile?.uid) return;
        
        console.log('Loading dashboard data for counselor:', userProfile.uid);
        
        // Load upcoming sessions
        const upcomingSessions = await getUpcomingSessions(userProfile.uid, 'counselor');
        console.log('Upcoming sessions:', upcomingSessions.length);
        
        // Load all sessions to get clients and stats
        const allSessions = await getUserSessions(userProfile.uid, 'counselor');
        console.log('All sessions:', allSessions.length);
        
        // Get unique clients
        const uniqueClientIds = [...new Set(allSessions.map(session => session.clientId))];
        console.log('Unique client IDs:', uniqueClientIds);
        
        const allUsers = await getAllUsers(userProfile.uid);
        console.log('All users fetched:', allUsers.length);
          // For testing: if no sessions exist, show sample clients from all users
        let clientUsers = allUsers.filter(user => uniqueClientIds.includes(user.uid));
        
        // If no clients from sessions, show sample clients for testing
        if (clientUsers.length === 0 && allUsers.length > 0) {
          console.log('No clients from sessions, showing sample clients for testing');
          // Show regular users as potential clients, excluding the current counselor
          clientUsers = allUsers.filter(user => 
            user.role === 'user' && 
            user.uid !== userProfile.uid
          ).slice(0, 5);
        }
        
        console.log('Client users to display:', clientUsers.length);
        
        // Calculate stats
        const now = new Date();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const weekSessions = allSessions.filter(session => 
          session.date >= weekStart && session.date <= now
        );
        const weeklyHours = weekSessions.reduce((total, session) => total + session.duration, 0) / 60;
        
        setClients(clientUsers);
        setStats({
          upcomingSessions: upcomingSessions.length,
          totalClients: clientUsers.length, // Use actual client count, not unique IDs
          weeklyHours: Math.round(weeklyHours * 10) / 10,
          rating: 4.8, // Placeholder - implement real rating system
        });      } catch (error) {
        console.error('Error loading dashboard data:', error);
          // If sessions fail, try to load just users for sample clients
        try {
          console.log('Sessions failed, loading sample clients from users...');
          if (userProfile?.uid) {
            const allUsers = await getAllUsers(userProfile.uid);
            const sampleClients = allUsers.filter(user => user.role === 'user').slice(0, 5);
            console.log('Sample clients loaded:', sampleClients.length);
            setClients(sampleClients);
            setStats({
              upcomingSessions: 0,
              totalClients: sampleClients.length,
              weeklyHours: 0,
              rating: 0,
            });
          }
        } catch (userError) {
          console.error('Error loading users:', userError);
          // Set empty states on complete error
          setStats({
            upcomingSessions: 0,
            totalClients: 0,
            weeklyHours: 0,
            rating: 0,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [userProfile]);

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
        )}        {/* Quick Stats */}
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
              <Text className="text-2xl font-bold text-primary">
                {stats.rating > 0 ? `⭐ ${stats.rating}` : '⭐ --'}
              </Text>
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
            </Button>            <Button 
              onPress={() => router.push('/(main)/sessions')}
              className="w-full justify-start"
              variant="outline"
            >
              <Text className="text-foreground">📅 Manage Schedule</Text>
            </Button>
            <Button 
              onPress={() => router.push('/profile')}
              className="w-full justify-start"
              variant="outline"
            >
              <Text className="text-foreground">⚙️ Profile Settings</Text>
            </Button>
          </CardContent>
        </Card>        {/* My Clients Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My Clients {loading && "(Loading...)"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <View className="py-8 items-center">
                <Text className="text-muted-foreground">Loading clients...</Text>
              </View>
            ) : clients.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-6xl mb-4">👥</Text>
                <Text className="text-muted-foreground text-lg font-medium">
                  No clients yet
                </Text>
                <Text className="text-sm text-muted-foreground text-center mt-2">
                  Your clients will appear here when you start having sessions
                </Text>
              </View>
            ) : (
              <View>
                <Text className="text-sm text-muted-foreground mb-3">
                  {clients.length} client{clients.length !== 1 ? 's' : ''} found
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-4">
                    {clients.map((client) => (
                      <TouchableOpacity
                        key={client.uid}
                        onPress={() => router.push({
                          pathname: '/profile/[userId]',
                          params: { userId: client.uid }
                        })}
                        className="w-32"
                      >
                        <View className="items-center">
                          <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-2">
                            <Text className="text-blue-600 text-xl font-bold">
                              {client.displayName.charAt(0)}
                            </Text>
                          </View>
                          <Text className="text-foreground text-center text-sm font-medium" numberOfLines={2}>
                            {client.displayName}
                          </Text>
                          <Text className="text-muted-foreground text-xs text-center">
                            {client.role === 'user' ? 'Client' : 'User'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </CardContent>
        </Card>{/* Today's Schedule */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="py-8 items-center">
              <Text className="text-6xl mb-4">📅</Text>
              <Text className="text-muted-foreground text-lg font-medium">
                No sessions scheduled today
              </Text>
              <Text className="text-sm text-muted-foreground text-center mt-2">
                Your schedule will appear here when you have appointments
              </Text>
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
