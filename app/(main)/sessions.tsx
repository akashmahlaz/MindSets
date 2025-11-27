import "@/app/global.css";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { getUserSessions, SessionBooking } from "@/services/sessionService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
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
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");

  // Premium colors
  const colors = {
    background: isDarkColorScheme ? "#0F1419" : "#FAFBFC",
    card: isDarkColorScheme ? "#171D26" : "#FFFFFF",
    cardAlt: isDarkColorScheme ? "#1E2632" : "#F8FAFC",
    text: isDarkColorScheme ? "#F0F2F5" : "#1E2530",
    textSecondary: isDarkColorScheme ? "#8B95A5" : "#747B8A",
    primary: isDarkColorScheme ? "#6B8CF5" : "#4A6CF4",
    secondary: isDarkColorScheme ? "#4CC38A" : "#3FA57A",
    accent: isDarkColorScheme ? "#B79CFC" : "#A78BFA",
    warning: "#F59E0B",
    success: isDarkColorScheme ? "#4CC38A" : "#26A269",
    error: "#EF4444",
    border: isDarkColorScheme ? "#323A48" : "#E2E5E9",
  };

  useEffect(() => {
    loadSessions();
  }, [userProfile]);

  const loadSessions = async () => {
    if (!userProfile?.uid) return;

    setLoading(true);
    try {
      const userRole = userProfile.role === "counsellor" ? "counselor" : "client";
      const userSessions = await getUserSessions(userProfile.uid, userRole);
      setSessions(userSessions);
    } catch (error) {
      console.error("Error loading sessions:", error);
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
    const sessionTitle = userProfile?.role === "counsellor"
      ? `Session with ${session.clientName}`
      : `Session with ${session.counselorName}`;

    try {
      await Share.share({
        message: `📅 ${sessionTitle}\n📆 ${session.date.toLocaleDateString()}\n⏰ ${session.date.toLocaleTimeString()}\n⏱️ ${session.duration} minutes`,
        title: "Session Details",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const joinSession = (session: SessionBooking) => {
    if (session.status !== "confirmed") {
      Alert.alert("Session Not Available", "This session is not confirmed yet.");
      return;
    }
    
    Alert.alert("Join Session", "Choose how to join:", [
      { text: "Cancel", style: "cancel" },
      { text: "Video Call", onPress: () => console.log("Video call") },
      { text: "Voice Call", onPress: () => console.log("Voice call") },
    ]);
  };

  const createNewSession = () => {
    router.push("/(session)/book-session");
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; label: string; icon: string }> = {
      pending: { color: colors.warning, bg: colors.warning + "15", label: "Pending", icon: "time-outline" },
      confirmed: { color: colors.success, bg: colors.success + "15", label: "Confirmed", icon: "checkmark-circle-outline" },
      completed: { color: colors.primary, bg: colors.primary + "15", label: "Completed", icon: "checkmark-done-outline" },
      cancelled: { color: colors.error, bg: colors.error + "15", label: "Cancelled", icon: "close-circle-outline" },
    };
    return configs[status] || configs.pending;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      therapy: "medical-outline",
      consultation: "people-outline",
      "follow-up": "refresh-outline",
      "crisis-support": "alert-circle-outline",
    };
    return icons[type] || "calendar-outline";
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const upcomingSessions = sessions.filter(
    (s) => (s.status === "pending" || s.status === "confirmed") && s.date > new Date()
  );
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const currentSessions = activeTab === "upcoming" ? upcomingSessions : completedSessions;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16 }}>Loading sessions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text }}>
              Sessions
            </Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 4 }}>
              {userProfile?.role === "counsellor" ? "Manage your appointments" : "Track your therapy sessions"}
            </Text>
          </View>
          
          <Pressable
            onPress={createNewSession}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Tabs */}
        <View 
          style={{
            flexDirection: "row",
            backgroundColor: colors.cardAlt,
            borderRadius: 12,
            padding: 4,
          }}
        >
          {[
            { id: "upcoming", label: "Upcoming", count: upcomingSessions.length },
            { id: "completed", label: "History", count: completedSessions.length },
          ].map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id as "upcoming" | "completed")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: activeTab === tab.id ? colors.card : "transparent",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <Text 
                style={{ 
                  fontSize: 14, 
                  fontWeight: "600",
                  color: activeTab === tab.id ? colors.text : colors.textSecondary,
                }}
              >
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View 
                  style={{
                    backgroundColor: activeTab === tab.id ? colors.primary : colors.border,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                    marginLeft: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: activeTab === tab.id ? "#FFFFFF" : colors.textSecondary }}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshSessions} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {currentSessions.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 60, paddingBottom: 40 }}>
            <View 
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.cardAlt,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Ionicons name="calendar-outline" size={36} color={colors.textSecondary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
              No {activeTab === "upcoming" ? "upcoming" : "past"} sessions
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20, maxWidth: 280 }}>
              {activeTab === "upcoming" 
                ? "Book a session to start your mental health journey"
                : "Your completed sessions will appear here"}
            </Text>
            {activeTab === "upcoming" && (
              <Pressable
                onPress={createNewSession}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  borderRadius: 12,
                  marginTop: 24,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>
                  Book Session
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {currentSessions.map((session) => {
              const statusConfig = getStatusConfig(session.status);
              
              return (
                <Pressable key={session.id}>
                  <View 
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    {/* Header Row */}
                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                        <View 
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            backgroundColor: colors.primary + "15",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Ionicons name={getTypeIcon(session.type) as any} size={22} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
                            {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session
                          </Text>
                          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
                            {userProfile?.role === "counsellor" ? `With ${session.clientName}` : `With ${session.counselorName}`}
                          </Text>
                        </View>
                      </View>
                      
                      <View 
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: statusConfig.bg,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 20,
                        }}
                      >
                        <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: statusConfig.color, marginLeft: 4 }}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>

                    {/* Time Info */}
                    <View 
                      style={{
                        backgroundColor: colors.cardAlt,
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 12,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                          <Text style={{ fontSize: 14, color: colors.text, fontWeight: "500", marginLeft: 8 }}>
                            {formatDate(session.date)}
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                          <Text style={{ fontSize: 14, color: colors.text, fontWeight: "500", marginLeft: 6 }}>
                            {session.duration} min
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Notes */}
                    {session.notes && (
                      <View 
                        style={{
                          borderLeftWidth: 3,
                          borderLeftColor: colors.primary,
                          paddingLeft: 12,
                          paddingVertical: 4,
                          marginBottom: 12,
                        }}
                      >
                        <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                          {session.notes}
                        </Text>
                      </View>
                    )}

                    {/* Actions */}
                    {session.status === "confirmed" && activeTab === "upcoming" && (
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <Pressable
                          onPress={() => joinSession(session)}
                          style={{
                            flex: 1,
                            backgroundColor: colors.primary,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            paddingVertical: 12,
                            borderRadius: 10,
                          }}
                        >
                          <Ionicons name="videocam" size={18} color="#FFFFFF" />
                          <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF", marginLeft: 6 }}>
                            Join Session
                          </Text>
                        </Pressable>
                        
                        <Pressable
                          onPress={() => shareSessionDetails(session)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: 10,
                            backgroundColor: colors.cardAlt,
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          <Ionicons name="share-outline" size={18} color={colors.text} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
