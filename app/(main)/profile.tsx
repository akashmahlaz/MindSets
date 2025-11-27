import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { UserProfileData } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function UserProfileScreen() {
  const { userProfile, logout } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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
    accent: "#8B5CF6",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
    error: "#EF4444",
    errorContainer: isDarkColorScheme ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)",
  };

  const userProfileData = userProfile as UserProfileData;

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert("Error", "Failed to sign out");
          }
        },
      },
    ]);
  };

  if (!userProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: colors.primaryContainer,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const menuItems = [
    { icon: "chatbubbles-outline", label: "My Conversations", route: "/chat", color: "#6366F1" },
    { icon: "calendar-outline", label: "My Sessions", route: "/(main)/sessions", color: "#8B5CF6" },
    { icon: "heart-outline", label: "Saved Counselors", route: "/(main)/Counselors", color: "#EC4899" },
    { icon: "document-text-outline", label: "Resources", route: "/(resources)/articles", color: "#10B981" },
  ];

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5 }}>
            Profile
          </Text>
          <Pressable 
            onPress={() => router.push("/(setting)/settings")}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.surfaceVariant,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView 
          style={{ flex: 1 }} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Profile Card */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: 24,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDarkColorScheme ? 0.3 : 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}>
              {/* Avatar with gradient border */}
              <View style={{ marginBottom: 16 }}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 108,
                    height: 108,
                    borderRadius: 54,
                    padding: 3,
                  }}
                >
                  <View style={{
                    flex: 1,
                    borderRadius: 52,
                    backgroundColor: colors.surface,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                  }}>
                    {userProfile.photoURL ? (
                      <Image
                        source={{ uri: userProfile.photoURL }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                      >
                        <Text style={{ fontSize: 36, fontWeight: '700', color: '#FFFFFF' }}>
                          {userProfile.displayName?.charAt(0)?.toUpperCase() || "U"}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                </LinearGradient>
              </View>

              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                {userProfile.displayName}
              </Text>
              <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 16 }}>
                {userProfile.email}
              </Text>

              {/* Stats Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: colors.primary }}>
                    {userProfileData?.primaryConcerns?.length || 0}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>Concerns</Text>
                </View>
                <View style={{ width: 1, height: 30, backgroundColor: colors.border }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: colors.secondary }}>
                    {userProfile.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) || "N/A"}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>Joined</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Primary Concerns */}
          {userProfileData?.primaryConcerns && userProfileData.primaryConcerns.length > 0 && (
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
                Focus Areas
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {userProfileData.primaryConcerns.map((concern, index) => (
                  <View
                    key={concern}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: index % 3 === 0 ? colors.primaryContainer : index % 3 === 1 ? colors.secondaryContainer : 'rgba(139, 92, 246, 0.1)',
                    }}
                  >
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: '500',
                      color: index % 3 === 0 ? colors.primary : index % 3 === 1 ? colors.secondary : colors.accent,
                    }}>
                      {concern.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Menu Items */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
              Quick Access
            </Text>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDarkColorScheme ? 0.2 : 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              {menuItems.map((item, index) => (
                <Pressable
                  key={index}
                  onPress={() => router.push(item.route as any)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 18,
                    paddingVertical: 16,
                    borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${item.color}15`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: colors.text }}>
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Preferences Summary */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
              Preferences
            </Text>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 18,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDarkColorScheme ? 0.2 : 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 15, color: colors.textSecondary }}>Preferred Counselor</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, textTransform: 'capitalize' }}>
                  {userProfileData?.preferredCounsellorGender?.replace("-", " ") || "No preference"}
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 14 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, color: colors.textSecondary }}>Session Type</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, textTransform: 'capitalize' }}>
                  {userProfileData?.preferredSessionType || "Any"}
                </Text>
              </View>
            </View>
          </View>

          {/* Sign Out Button */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Pressable
              onPress={handleLogout}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 16,
                borderRadius: 16,
                backgroundColor: colors.errorContainer,
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={{ color: colors.error, marginLeft: 10, fontSize: 16, fontWeight: '600' }}>
                Sign Out
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

