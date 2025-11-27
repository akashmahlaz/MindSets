import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import {
    getUpcomingSessions,
    getUserSessions,
} from "@/services/sessionService";
import { getAllUsers } from "@/services/userService";
import { CounsellorProfileData, UserProfile } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function CounsellorDashboard() {
  const { isDarkColorScheme } = useColorScheme();
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    upcomingSessions: 0,
    totalClients: 0,
    weeklyHours: 0,
    rating: 0,
  });

  // Premium animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Premium Material Design 3 colors
  const colors = {
    background: isDarkColorScheme ? "#0F172A" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#334155" : "#F1F5F9",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#6366F1",
    primaryContainer: isDarkColorScheme ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.08)",
    secondary: "#10B981",
    secondaryContainer: isDarkColorScheme ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.08)",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
    warning: "#F59E0B",
    warningContainer: isDarkColorScheme ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.08)",
    error: "#EF4444",
    errorContainer: isDarkColorScheme ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)",
    purple: "#8B5CF6",
  };

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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.primaryContainer,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="person-outline" size={28} color={colors.primary} />
          </View>
          <Text style={{ color: colors.text, fontSize: 16 }}>Loading counsellor dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView 
          style={{ flex: 1 }} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Premium Header */}
          <View style={{
            backgroundColor: colors.surface,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 24,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' }}>
                    {counsellorProfile.firstName?.charAt(0)}
                  </Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginRight: 10 }}>
                      Dr. {counsellorProfile.firstName} {counsellorProfile.lastName}
                    </Text>
                    {counsellorProfile.verificationStatus === "verified" && (
                      <View style={{
                        backgroundColor: colors.secondaryContainer,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.secondary} />
                        <Text style={{ color: colors.secondary, fontSize: 11, fontWeight: '600', marginLeft: 4 }}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 2 }}>
                    {counsellorProfile.specializations?.slice(0, 2).join(", ") || "Mental Health Professional"}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {counsellorProfile.yearsExperience} yrs exp • ${counsellorProfile.hourlyRate}/hr
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleLogout}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceVariant,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        {/* Professional Status Cards */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            {counsellorProfile.verificationStatus === "pending" && (
              <View style={{
                backgroundColor: colors.warningContainer,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}>
                  <Ionicons name="time-outline" size={22} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.warning, fontSize: 16, marginBottom: 4 }}>
                    Verification In Progress
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
                    Your credentials are being reviewed. This typically takes 3-5 business days.
                  </Text>
                </View>
              </View>
            )}

            {counsellorProfile.verificationStatus === "rejected" && (
              <View style={{
                backgroundColor: colors.errorContainer,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}>
                  <Ionicons name="alert-circle-outline" size={22} color={colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.error, fontSize: 16, marginBottom: 4 }}>
                    Application Requires Updates
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 12 }}>
                    {counsellorProfile.verificationNotes || "Please review the feedback and resubmit your application."}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/profile/edit")}
                    style={{
                      alignSelf: 'flex-start',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    }}
                  >
                    <Text style={{ color: colors.error, fontWeight: '600', fontSize: 14 }}>Update Application</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {counsellorProfile.verificationStatus === "verified" && (
              <View style={{
                backgroundColor: colors.secondaryContainer,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}>
                  <Ionicons name="shield-checkmark" size={22} color={colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.secondary, fontSize: 16, marginBottom: 4 }}>
                    Professional Status Verified
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
                    Your credentials are verified. You can now accept clients and conduct sessions.
                  </Text>
                </View>
              </View>
            )}
          </View>
        {/* Professional Analytics Dashboard */}
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              Dashboard Overview
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
              {[
                { icon: "calendar", label: "Upcoming", sublabel: "Sessions", value: stats.upcomingSessions, color: colors.primary },
                { icon: "people", label: "Active", sublabel: "Clients", value: stats.totalClients, color: colors.secondary },
                { icon: "time", label: "This Week", sublabel: "Hours", value: `${stats.weeklyHours}h`, color: colors.purple },
                { icon: "star", label: "Average", sublabel: "Rating", value: stats.rating > 0 ? stats.rating.toFixed(1) : "--", color: colors.warning },
              ].map((stat, index) => (
                <View key={index} style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                  <View style={{
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <View style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        backgroundColor: `${stat.color}15`,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                      </View>
                      <Text style={{ fontSize: 24, fontWeight: '700', color: stat.color }}>{stat.value}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{stat.label}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{stat.sublabel}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        {/* Professional Quick Actions */}
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              Quick Actions
            </Text>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              {[
                { icon: "chatbubbles", label: "Messages", desc: "View and respond to client messages", route: "/chat", color: colors.primary },
                { icon: "calendar", label: "Schedule Management", desc: "Manage appointments and availability", route: "/(main)/sessions", color: colors.secondary },
                { icon: "settings", label: "Profile Settings", desc: "Update your professional profile", route: "/profile", color: colors.purple },
              ].map((action, index, arr) => (
                <View key={index}>
                  <TouchableOpacity
                    onPress={() => router.push(action.route as any)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                    }}
                  >
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: `${action.color}15`,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 14,
                    }}>
                      <Ionicons name={action.icon as any} size={22} color={action.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15, marginBottom: 2 }}>{action.label}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{action.desc}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {index < arr.length - 1 && (
                    <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 74 }} />
                  )}
                </View>
              ))}
            </View>
          </View>
        {/* Client Management Section */}
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              Client Management
            </Text>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              {loading ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    borderWidth: 3,
                    borderColor: colors.primaryContainer,
                    borderTopColor: colors.primary,
                    marginBottom: 16,
                  }} />
                  <Text style={{ color: colors.textSecondary }}>Loading client information...</Text>
                </View>
              ) : clients.length === 0 ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <View style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: colors.surfaceVariant,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}>
                    <Ionicons name="people-outline" size={28} color={colors.textSecondary} />
                  </View>
                  <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600', marginBottom: 8 }}>
                    No Active Clients
                  </Text>
                  <Text style={{
                    color: colors.textSecondary,
                    textAlign: 'center',
                    fontSize: 14,
                    lineHeight: 20,
                    maxWidth: 280,
                  }}>
                    Your client list will appear here once you start conducting sessions.
                  </Text>
                </View>
              ) : (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
                      Active Clients ({clients.length})
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/(main)")}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Text style={{ color: colors.primary, fontSize: 14, marginRight: 4 }}>View All</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -8 }}>
                    <View style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
                      {clients.map((client, index) => (
                        <TouchableOpacity
                          key={client.uid}
                          onPress={() => router.push({ pathname: "/profile/[userId]", params: { userId: client.uid } })}
                          style={{ width: 120, marginHorizontal: 6 }}
                        >
                          <View style={{
                            backgroundColor: colors.surfaceVariant,
                            borderRadius: 16,
                            padding: 16,
                            alignItems: 'center',
                          }}>
                            <LinearGradient
                              colors={['#6366F1', '#8B5CF6']}
                              style={{
                                width: 52,
                                height: 52,
                                borderRadius: 26,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 12,
                              }}
                            >
                              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>
                                {client.displayName?.charAt(0) || "?"}
                              </Text>
                            </LinearGradient>
                            <Text
                              style={{ color: colors.text, textAlign: 'center', fontSize: 14, fontWeight: '600', marginBottom: 6 }}
                              numberOfLines={2}
                            >
                              {client.displayName || "Unknown"}
                            </Text>
                            <View style={{
                              backgroundColor: colors.primaryContainer,
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 10,
                            }}>
                              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>
                                {client.role === "user" ? "Client" : "User"}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        {/* Professional Schedule Overview */}
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              Today&apos;s Schedule
            </Text>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.surfaceVariant,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <Ionicons name="calendar-outline" size={28} color={colors.textSecondary} />
                </View>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600', marginBottom: 8 }}>
                  No Sessions Today
                </Text>
                <Text style={{
                  color: colors.textSecondary,
                  textAlign: 'center',
                  fontSize: 14,
                  lineHeight: 20,
                  maxWidth: 280,
                  marginBottom: 20,
                }}>
                  Your daily schedule will appear here when you have appointments booked.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(main)/sessions")}
                  style={{ overflow: 'hidden', borderRadius: 12 }}
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>
                      Manage Schedule
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        {/* Professional Profile Summary */}
          <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 32 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              Professional Profile
            </Text>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ gap: 16 }}>
                {[
                  { icon: "ribbon", label: "Specializations", value: counsellorProfile.specializations?.join(", ") || "Not specified", color: colors.primary },
                  { icon: "school", label: "Professional Experience", value: `${counsellorProfile.yearsExperience} years of experience`, color: colors.secondary },
                  { icon: "trophy", label: "License Information", value: `${counsellorProfile.licenseType} • Licensed Professional`, color: colors.purple },
                ].map((item, index, arr) => (
                  <View key={index}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: `${item.color}15`,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 14,
                        marginTop: 2,
                      }}>
                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15, marginBottom: 4 }}>{item.label}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>{item.value}</Text>
                      </View>
                    </View>
                    {index < arr.length - 1 && (
                      <View style={{ height: 1, backgroundColor: colors.border, marginTop: 16, marginLeft: 58 }} />
                    )}
                  </View>
                ))}
                
                {/* Session Rate */}
                <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 58 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: `${colors.warning}15`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}>
                    <Ionicons name="cash" size={20} color={colors.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15, marginBottom: 2 }}>Session Rate</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Professional consultation fee</Text>
                  </View>
                  <Text style={{ fontSize: 26, fontWeight: '700', color: colors.warning }}>
                    ${counsellorProfile.hourlyRate}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push("/profile")}
                style={{
                  marginTop: 20,
                  backgroundColor: colors.surfaceVariant,
                  padding: 16,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="create-outline" size={18} color={colors.text} style={{ marginRight: 8 }} />
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}
