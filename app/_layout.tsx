import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import { StreamProvider } from "@/context/StreamContext";
import { VideoProvider } from "@/context/VideoContext";
import { initializeSound } from "@/lib/SoundService";
import { useColorScheme } from "@/lib/useColorScheme";
import { setupVideoPushConfig } from "@/lib/videoPushConfig";
import { Slot, useRootNavigationState, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, AppRegistry, StatusBar, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

// Initialize push notifications using the new service
import { PushNotificationInitializer } from "@/hooks/usePushNotifications";


import { OverlayProvider } from "stream-chat-react-native";

// Initialize video push configuration on app start
setupVideoPushConfig();

// Initialize sound service for meditation/breathing/sleep sounds
initializeSound().catch(err => console.warn('Failed to initialize sound:', err));

// Register headless task for foreground service - only register once
let isHeadlessTaskRegistered = false;
if (!isHeadlessTaskRegistered) {
  try {
    AppRegistry.registerHeadlessTask(
      "app.notifee.foreground-service-headless-task",
      () => () => {
        console.log("Foreground service headless task running");
        return Promise.resolve();
      },
    );
    isHeadlessTaskRegistered = true;
  } catch (e) {
    // Task already registered
  }
}

// Suppress specific warnings from Stream Video SDK
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0] &&
    typeof args[0] === "string" &&
    (args[0].includes("Text strings must be rendered within a <Text> component") ||
      args[0].includes("useChannelsContext hook was called outside") ||
      args[0].includes("registerHeadlessTask or registerCancellableHeadlessTask called multiple times"))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

function StreamChatWrapper({ children }: { children: React.ReactNode }) {
  const { isDarkColorScheme } = useColorScheme();

  // Premium dark theme matching app design
  const darkTheme = {
    colors: {
      accent_blue: "#2AA79D",
      accent_green: "#2AA79D",
      accent_red: "#E57373",
      bg_gradient_end: "#0F1117",
      bg_gradient_start: "#0F1117",
      black: "#E5E7EB",
      blue_alice: "#151923",
      border: "#374151",
      grey: "#9CA3AF",
      grey_gainsboro: "#1C2128",
      grey_whisper: "#151923",
      icon_background: "#1C2128",
      icon: "#E5E7EB",
      modal_shadow: "#00000080",
      modal: "#151923",
      overlay: "#0F1117E6",
      shadow_icon: "#9CA3AF",
      targetedMessageBackground: "#1C2128",
      transparent: "transparent",
      text: "#E5E7EB",
      white: "#151923",
      white_smoke: "#1C2128",
      white_snow: "#151923",
    },
  };

  // Premium light theme
  const lightTheme = {
    colors: {
      accent_blue: "#2AA79D",
      accent_green: "#2AA79D",
      accent_red: "#E57373",
      bg_gradient_end: "#FFFFFF",
      bg_gradient_start: "#FFFFFF",
      black: "#1F2937",
      blue_alice: "#F9FBFB",
      border: "#E5E7EB",
      grey: "#6B7280",
      grey_gainsboro: "#F9FBFB",
      grey_whisper: "#FFFFFF",
      icon_background: "#F1F5F9",
      icon: "#0F172A",
      modal_shadow: "#00000020",
      modal: "#FFFFFF",
      overlay: "#FAFBFCE6",
      shadow_icon: "#64748B",
      targetedMessageBackground: "#F1F5F9",
      transparent: "transparent",
      text: "#0F172A",
      white: "#FFFFFF",
      white_smoke: "#F1F5F9",
      white_snow: "#FFFFFF",
    },
  };

  return (
    <OverlayProvider
      value={{ style: isDarkColorScheme ? darkTheme : lightTheme }}
    >
      {children}
    </OverlayProvider>
  );
}

// Premium Splash Screen Component
function SplashScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const colors = {
    background: isDarkColorScheme ? "#0F1117" : "#FFFFFF",
    primary: "#2AA79D",
    text: isDarkColorScheme ? "#E5E7EB" : "#1F2937",
    textSecondary: isDarkColorScheme ? "#9CA3AF" : "#6B7280",
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <Animated.View
        style={{
          alignItems: "center",
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Logo */}
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 28,
            backgroundColor: colors.primary + "15",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 48 }}>🧠</Text>
        </View>
        
        {/* App Name */}
        <Text
          style={{
            fontSize: 32,
            fontWeight: "800",
            color: colors.text,
            letterSpacing: -0.5,
            marginBottom: 8,
          }}
        >
          MindSets
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: "center",
            maxWidth: 280,
          }}
        >
          Your journey to mental wellness
        </Text>
        
        {/* Loading Indicator */}
        <View style={{ marginTop: 48 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Animated.View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <ChatProvider>
            <StreamChatWrapper>
              <StreamProvider>
                <VideoProvider>
                  <PushNotificationInitializer>
                    <RootNavigator />
                  </PushNotificationInitializer>
                </VideoProvider>
              </StreamProvider>
            </StreamChatWrapper>
          </ChatProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const { isDarkColorScheme } = useColorScheme();

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
        const seen = await AsyncStorage.getItem("@onboarding_completed");
        setHasSeenOnboarding(seen === "true");
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setHasSeenOnboarding(true); // Default to true if error
      }
    };
    checkOnboarding();
  }, []);

  // Wait for navigation to be ready
  useEffect(() => {
    if (navigationState?.key && hasSeenOnboarding !== null) {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 1500); // Show splash for 1.5 seconds
      return () => clearTimeout(timer);
    }
  }, [navigationState?.key, hasSeenOnboarding]);

  // Handle navigation based on auth state
  useEffect(() => {
    // Don't navigate if not ready, still loading, or navigation state not available
    if (!isReady || loading || !navigationState?.key || hasSeenOnboarding === null) return;

    const inAuthGroup = segments[0] === "(auth)";

    try {
      if (!user && !inAuthGroup) {
        // User is not signed in and not on auth screens
        if (!hasSeenOnboarding) {
          // First time user - show onboarding
          router.replace("/(auth)/onboarding");
        } else {
          // Returning user - show role selection
          router.replace("/(auth)/role-selection");
        }
      } else if (user && inAuthGroup) {
        // User is signed in but on auth screens
        router.replace("/(main)");
      }
    } catch (e) {
      // Navigation failed - component might not be mounted yet
      console.log("Navigation deferred - layout not ready");
    }
  }, [user, segments, isReady, loading, navigationState?.key, hasSeenOnboarding]);

  // Show splash screen while loading
  if (!isReady || loading || hasSeenOnboarding === null) {
    return <SplashScreen />;
  }

  return (
    <>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? "#0A0A0F" : "#FAFBFC"}
      />
      <Slot />
    </>
  );
}
