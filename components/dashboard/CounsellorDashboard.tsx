import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import {
  getUpcomingSessions,
  getUserSessions,
} from "@/services/sessionService";
import { getAllUsers } from "@/services/userService";
import { CounsellorProfileData, UserProfile } from "@/types/user";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

        console.log("Loading dashboard data for counselor:", userProfile.uid);

        // Load upcoming sessions
        const upcomingSessions = await getUpcomingSessions(
          userProfile.uid,
          "counselor",
        );
        console.log("Upcoming sessions:", upcomingSessions.length);

        // Load all sessions to get clients and stats
        const allSessions = await getUserSessions(userProfile.uid, "counselor");
        console.log("All sessions:", allSessions.length);

        // Get unique clients
        const uniqueClientIds = [
          ...new Set(allSessions.map((session) => session.clientId)),
        ];
        console.log("Unique client IDs:", uniqueClientIds);

        const allUsers = await getAllUsers(userProfile.uid);
        console.log("All users fetched:", allUsers.length);
        // For testing: if no sessions exist, show sample clients from all users
        let clientUsers = allUsers.filter((user) =>
          uniqueClientIds.includes(user.uid),
        );

        // If no clients from sessions, show sample clients for testing
        if (clientUsers.length === 0 && allUsers.length > 0) {
          console.log(
            "No clients from sessions, showing sample clients for testing",
          );
          // Show regular users as potential clients, excluding the current counselor
          clientUsers = allUsers
            .filter(
              (user) => user.role === "user" && user.uid !== userProfile.uid,
            )
            .slice(0, 5);
        }

        console.log("Client users to display:", clientUsers.length);

        // Calculate stats
        const now = new Date();
        const weekStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay(),
        );
        const weekSessions = allSessions.filter(
          (session) => session.date >= weekStart && session.date <= now,
        );
        const weeklyHours =
          weekSessions.reduce((total, session) => total + session.duration, 0) /
          60;

        setClients(clientUsers);
        setStats({
          upcomingSessions: upcomingSessions.length,
          totalClients: clientUsers.length, // Use actual client count, not unique IDs
          weeklyHours: Math.round(weeklyHours * 10) / 10,
          rating: 4.8, // Placeholder - implement real rating system
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        // If sessions fail, try to load just users for sample clients
        try {
          console.log("Sessions failed, loading sample clients from users...");
          if (userProfile?.uid) {
            const allUsers = await getAllUsers(userProfile.uid);
            const sampleClients = allUsers
              .filter((user) => user.role === "user")
              .slice(0, 5);
            console.log("Sample clients loaded:", sampleClients.length);
            setClients(sampleClients);
            setStats({
              upcomingSessions: 0,
              totalClients: sampleClients.length,
              weeklyHours: 0,
              rating: 0,
            });
          }
        } catch (userError) {
          console.error("Error loading users:", userError);
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
      Alert.alert("Error", "Failed to sign out");
    }
  };

  if (!counsellorProfile || counsellorProfile.role !== "counsellor") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-foreground">
            Loading counsellor dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Professional Header */}
        <View className="bg-white dark:bg-gray-800 px-6 py-8 border-b border-gray-200 dark:border-gray-700">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center mr-4">
                  <Text className="text-white font-bold text-lg">
                    {counsellorProfile.firstName?.charAt(0)}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center flex-wrap">
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white mr-3">
                      Dr. {counsellorProfile.firstName}
                      {counsellorProfile.lastName}
                    </Text>
                    {counsellorProfile.verificationStatus === "verified" && (
                      <View className="bg-emerald-100 dark:bg-emerald-900 px-3 py-1 rounded-full flex-row items-center">
                        <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                          ✓ Verified Professional
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-600 dark:text-gray-400 mt-1">
                    {counsellorProfile.specializations
                      ?.slice(0, 2)
                      .join(", ") || "Mental Health Professional"}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {counsellorProfile.yearsExperience} years experience • $
                    {counsellorProfile.hourlyRate}/hour
                  </Text>
                </View>
              </View>
            </View>
            <Button variant="outline" onPress={handleLogout} className="ml-4">
              <Text className="text-gray-700 dark:text-gray-300">Sign Out</Text>
            </Button>
          </View>
        </View>
        {/* Professional Status Cards */}
        <View className="px-6 py-4">
          {counsellorProfile.verificationStatus === "pending" && (
            <Card className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
              <CardContent className="p-5">
                <View className="flex-row items-start">
                  <View className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-full items-center justify-center mr-4">
                    <Text className="text-amber-600 dark:text-amber-400 text-lg">
                      ⏳
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-amber-800 dark:text-amber-200 text-lg mb-1">
                      Verification In Progress
                    </Text>
                    <Text className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                      Your credentials are being reviewed by our team. This
                      process typically takes 3-5 business days. You'll receive
                      an email notification once the review is complete.
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          )}

          {counsellorProfile.verificationStatus === "rejected" && (
            <Card className="mb-4 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <CardContent className="p-5">
                <View className="flex-row items-start">
                  <View className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-full items-center justify-center mr-4">
                    <Text className="text-red-600 dark:text-red-400 text-lg">
                      ⚠️
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-red-800 dark:text-red-200 text-lg mb-2">
                      Application Requires Updates
                    </Text>
                    <Text className="text-red-700 dark:text-red-300 text-sm leading-relaxed mb-4">
                      {counsellorProfile.verificationNotes ||
                        "Your application needs some updates to meet our verification requirements. Please review the feedback and resubmit your application."}
                    </Text>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => router.push("/profile/edit")}
                      className="self-start border-red-300 dark:border-red-700"
                    >
                      <Text className="text-red-700 dark:text-red-300">
                        Update Application
                      </Text>
                    </Button>
                  </View>
                </View>
              </CardContent>
            </Card>
          )}

          {counsellorProfile.verificationStatus === "verified" && (
            <Card className="mb-4 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800">
              <CardContent className="p-5">
                <View className="flex-row items-start">
                  <View className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800 rounded-full items-center justify-center mr-4">
                    <Text className="text-emerald-600 dark:text-emerald-400 text-lg">
                      ✅
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-emerald-800 dark:text-emerald-200 text-lg mb-1">
                      Professional Status Verified
                    </Text>
                    <Text className="text-emerald-700 dark:text-emerald-300 text-sm leading-relaxed">
                      Your credentials have been verified and approved. You can
                      now accept new clients and start conducting sessions
                      through our platform.
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          )}
        </View>
        {/* Professional Analytics Dashboard */}
        <View className="px-6">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Dashboard Overview
          </Text>
          <View className="flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2 mb-4">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center">
                      <Text className="text-blue-600 dark:text-blue-400 text-lg">
                        📅
                      </Text>
                    </View>
                    <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.upcomingSessions}
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-gray-900 dark:text-white">
                    Upcoming
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    Sessions
                  </Text>
                </CardContent>
              </Card>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full items-center justify-center">
                      <Text className="text-emerald-600 dark:text-emerald-400 text-lg">
                        👥
                      </Text>
                    </View>
                    <Text className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.totalClients}
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-gray-900 dark:text-white">
                    Active
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    Clients
                  </Text>
                </CardContent>
              </Card>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full items-center justify-center">
                      <Text className="text-purple-600 dark:text-purple-400 text-lg">
                        ⏰
                      </Text>
                    </View>
                    <Text className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.weeklyHours}h
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-gray-900 dark:text-white">
                    This Week
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    Hours
                  </Text>
                </CardContent>
              </Card>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full items-center justify-center">
                      <Text className="text-amber-600 dark:text-amber-400 text-lg">
                        ⭐
                      </Text>
                    </View>
                    <Text className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {stats.rating > 0 ? stats.rating.toFixed(1) : "--"}
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-gray-900 dark:text-white">
                    Average
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    Rating
                  </Text>
                </CardContent>
              </Card>
            </View>
          </View>
        </View>
        {/* Professional Quick Actions */}
        <View className="px-6 mt-6">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </Text>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-1">
              <View className="space-y-1">
                <TouchableOpacity
                  onPress={() => router.push("/chat")}
                  className="flex-row items-center p-4 rounded-lg active:bg-gray-50 dark:active:bg-gray-700"
                >
                  <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center mr-4">
                    <Text className="text-blue-600 dark:text-blue-400 text-lg">
                      💬
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-medium">
                      Messages
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      View and respond to client messages
                    </Text>
                  </View>
                  <Text className="text-gray-400 dark:text-gray-500">›</Text>
                </TouchableOpacity>

                <View className="h-px bg-gray-200 dark:bg-gray-700 mx-4" />

                <TouchableOpacity
                  onPress={() => router.push("/(main)/sessions")}
                  className="flex-row items-center p-4 rounded-lg active:bg-gray-50 dark:active:bg-gray-700"
                >
                  <View className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full items-center justify-center mr-4">
                    <Text className="text-emerald-600 dark:text-emerald-400 text-lg">
                      📅
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-medium">
                      Schedule Management
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      Manage appointments and availability
                    </Text>
                  </View>
                  <Text className="text-gray-400 dark:text-gray-500">›</Text>
                </TouchableOpacity>

                <View className="h-px bg-gray-200 dark:bg-gray-700 mx-4" />

                <TouchableOpacity
                  onPress={() => router.push("/profile")}
                  className="flex-row items-center p-4 rounded-lg active:bg-gray-50 dark:active:bg-gray-700"
                >
                  <View className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full items-center justify-center mr-4">
                    <Text className="text-purple-600 dark:text-purple-400 text-lg">
                      ⚙️
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-medium">
                      Profile Settings
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      Update your professional profile
                    </Text>
                  </View>
                  <Text className="text-gray-400 dark:text-gray-500">›</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </View>
        {/* Client Management Section */}
        <View className="px-6 mt-6">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Client Management
          </Text>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              {loading ? (
                <View className="py-12 items-center">
                  <View className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <Text className="text-gray-500 dark:text-gray-400">
                    Loading client information...
                  </Text>
                </View>
              ) : clients.length === 0 ? (
                <View className="py-12 items-center">
                  <View className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center mb-4">
                    <Text className="text-gray-400 dark:text-gray-500 text-2xl">
                      👥
                    </Text>
                  </View>
                  <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-2">
                    No Active Clients
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-center text-sm leading-relaxed max-w-xs">
                    Your client list will appear here once you start conducting
                    sessions. New clients will be automatically added when they
                    book appointments.
                  </Text>
                </View>
              ) : (
                <View>
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-gray-900 dark:text-white font-semibold">
                      Active Clients ({clients.length})
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/(main)")}
                      className="flex-row items-center"
                    >
                      <Text className="text-blue-600 dark:text-blue-400 text-sm mr-1">
                        View All
                      </Text>
                      <Text className="text-blue-600 dark:text-blue-400">
                        ›
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="-mx-2"
                  >
                    <View className="flex-row px-2">
                      {clients.map((client, index) => (
                        <TouchableOpacity
                          key={client.uid}
                          onPress={() =>
                            router.push({
                              pathname: "/profile/[userId]",
                              params: { userId: client.uid },
                            })
                          }
                          className="w-32 mx-2"
                        >
                          <Card className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                            <CardContent className="p-4 items-center">
                              <View className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center mb-3">
                                <Text className="text-white text-lg font-bold">
                                  {client.displayName?.charAt(0) || "?"}
                                </Text>
                              </View>
                              <Text
                                className="text-gray-900 dark:text-white text-center text-sm font-medium mb-1"
                                numberOfLines={2}
                              >
                                {client.displayName || "Unknown Client"}
                              </Text>
                              <View className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                                <Text className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                                  {client.role === "user" ? "Client" : "User"}
                                </Text>
                              </View>
                            </CardContent>
                          </Card>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </CardContent>
          </Card>
        </View>
        {/* Professional Schedule Overview */}
        <View className="px-6 mt-6">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Today's Schedule
          </Text>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <View className="py-12 items-center">
                <View className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center mb-4">
                  <Text className="text-gray-400 dark:text-gray-500 text-2xl">
                    📅
                  </Text>
                </View>
                <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-2">
                  No Sessions Today
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-center text-sm leading-relaxed max-w-xs">
                  Your daily schedule will appear here when you have
                  appointments booked.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(main)/sessions")}
                  className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-medium">
                    Manage Schedule
                  </Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </View>
        {/* Professional Profile Summary */}
        <View className="px-6 mt-6 mb-8">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Professional Profile
          </Text>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <View className="space-y-4">
                <View className="flex-row items-start">
                  <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center mr-4 mt-1">
                    <Text className="text-blue-600 dark:text-blue-400 text-sm">
                      🎯
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-medium mb-1">
                      Specializations
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {counsellorProfile.specializations?.join(", ") ||
                        "Not specified"}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-gray-200 dark:bg-gray-700" />

                <View className="flex-row items-start">
                  <View className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full items-center justify-center mr-4 mt-1">
                    <Text className="text-emerald-600 dark:text-emerald-400 text-sm">
                      📚
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-medium mb-1">
                      Professional Experience
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm">
                      {counsellorProfile.yearsExperience} years of experience
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-gray-200 dark:bg-gray-700" />

                <View className="flex-row items-start">
                  <View className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full items-center justify-center mr-4 mt-1">
                    <Text className="text-purple-600 dark:text-purple-400 text-sm">
                      🏆
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-medium mb-1">
                      License Information
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm">
                      {counsellorProfile.licenseType} • Licensed Professional
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-gray-200 dark:bg-gray-700" />

                <View className="flex-row items-start">
                  <View className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full items-center justify-center mr-4 mt-1">
                    <Text className="text-amber-600 dark:text-amber-400 text-sm">
                      💰
                    </Text>
                  </View>
                  <View className="flex-1 flex-row justify-between items-center">
                    <View>
                      <Text className="text-gray-900 dark:text-white font-medium mb-1">
                        Session Rate
                      </Text>
                      <Text className="text-gray-600 dark:text-gray-400 text-sm">
                        Professional consultation fee
                      </Text>
                    </View>
                    <Text className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      ${counsellorProfile.hourlyRate}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push("/profile")}
                className="mt-6 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg flex-row items-center justify-center"
              >
                <Text className="text-gray-700 dark:text-gray-300 font-medium mr-2">
                  Edit Profile
                </Text>
                <Text className="text-gray-400 dark:text-gray-500">✏️</Text>
              </TouchableOpacity>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
