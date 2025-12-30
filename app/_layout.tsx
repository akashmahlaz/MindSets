import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import { StreamProvider } from "@/context/StreamContext";
import { VideoProvider } from "@/context/VideoContext";
import { initializeSound } from "@/lib/SoundService";
import { useColorScheme } from "@/lib/useColorScheme";
import { setupVideoPushConfig } from "@/lib/videoPushConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

// Premium Animated Splash Screen Component
function SplashScreen({ onReady }: { onReady?: () => void }) {
  const { isDarkColorScheme } = useColorScheme();
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.3)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;
  const textFadeAnim = React.useRef(new Animated.Value(0)).current;
  const textSlideAnim = React.useRef(new Animated.Value(30)).current;
  const dotAnim1 = React.useRef(new Animated.Value(0)).current;
  const dotAnim2 = React.useRef(new Animated.Value(0)).current;
  const dotAnim3 = React.useRef(new Animated.Value(0)).current;
  const ringScale1 = React.useRef(new Animated.Value(0.8)).current;
  const ringScale2 = React.useRef(new Animated.Value(0.8)).current;
  const ringOpacity1 = React.useRef(new Animated.Value(0)).current;
  const ringOpacity2 = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide native splash screen
    SplashScreenModule.hideAsync();
    
    // Orchestrated animation sequence
    Animated.sequence([
      // Phase 1: Logo appears with scale + rotation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]),
      // Phase 2: Glow effect + text appears
      Animated.parallel([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(textSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous pulse animation for brain icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Expanding ring animations
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ringScale1, { toValue: 2.5, duration: 2000, useNativeDriver: true }),
            Animated.timing(ringOpacity1, { toValue: 0.6, duration: 200, useNativeDriver: true }),
          ]),
          Animated.timing(ringOpacity1, { toValue: 0, duration: 1800, useNativeDriver: true }),
          Animated.timing(ringScale1, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(1000),
          Animated.parallel([
            Animated.timing(ringScale2, { toValue: 2.5, duration: 2000, useNativeDriver: true }),
            Animated.timing(ringOpacity2, { toValue: 0.6, duration: 200, useNativeDriver: true }),
          ]),
          Animated.timing(ringOpacity2, { toValue: 0, duration: 1800, useNativeDriver: true }),
          Animated.timing(ringScale2, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Loading dots animation
    const animateDot = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      ).start();
    };
    animateDot(dotAnim1, 0);
    animateDot(dotAnim2, 200);
    animateDot(dotAnim3, 400);

    // Call onReady after animations settle
    const timer = setTimeout(() => {
      onReady?.();
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const colors = {
    background: isDarkColorScheme ? "#0F1117" : "#FFFFFF",
    primary: "#2AA79D",
    primaryLight: "#3DBDB3",
    primaryDark: "#248F87",
    text: isDarkColorScheme ? "#E5E7EB" : "#1F2937",
    textSecondary: isDarkColorScheme ? "#9CA3AF" : "#6B7280",
    glow: isDarkColorScheme ? "rgba(42, 167, 157, 0.3)" : "rgba(42, 167, 157, 0.2)",
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
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
      
      {/* Animated Logo Section */}
      <Animated.View
        style={{
          alignItems: "center",
          opacity: fadeAnim,
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
          ],
        }}
      >
        {/* Expanding Rings */}
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              position: 'absolute',
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 2,
              borderColor: colors.primary,
              opacity: ringOpacity1,
              transform: [{ scale: ringScale1 }],
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 2,
              borderColor: colors.primary,
              opacity: ringOpacity2,
              transform: [{ scale: ringScale2 }],
            }}
          />
        </View>

        {/* Main Logo Container */}
        <Animated.View
          style={{
            transform: [{ rotate: spin }],
          }}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryLight, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 36,
              padding: 4,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 15,
            }}
          >
            <Animated.View
              style={{
                flex: 1,
                borderRadius: 32,
                backgroundColor: colors.background,
                alignItems: "center",
                justifyContent: "center",
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              }}
            >
              {/* Brain Icon with Glow Effect */}
              <View style={{ position: 'relative' }}>
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: -5,
                    left: -5,
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.5],
                    }),
                  }}
                >
                  <MaterialCommunityIcons 
                    name="brain" 
                    size={62} 
                    color={colors.primary} 
                  />
                </Animated.View>
                <MaterialCommunityIcons 
                  name="brain" 
                  size={52} 
                  color={colors.primary} 
                />
              </View>
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      
      {/* App Name & Tagline */}
      <Animated.View
        style={{
          alignItems: "center",
          marginTop: 32,
          opacity: textFadeAnim,
          transform: [{ translateY: textSlideAnim }],
        }}
      >
        <Animated.Text
          style={{
            fontSize: 36,
            fontWeight: "800",
            color: colors.text,
            letterSpacing: -1,
            marginBottom: 8,
          }}
        >
          MindSets
        </Animated.Text>
        <Animated.Text
          style={{
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: "center",
            maxWidth: 280,
            lineHeight: 24,
          }}
        >
          Your journey to mental wellness
        </Animated.Text>
      </Animated.View>
      
      {/* Animated Loading Dots */}
      <View style={{ 
        flexDirection: 'row', 
        marginTop: 48, 
        gap: 8,
        alignItems: 'center',
      }}>
        {[dotAnim1, dotAnim2, dotAnim3].map((anim, i) => (
          <Animated.View
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.primary,
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [{
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              }],
            }}
          />
        ))}
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
