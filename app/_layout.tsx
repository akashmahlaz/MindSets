import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import { StreamProvider } from "@/context/StreamContext";
import { VideoProvider } from "@/context/VideoContext";
import { initializeSound } from "@/lib/SoundService";
import { useColorScheme } from "@/lib/useColorScheme";
import { setupVideoPushConfig } from "@/lib/videoPushConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Slot, useRootNavigationState, useRouter, useSegments } from "expo-router";
import * as SplashScreenModule from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Animated, AppRegistry, Easing, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

// Initialize push notifications using the new service
import { PushNotificationInitializer } from "@/hooks/usePushNotifications";


import { OverlayProvider } from "stream-chat-react-native";

// Prevent auto-hide of native splash screen
SplashScreenModule.preventAutoHideAsync();

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

// Clean & Elegant Splash Screen Component
function SplashScreen({ onReady }: { onReady?: () => void }) {
  const { isDarkColorScheme } = useColorScheme();
  
  // Simple animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = React.useRef(new Animated.Value(0)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide native splash screen
    SplashScreenModule.hideAsync();
    
    // Simple, elegant animation sequence
    Animated.sequence([
      // Phase 1: Logo fades in with subtle scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Text appears
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false, // width animation can't use native driver
      easing: Easing.inOut(Easing.ease),
    }).start();

    // Call onReady after animations settle
    const timer = setTimeout(() => {
      onReady?.();
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  const colors = {
    background: isDarkColorScheme ? "#0F1117" : "#FFFFFF",
    primary: "#2AA79D",
    text: isDarkColorScheme ? "#F1F5F9" : "#1F2937",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    progressBg: isDarkColorScheme ? "#1E2533" : "#E2E8F0",
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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
      
      {/* Clean Logo Section */}
      <Animated.View
        style={{
          alignItems: "center",
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Simple Logo Container with subtle shadow */}
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <MaterialCommunityIcons 
            name="brain" 
            size={50} 
            color="#FFFFFF" 
          />
        </View>
      </Animated.View>
      
      {/* App Name & Tagline */}
      <Animated.View
        style={{
          alignItems: "center",
          marginTop: 28,
          opacity: textFadeAnim,
        }}
      >
        <Animated.Text
          style={{
            fontSize: 32,
            fontWeight: "700",
            color: colors.text,
            letterSpacing: -0.5,
            marginBottom: 6,
          }}
        >
          MindSets
        </Animated.Text>
        <Animated.Text
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          Your journey to mental wellness
        </Animated.Text>
      </Animated.View>
      
      {/* Simple Progress Bar */}
      <View style={{ 
        marginTop: 48, 
        width: 180,
        height: 4,
        backgroundColor: colors.progressBg,
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: colors.primary,
            borderRadius: 2,
            width: progressWidth,
          }}
        />
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
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
