import "@/app/global.css";
import CounsellorDashboard from "@/components/dashboard/CounsellorDashboard";
import UserDashboard from "@/components/dashboard/UserDashboard";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
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
  };

  // Show role-based dashboard if user profile is complete
  if (userProfile?.isProfileComplete) {
    if (userProfile.role === "counsellor") {
      return <CounsellorDashboard />;
    } else if (userProfile.role === "user") {
      return <UserDashboard />;
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // If profile is NOT complete, show onboarding/complete profile prompt
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          paddingTop: 16,
          paddingBottom: 32,
        }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>
              Welcome to MindSets
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 4 }}>
              Complete your profile to get started
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(setting)/settings")}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={{ width: 48, height: 48 }}
              />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 18 }}>
                  {user?.displayName ? getInitials(user.displayName) : "U"}
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 36,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 56 }}>🧠</Text>
          </LinearGradient>
          
          <Text style={{ 
            fontSize: 22, 
            fontWeight: '700', 
            color: colors.text, 
            textAlign: 'center',
            marginBottom: 12,
          }}>
            Almost there!
          </Text>
          <Text style={{ 
            fontSize: 15, 
            color: colors.textSecondary, 
            textAlign: 'center',
            lineHeight: 22,
            maxWidth: 300,
          }}>
            Complete your profile to unlock all features and start your wellness journey
          </Text>
        </View>

        {/* Progress Card */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 24,
          padding: 24,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.primaryContainer,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 14,
            }}>
              <Ionicons name="person-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
                Profile Setup
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                {userProfile?.role === 'counsellor' ? 'Counsellor Profile' : 'User Profile'}
              </Text>
            </View>
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: '#FEF3C7',
            }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#D97706' }}>
                Incomplete
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ 
              height: 8, 
              backgroundColor: colors.surfaceVariant, 
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: '30%', height: '100%', borderRadius: 4 }}
              />
            </View>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>
              30% complete
            </Text>
          </View>

          {/* Complete Profile Button */}
          <TouchableOpacity
            onPress={() => router.push("/(setting)/settings")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16, marginRight: 8 }}>
                Complete Profile
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Features Preview */}
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '600', 
          color: colors.text, 
          marginBottom: 16 
        }}>
          Features You Will Unlock
        </Text>

        <View style={{ gap: 12 }}>
          {[
            { icon: 'chatbubbles', title: 'Secure Messaging', desc: 'Chat with counsellors privately', color: colors.primary },
            { icon: 'videocam', title: 'Video Sessions', desc: 'Face-to-face therapy sessions', color: colors.secondary },
            { icon: 'calendar', title: 'Easy Scheduling', desc: 'Book sessions at your convenience', color: colors.accent },
            { icon: 'heart', title: 'Wellness Tracking', desc: 'Monitor your mental health journey', color: '#EC4899' },
          ].map((feature, index) => (
            <View key={index} style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
            }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: `${feature.color}15`,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 14,
              }}>
                <Ionicons name={feature.icon as any} size={22} color={feature.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                  {feature.title}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {feature.desc}
                </Text>
              </View>
              <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
