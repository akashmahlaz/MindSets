import "@/app/global.css";
import CounsellorDashboard from "@/components/dashboard/CounsellorDashboard";
import UserDashboard from "@/components/dashboard/UserDashboard";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { useVideo } from "@/context/VideoContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { getAllUsers } from "@/services/userService";
import { UserProfile } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OverviewScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { chatClient, isChatConnected, connectToChat } = useChat();
  const { createCall, isVideoConnected } = useVideo();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkColorScheme } = useColorScheme();

  // MD3 Premium Colors
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#F8FAFF",
    surface: isDarkColorScheme ? "#1A1F2E" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#232936" : "#F1F5F9",
    primary: "#6366F1",
    primaryLight: "#818CF8",
    primaryContainer: isDarkColorScheme ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
    secondary: "#10B981",
    secondaryContainer: isDarkColorScheme ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
    accent: "#8B5CF6",
    accentContainer: isDarkColorScheme ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.1)",
    text: isDarkColorScheme ? "#F9FAFB" : "#111827",
    textSecondary: isDarkColorScheme ? "#9CA3AF" : "#6B7280",
    border: isDarkColorScheme ? "#374151" : "#E5E7EB",
    online: "#10B981",
    away: "#F59E0B",
    offline: "#6B7280",
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      if (!user?.uid) return;
      const allUsers = await getAllUsers(user.uid);
      const otherUsers = allUsers.filter((u) => u.uid !== user?.uid);
      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
    } catch (fetchError) {
      console.error("Error fetching users:", fetchError);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Show role-based dashboard if user profile is complete
  if (userProfile?.isProfileComplete) {
    if (userProfile.role === "counsellor") {
      return <CounsellorDashboard />;
    } else if (userProfile.role === "user") {
      return <UserDashboard />;
    }
  }

  const handleUserPress = (selectedUser: UserProfile) => {
    router.push({
      pathname: "/profile/[userId]",
      params: { userId: selectedUser.uid },
    });
  };

  const generateCallId = () => {
    return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const startCall = async (targetUser: UserProfile, isVideo = true) => {
    if (!isVideoConnected || !user?.uid) {
      Alert.alert("Error", "Video service not available. Please try again.");
      return;
    }

    try {
      const callId = generateCallId();
      const call = await createCall(callId, [targetUser.uid], isVideo);

      if (!call) {
        throw new Error("Failed to create call");
      }

      router.push({
        pathname: "/call/[callId]",
        params: {
          callId: call.id,
          callType: call.type,
          isVideo: isVideo.toString(),
        },
      });
    } catch (error) {
      console.error("Error starting call:", error);
      Alert.alert("Error", "Failed to start call. Please check your connection and try again.");
    }
  };

  const startChat = async (targetUser: UserProfile) => {
    if (!user || !chatClient) {
      Alert.alert("Error", "Chat not available");
      return;
    }

    if (!isChatConnected) {
      try {
        await connectToChat();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch {
        Alert.alert("Error", "Failed to connect to chat");
        return;
      }
    }

    try {
      const { createOrGetDirectChannel } = await import("@/services/chatHelpers");
      const channel = await createOrGetDirectChannel(user, targetUser.uid);
      router.push(`/chat/${channel.id}` as any);
    } catch {
      Alert.alert("Chat Error", `Failed to start chat with ${targetUser.displayName}. Please try again.`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return colors.online;
      case "away": return colors.away;
      default: return colors.offline;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(item)}
      activeOpacity={0.7}
      style={{ marginHorizontal: 16, marginBottom: 12 }}
    >
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Avatar */}
          <View style={{ position: 'relative' }}>
            {item.photoURL ? (
              <Image
                source={{ uri: item.photoURL }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                }}
              />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 18 }}>
                  {getInitials(item.displayName)}
                </Text>
              </LinearGradient>
            )}
            <View style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: getStatusColor(item.status),
              borderWidth: 2,
              borderColor: colors.surface,
            }} />
          </View>

          {/* User Info */}
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
              {item.displayName}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
              {item.email}
            </Text>
            <Text style={{ 
              color: item.status === 'online' ? colors.online : colors.textSecondary, 
              fontSize: 12, 
              marginTop: 4,
              fontWeight: '500',
              textTransform: 'capitalize',
            }}>
              {item.status}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => startChat(item)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.primaryContainer,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="chatbubble" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => startCall(item, false)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.secondaryContainer,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="call" size={18} color={colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => startCall(item, true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.accentContainer,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="videocam" size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUserSkeleton = () => (
    <View style={{
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: colors.surfaceVariant,
        }} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={{ width: 120, height: 18, borderRadius: 6, backgroundColor: colors.surfaceVariant, marginBottom: 6 }} />
          <View style={{ width: 160, height: 14, borderRadius: 6, backgroundColor: colors.surfaceVariant, marginBottom: 6 }} />
          <View style={{ width: 60, height: 12, borderRadius: 6, backgroundColor: colors.surfaceVariant }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceVariant }} />
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceVariant }} />
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceVariant }} />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        <View style={{ flex: 1 }}>
          {/* Header Skeleton */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <View style={{ width: 160, height: 28, borderRadius: 8, backgroundColor: colors.surfaceVariant, marginBottom: 8 }} />
                <View style={{ width: 180, height: 18, borderRadius: 6, backgroundColor: colors.surfaceVariant }} />
              </View>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceVariant }} />
            </View>
            <View style={{ height: 52, borderRadius: 16, backgroundColor: colors.surface }} />
          </View>
          {/* Users List Skeleton */}
          <View style={{ flex: 1 }}>
            {[...Array(6)].map((_, index) => (
              <View key={index}>{renderUserSkeleton()}</View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>
                Welcome back!
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 4 }}>
                Connect with your contacts
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              {user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  style={{ width: 44, height: 44 }}
                />
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 44,
                    height: 44,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                    {user?.displayName ? getInitials(user.displayName) : "U"}
                  </Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 16,
            paddingHorizontal: 16,
            height: 52,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              placeholder="Search users..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 16,
                color: colors.text,
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.uid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 }}>
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 30,
                backgroundColor: colors.surfaceVariant,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
              </View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
                {searchQuery ? "No users found" : "No contacts available"}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 }}>
                {searchQuery
                  ? "Try searching with a different name or email"
                  : "Invite friends to start connecting"}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  onPress={onRefresh}
                  style={{
                    marginTop: 20,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>Refresh</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
