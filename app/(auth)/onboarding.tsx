import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    FlatList,
    Pressable,
    StatusBar,
    Text,
    View,
    ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: readonly [string, string];
  features: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    emoji: "🧠",
    title: "Welcome to MindSets",
    subtitle: "Your Mental Wellness Journey",
    description:
      "Take the first step towards a healthier mind. Connect with licensed therapists who truly understand you.",
    gradient: ["#6366F1", "#8B5CF6"],
    features: ["Professional Support", "Safe & Confidential", "24/7 Available"],
  },
  {
    id: "2",
    emoji: "💬",
    title: "Talk Anytime, Anywhere",
    subtitle: "Therapy That Fits Your Life",
    description:
      "Chat, call, or video session with your therapist from the comfort of your home. No commute, no waiting rooms.",
    gradient: ["#10B981", "#059669"],
    features: ["Video Sessions", "Secure Chat", "Voice Calls"],
  },
  {
    id: "3",
    emoji: "🌟",
    title: "Your Journey, Your Pace",
    subtitle: "Personalized Care",
    description:
      "Get matched with therapists who specialize in your needs. Track your progress and celebrate your growth.",
    gradient: ["#EC4899", "#DB2777"],
    features: ["Smart Matching", "Progress Tracking", "Wellness Resources"],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const colors = {
    background: isDarkColorScheme ? "#0C0F17" : "#F8FAFF",
    surface: isDarkColorScheme ? "#1A1F2E" : "#FFFFFF",
    text: isDarkColorScheme ? "#FFFFFF" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    border: isDarkColorScheme ? "rgba(148, 163, 184, 0.1)" : "rgba(15, 23, 42, 0.06)",
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]) {
        setCurrentIndex(Number(viewableItems[0].index));
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem("@onboarding_completed", "true");
      router.replace("/(auth)/role-selection");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      router.replace("/(auth)/role-selection");
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("@onboarding_completed", "true");
    router.replace("/(auth)/role-selection");
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: "clamp",
    });

    return (
      <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 24 }}>
        <Animated.View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            opacity,
            transform: [{ scale }],
          }}
        >
          {/* Emoji with Gradient Background */}
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 140,
              height: 140,
              borderRadius: 40,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 40,
              shadowColor: item.gradient[0],
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.4,
              shadowRadius: 30,
              elevation: 20,
            }}
          >
            <Text style={{ fontSize: 72 }}>{item.emoji}</Text>
          </LinearGradient>

          {/* Title */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: colors.text,
              textAlign: "center",
              marginBottom: 8,
              letterSpacing: -0.5,
            }}
          >
            {item.title}
          </Text>

          {/* Subtitle with gradient text effect */}
          <Text
            style={{
              fontSize: 17,
              fontWeight: "600",
              color: item.gradient[0],
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            {item.subtitle}
          </Text>

          {/* Description */}
          <Text
            style={{
              fontSize: 16,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 26,
              maxWidth: 320,
              marginBottom: 32,
            }}
          >
            {item.description}
          </Text>

          {/* Feature Pills */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {item.features.map((feature, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDarkColorScheme
                    ? `${item.gradient[0]}20`
                    : `${item.gradient[0]}15`,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 24,
                  gap: 8,
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={item.gradient[0]}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: item.gradient[0],
                  }}
                >
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderDots = () => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 32,
      }}
    >
      {slides.map((_, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];

        const width = scrollX.interpolate({
          inputRange,
          outputRange: [8, 32, 8],
          extrapolate: "clamp",
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            key={index}
            style={{
              width,
              height: 8,
              borderRadius: 4,
              backgroundColor: slides[currentIndex].gradient[0],
              marginHorizontal: 4,
              opacity,
            }}
          />
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Skip Button */}
      <Animated.View
        style={{
          position: "absolute",
          top: 60,
          right: 24,
          zIndex: 10,
          opacity: fadeAnim,
        }}
      >
        <Pressable
          onPress={handleSkip}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: colors.textSecondary,
            }}
          >
            Skip
          </Text>
        </Pressable>
      </Animated.View>

      {/* Slides */}
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          scrollEventThrottle={16}
        />
      </Animated.View>

      {/* Bottom Section */}
      <Animated.View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 24,
          opacity: buttonAnim,
        }}
      >
        {renderDots()}

        {/* Continue Button */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <LinearGradient
            colors={slides[currentIndex].gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              paddingVertical: 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: slides[currentIndex].gradient[0],
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: "#FFFFFF",
                marginRight: 8,
              }}
            >
              {currentIndex === slides.length - 1 ? "Get Started" : "Continue"}
            </Text>
            <Ionicons
              name={currentIndex === slides.length - 1 ? "rocket" : "arrow-forward"}
              size={20}
              color="#FFFFFF"
            />
          </LinearGradient>
        </Pressable>

        {/* Sign In Link */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            Already have an account?{" "}
          </Text>
          <Pressable onPress={() => router.replace("/(auth)/sign-in")}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: slides[currentIndex].gradient[0],
              }}
            >
              Sign in
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
