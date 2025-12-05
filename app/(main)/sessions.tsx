import "@/app/global.css";
import { useAuth } from "@/context/AuthContext";
import { useVideo } from "@/context/VideoContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { getUserSessions, SessionBooking, updateSessionStatus } from "@/services/sessionService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Pressable,
    RefreshControl,
    ScrollView,
    Share,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function SessionsScreen() {
  const { userProfile } = useAuth();
  const { createCall, isVideoConnected, isCreatingCall } = useVideo();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<SessionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");

  // Premium animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Premium Material Design 3 colors
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#334155" : "#F1F5F9",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#2AA79D",
    primaryContainer: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.08)",
    secondary: "#3A9C94",
    secondaryContainer: isDarkColorScheme ? "rgba(58, 156, 148, 0.15)" : "rgba(58, 156, 148, 0.08)",
    purple: "#3A9C94",
    warning: "#F59E0B",
    warningContainer: isDarkColorScheme ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.08)",
    success: "#2AA79D",
    error: "#EF4444",
    errorContainer: isDarkColorScheme ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
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

  const joinSession = async (session: SessionBooking) => {
    if (session.status !== "confirmed") {
      Alert.alert("Session Not Available", "This session is not confirmed yet.");
      return;
    }

    if (!isVideoConnected) {
      Alert.alert("Error", "Video service not connected. Please try again.");
      return;
    }

    if (isCreatingCall) {
      return; // Already creating a call
    }

    // Get the other participant ID
    const otherUserId = userProfile?.role === "counsellor" 
      ? session.clientId 
      : session.counselorId;

    if (!otherUserId) {
      Alert.alert("Error", "Cannot find session participant.");
      return;
    }
    
    // Generate a unique call ID based on session ID
    const callId = `session-${session.id}-${Date.now().toString(36)}`;
    
    Alert.alert("Join Session", "Choose how to join:", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Video Call", 
        onPress: async () => {
          try {
            const call = await createCall(callId, [otherUserId], true);
            if (call) {
              router.push({
                pathname: "/call/[callId]",
                params: { callId: call.id, callType: "default", isVideo: "true" }
              });
            } else {
              Alert.alert("Error", "Failed to create call. Please try again.");
            }
          } catch (error) {
            console.error("Error creating video call:", error);
            Alert.alert("Error", "Failed to start video call.");
          }
        }
      },
      { 
        text: "Voice Call", 
        onPress: async () => {
          try {
            const call = await createCall(callId, [otherUserId], false);
            if (call) {
              router.push({
                pathname: "/call/[callId]",
                params: { callId: call.id, callType: "default", isVideo: "false" }
              });
            } else {
              Alert.alert("Error", "Failed to create call. Please try again.");
            }
          } catch (error) {
            console.error("Error creating voice call:", error);
            Alert.alert("Error", "Failed to start voice call.");
          }
        }
      },
    ]);
  };

  const handleApproveSession = async (session: SessionBooking) => {
    Alert.alert(
      "Confirm Session",
      `Approve session with ${session.clientName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            try {
              await updateSessionStatus(session.id, "confirmed");
              Alert.alert("Success", "Session confirmed!");
              await loadSessions(); // Reload sessions
            } catch (error) {
              Alert.alert("Error", "Failed to confirm session. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleRejectSession = async (session: SessionBooking) => {
    Alert.alert(
      "Reject Session",
      `Reject session with ${session.clientName}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await updateSessionStatus(session.id, "cancelled");
              Alert.alert("Session Rejected", "The session has been cancelled.");
              await loadSessions(); // Reload sessions
            } catch (error) {
              Alert.alert("Error", "Failed to reject session. Please try again.");
            }
          },
        },
      ]
    );
  };

  const createNewSession = () => {
    router.push("/(session)/book-session");
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; label: string; icon: string }> = {
      pending: { color: colors.warning, bg: colors.warningContainer, label: "Pending", icon: "time-outline" },
      confirmed: { color: colors.success, bg: colors.secondaryContainer, label: "Confirmed", icon: "checkmark-circle-outline" },
      completed: { color: colors.primary, bg: colors.primaryContainer, label: "Completed", icon: "checkmark-done-outline" },
      cancelled: { color: colors.error, bg: colors.errorContainer, label: "Cancelled", icon: "close-circle-outline" },
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.primaryContainer,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 16 }}>Loading sessions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        
        {/* Premium Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <View>
              <Text style={{ fontSize: 26, fontWeight: "700", color: colors.text, letterSpacing: -0.5 }}>
                Sessions
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                {userProfile?.role === "counsellor" ? "Manage your appointments" : "Track your therapy sessions"}
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={createNewSession}
              style={{ overflow: 'hidden', borderRadius: 16 }}
            >
              <LinearGradient
                colors={['#2AA79D', '#3A9C94']}
                style={{
                  width: 48,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Premium Tabs */}
          <View 
            style={{
              flexDirection: "row",
              backgroundColor: colors.surfaceVariant,
              borderRadius: 14,
              padding: 4,
            }}
          >
            {[
              { id: "upcoming", label: "Upcoming", count: upcomingSessions.length },
              { id: "completed", label: "History", count: completedSessions.length },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as "upcoming" | "completed")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: activeTab === tab.id ? colors.surface : "transparent",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  shadowColor: activeTab === tab.id ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: activeTab === tab.id ? 0.1 : 0,
                  shadowRadius: 4,
                  elevation: activeTab === tab.id ? 2 : 0,
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
              </TouchableOpacity>
            ))}
          </View>
        </View>

      <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
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
                  backgroundColor: colors.primaryContainer,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Ionicons name="calendar-outline" size={36} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
                No {activeTab === "upcoming" ? "upcoming" : "past"} sessions
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20, maxWidth: 280 }}>
                {activeTab === "upcoming" 
                  ? "Book a session to start your mental health journey"
                  : "Your completed sessions will appear here"}
              </Text>
              {activeTab === "upcoming" && (
                <TouchableOpacity
                  onPress={createNewSession}
                  style={{ marginTop: 24, overflow: 'hidden', borderRadius: 14 }}
                >
                  <LinearGradient
                    colors={['#2AA79D', '#3A9C94']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingHorizontal: 28,
                      paddingVertical: 14,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>
                      Book Session
                </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {currentSessions.map((session) => {
                const statusConfig = getStatusConfig(session.status);
                
                return (
                  <Pressable key={session.id}>
                    <View 
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 20,
                        padding: 18,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        elevation: 2,
                      }}
                    >
                      {/* Header Row */}
                      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                          <View 
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 14,
                              backgroundColor: colors.primaryContainer,
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 14,
                            }}
                          >
                            <Ionicons name={getTypeIcon(session.type) as any} size={22} color={colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
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
                            paddingHorizontal: 12,
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
                          backgroundColor: colors.surfaceVariant,
                          borderRadius: 12,
                          padding: 14,
                          marginBottom: 14,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, color: colors.text, fontWeight: "600", marginLeft: 8 }}>
                              {formatDate(session.date)}
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Ionicons name="time-outline" size={16} color={colors.purple} />
                            <Text style={{ fontSize: 14, color: colors.text, fontWeight: "600", marginLeft: 6 }}>
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
                            paddingLeft: 14,
                            paddingVertical: 4,
                            marginBottom: 14,
                          }}
                        >
                          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
                            {session.notes}
                          </Text>
                        </View>
                      )}

                      {/* Actions */}
                      {/* Counsellor: Show Approve/Reject for pending sessions */}
                      {userProfile?.role === "counsellor" && session.status === "pending" && activeTab === "upcoming" && (
                        <View style={{ flexDirection: "row", gap: 12 }}>
                          <TouchableOpacity
                            onPress={() => handleApproveSession(session)}
                            style={{ flex: 1, overflow: 'hidden', borderRadius: 12 }}
                          >
                            <LinearGradient
                              colors={['#2AA79D', '#3A9C94']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                paddingVertical: 14,
                              }}
                            >
                              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                              <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF", marginLeft: 6 }}>
                                Approve
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            onPress={() => handleRejectSession(session)}
                            style={{
                              flex: 1,
                              paddingVertical: 14,
                              borderRadius: 12,
                              backgroundColor: colors.errorContainer,
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons name="close-circle" size={18} color={colors.error} />
                            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.error, marginLeft: 6 }}>
                              Reject
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* All Users: Join confirmed sessions */}
                      {session.status === "confirmed" && activeTab === "upcoming" && (
                        <View style={{ flexDirection: "row", gap: 12 }}>
                          <TouchableOpacity
                            onPress={() => joinSession(session)}
                            style={{ flex: 1, overflow: 'hidden', borderRadius: 12 }}
                          >
                            <LinearGradient
                              colors={['#2AA79D', '#3A9C94']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                paddingVertical: 14,
                              }}
                            >
                              <Ionicons name="videocam" size={18} color="#FFFFFF" />
                              <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF", marginLeft: 6 }}>
                                Join Session
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            onPress={() => shareSessionDetails(session)}
                            style={{
                              paddingHorizontal: 18,
                              paddingVertical: 14,
                              borderRadius: 12,
                              backgroundColor: colors.surfaceVariant,
                            }}
                          >
                            <Ionicons name="share-outline" size={18} color={colors.text} />
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Client: Show waiting message for pending sessions */}
                      {userProfile?.role !== "counsellor" && session.status === "pending" && activeTab === "upcoming" && (
                        <View 
                          style={{
                            backgroundColor: colors.warningContainer,
                            borderRadius: 12,
                            padding: 14,
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <Ionicons name="time-outline" size={20} color={colors.warning} />
                          <Text style={{ fontSize: 13, color: colors.warning, marginLeft: 8, flex: 1, fontWeight: "600" }}>
                            Awaiting counsellor approval
                          </Text>
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
    </Animated.View>
  );
}
