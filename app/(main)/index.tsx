import "@/app/global.css";
import CounsellorDashboard from "@/components/dashboard/CounsellorDashboard";
import UserDashboard from "@/components/dashboard/UserDashboard";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  StatusBar,
  Text
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user, userProfile } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  // MD3 Premium Colors - matching tab bar
  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1A1F2E" : "#FFFFFF",
    primary: "#6366F1",
    primaryLight: "#818CF8",
    text: isDarkColorScheme ? "#F9FAFB" : "#111827",
    textSecondary: isDarkColorScheme ? "#9CA3AF" : "#6B7280",
  };

  // Show loading while profile loads
  if (!userProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        <Animated.View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons name="home" size={36} color="#FFFFFF" />
          </LinearGradient>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 15,
              marginTop: 16,
              fontWeight: "500",
            }}
          >
            Loading your dashboard...
          </Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Show role-based dashboard directly - NO profile completion check needed
  // Users fill everything during sign-up, so they go straight to their dashboard
  if (userProfile.role === "counsellor") {
    return <CounsellorDashboard />;
  }

  // Default: User dashboard
  return <UserDashboard />;
}
