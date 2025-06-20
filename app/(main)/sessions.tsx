import "@/app/global.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { getUserSessions, SessionBooking } from "@/services/sessionService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SessionsScreen() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [sessions, setSessions] = useState<SessionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [userProfile]);

  const loadSessions = async () => {
    if (!userProfile?.uid) return;

    setLoading(true);
    try {
      const userRole =
        userProfile.role === "counsellor" ? "counselor" : "client";
      const userSessions = await getUserSessions(userProfile.uid, userRole);
      setSessions(userSessions);
    } catch (error) {
      console.error("Error loading sessions:", error);
      Alert.alert("Error", "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const refreshSessions = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const shareSessionDetails = async (session: SessionBooking) => {
    const sessionTitle =
      userProfile?.role === "counsellor"
        ? `${session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session - ${session.clientName}`
        : `${session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session with ${session.counselorName}`;

    const sessionDetails = `
📅 Session Details

${sessionTitle}
📅 Date: ${session.date.toLocaleDateString()}
⏰ Time: ${session.date.toLocaleTimeString()}
⏱️ Duration: ${session.duration} minutes
${session.notes ? `📝 Notes: ${session.notes}` : ""}

MindConnect Mental Health Platform
    `.trim();

    try {
      await Share.share({
        message: sessionDetails,
        title: "Session Details",
      });
    } catch (error) {
      console.error("Error sharing session:", error);
    }
  };

  const joinSession = async (session: SessionBooking) => {
    if (session.status !== "confirmed") {
      Alert.alert(
        "Session Not Available",
        "This session is not confirmed yet.",
      );
      return;
    }

    const now = new Date();
    const sessionTime = new Date(session.date);
    const timeDiff = sessionTime.getTime() - now.getTime();
    const minutesUntilSession = Math.floor(timeDiff / (1000 * 60));

    if (minutesUntilSession > 15) {
      Alert.alert(
        "Session Not Started",
        `Your session starts in ${minutesUntilSession} minutes. You can join 15 minutes before the scheduled time.`,
        [{ text: "OK" }],
      );
      return;
    }

    if (minutesUntilSession < -session.duration) {
      Alert.alert("Session Ended", "This session has already ended.");
      return;
    }

    // Navigate to video call or show join options
    Alert.alert("Join Session", "Choose how you want to join your session:", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Video Call",
        onPress: () => {
          // TODO: Navigate to video call
          console.log("Starting video call for session:", session.id);
        },
      },
      {
        text: "Voice Call",
        onPress: () => {
          // TODO: Navigate to voice call
          console.log("Starting voice call for session:", session.id);
        },
      },
    ]);
  };

  const createNewSession = () => {
    console.log("Navigating to book session...");
    router.push("/(session)/book-session");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#F59E0B"; // Amber
      case "confirmed":
        return "#059669"; // Emerald
      case "completed":
        return "#10B981"; // Green
      case "cancelled":
        return "#EF4444"; // Red
      default:
        return "#6B7280"; // Gray
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "therapy":
        return "medical";
      case "consultation":
        return "people";
      case "follow-up":
        return "checkmark-circle";
      case "crisis-support":
        return "warning";
      default:
        return "calendar";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const upcomingSessions = sessions.filter(
    (s) =>
      (s.status === "pending" || s.status === "confirmed") &&
      s.date > new Date(),
  );
  const completedSessions = sessions.filter((s) => s.status === "completed");

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={isDarkColorScheme ? "#0f172a" : "#ffffff"}
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator
            size="large"
            color={isDarkColorScheme ? "#ffffff" : "#000000"}
          />
          <Text className="text-foreground text-lg mt-4">
            Loading sessions...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? "#0f172a" : "#ffffff"}
      />
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshSessions} />
        }
      >
        {/* Header */}
        <View className="py-6">
          <Text className="text-2xl font-bold text-foreground mb-2">
            My Sessions
          </Text>
          <Text className="text-muted-foreground">
            {userProfile?.role === "counsellor"
              ? "Manage your client sessions"
              : "Track your therapy sessions"}
          </Text>
        </View>

        {/* New Session Button */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-lg font-semibold text-foreground mb-1">
                  {userProfile?.role === "counsellor"
                    ? "Schedule New Session"
                    : "Book New Session"}
                </Text>
                <Text className="text-muted-foreground">
                  {userProfile?.role === "counsellor"
                    ? "Add a session with your clients"
                    : "Connect with a mental health professional"}
                </Text>
              </View>
              <Button onPress={createNewSession} className="px-6">
                <View className="flex-row items-center">
                  <Ionicons
                    name="add"
                    size={20}
                    color="white"
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-primary-foreground font-medium">
                    {userProfile?.role === "counsellor" ? "Schedule" : "Book"}
                  </Text>
                </View>
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-semibold text-foreground mb-4">
              Upcoming Sessions
            </Text>
            {upcomingSessions.map((session) => (
              <Card key={session.id} className="mb-4 shadow-sm">
                <CardContent className="p-4">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Ionicons
                          name={getTypeIcon(session.type)}
                          size={18}
                          color={getStatusColor(session.status)}
                          style={{ marginRight: 8 }}
                        />
                        <Text className="text-lg font-semibold text-foreground">
                          {session.type.charAt(0).toUpperCase() +
                            session.type.slice(1)}
                          Session
                        </Text>
                      </View>

                      <Text className="text-foreground font-medium mb-1">
                        {userProfile?.role === "counsellor"
                          ? `With ${session.clientName}`
                          : `With ${session.counselorName}`}
                      </Text>

                      <Text className="text-muted-foreground text-sm">
                        📅 {formatDate(session.date)}
                      </Text>
                      <Text className="text-muted-foreground text-sm">
                        ⏱️ {session.duration} minutes
                      </Text>
                    </View>

                    <View className="items-center">
                      <View
                        className="px-3 py-1 rounded-full mb-3"
                        style={{
                          backgroundColor: `${getStatusColor(session.status)}20`,
                        }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: getStatusColor(session.status) }}
                        >
                          {session.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {session.notes && (
                    <View className="bg-muted/50 p-3 rounded-lg mb-3">
                      <Text className="text-sm text-muted-foreground">
                        📝 {session.notes}
                      </Text>
                    </View>
                  )}

                  <View className="flex-row space-x-2">
                    {session.status === "confirmed" && (
                      <Button
                        onPress={() => joinSession(session)}
                        className="flex-1"
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name="videocam"
                            size={16}
                            color="white"
                            style={{ marginRight: 4 }}
                          />
                          <Text className="text-primary-foreground text-sm font-medium">
                            Join
                          </Text>
                        </View>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onPress={() => shareSessionDetails(session)}
                      className="flex-1"
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name="share"
                          size={16}
                          color={isDarkColorScheme ? "#ffffff" : "#000000"}
                          style={{ marginRight: 4 }}
                        />
                        <Text className="text-foreground text-sm font-medium">
                          Share
                        </Text>
                      </View>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}

        {/* Completed Sessions */}
        {completedSessions.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-semibold text-foreground mb-4">
              Recent Sessions
            </Text>
            {completedSessions.slice(0, 5).map((session) => (
              <Card key={session.id} className="mb-4 shadow-sm opacity-80">
                <CardContent className="p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Ionicons
                          name={getTypeIcon(session.type)}
                          size={18}
                          color={getStatusColor(session.status)}
                          style={{ marginRight: 8 }}
                        />
                        <Text className="text-lg font-semibold text-foreground">
                          {session.type.charAt(0).toUpperCase() +
                            session.type.slice(1)}
                          Session
                        </Text>
                      </View>

                      <Text className="text-foreground font-medium mb-1">
                        {userProfile?.role === "counsellor"
                          ? `With ${session.clientName}`
                          : `With ${session.counselorName}`}
                      </Text>

                      <Text className="text-muted-foreground text-sm">
                        📅 {formatDate(session.date)}
                      </Text>
                    </View>

                    <View
                      className="px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${getStatusColor(session.status)}20`,
                      }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: getStatusColor(session.status) }}
                      >
                        COMPLETED
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}

        {/* Empty State */}
        {sessions.length === 0 && (
          <Card className="mt-8 shadow-sm">
            <CardContent className="p-8 items-center">
              <Ionicons
                name="calendar-outline"
                size={64}
                color="#9CA3AF"
                style={{ marginBottom: 16 }}
              />
              <Text className="text-xl font-semibold text-foreground mb-2 text-center">
                No Sessions Yet
              </Text>
              <Text className="text-muted-foreground text-center mb-6">
                {userProfile?.role === "counsellor"
                  ? "Schedule your first session with a client"
                  : "Book your first session to get started on your mental health journey"}
              </Text>
              <Button onPress={createNewSession} className="px-8">
                <Text className="text-primary-foreground font-medium">
                  {userProfile?.role === "counsellor"
                    ? "Schedule Session"
                    : "Book Session"}
                </Text>
              </Button>
            </CardContent>
          </Card>
        )}

        <View className="pb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
