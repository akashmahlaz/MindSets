import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRootNavigationState, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Image imports
const firstOnboardingImage = require("@/assets/images/First Onboarding Screen.png");
const counselorTopLeft = require("@/assets/images/img1.png");
const counselorTopRight = require("@/assets/images/img2.png");
const counselorBottomLeft = require("@/assets/images/img3.png");
const counselorBottomRight = require("@/assets/images/img4.png");

// Design tokens
const COLORS = {
  primary: "#007f80", // Darker teal from mockup
  background: "#F5F8F8", // Background light from mockup
  text: "#0c1d1d", // Text main light from mockup
  textSecondary: "#4a5b5b", // Text sub light from mockup
  textMuted: "rgba(12, 29, 29, 0.4)", // Text sub light with opacity
  white: "#FFFFFF",
  iconBackground: "rgba(0, 127, 128, 0.1)", // Primary with 10% opacity
  dotInactive: "rgba(0, 127, 128, 0.3)", // Primary with 30% opacity
};

interface OnboardingSlide {
  id: string;
  type: "image" | "counselors" | "privacy";
  title: string;
  subtitle: string;
  buttonText: string;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    type: "image",
    title: "A safe space for your mind",
    subtitle: "You don't have to carry it all alone.",
    buttonText: "Next",
  },
  {
    id: "2",
    type: "counselors",
    title: "Connect with licensed counselors who understand your journey.",
    subtitle: "Expert support, tailored to your needs, available anytime.",
    buttonText: "Find a Counselor",
  },
  {
    id: "3",
    type: "privacy",
    title: "Your Healing is Private",
    subtitle: "Private, secure, and judgment-free.\nYour healing is our priority.",
    buttonText: "Ready to take the first step\ntoward feeling better?",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Check if navigation is ready
  const isNavigationReady = navigationState?.key != null;

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
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem("@onboarding_completed", "true");
      if (isNavigationReady) {
        router.replace("/(auth)/role-selection");
      }
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      if (isNavigationReady) {
        router.replace("/(auth)/role-selection");
      }
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("@onboarding_completed", "true");
    if (isNavigationReady) {
      router.replace("/(auth)/role-selection");
    }
  };

  // Screen 1: Main illustration
  const renderImageSlide = () => (
    <View style={styles.slideContent}>
      <View style={styles.imageContainer}>
        <Image
          source={firstOnboardingImage}
          style={styles.mainImage}
          resizeMode="cover"
        />
      </View>
    </View>
  );

  // Screen 2: Counselor photos grid - Staggered organic layout
  const renderCounselorsSlide = () => (
    <View style={styles.slideContent}>
      <View style={styles.counselorsContainer}>
        {/* Decorative blur background */}
        <View style={styles.counselorsBlurBg} />
        
        {/* Grid Layout */}
        <View style={styles.counselorsGrid}>
          {/* Top Row */}
          <View style={styles.counselorRow}>
            {/* Avatar 1 - Top Left (larger, pushed right, with top padding) */}
            <View style={styles.counselorCell1}>
              <View style={[styles.counselorWrapper, styles.counselorSize1]}>
                <Image source={counselorTopLeft} style={styles.counselorImage} />
              </View>
            </View>
            {/* Avatar 2 - Top Right (medium, pushed left) */}
            <View style={styles.counselorCell2}>
              <View style={[styles.counselorWrapper, styles.counselorSize2]}>
                <Image source={counselorTopRight} style={styles.counselorImage} />
              </View>
            </View>
          </View>
          
          {/* Bottom Row */}
          <View style={styles.counselorRow}>
            {/* Avatar 3 - Bottom Left (smaller, pushed right) */}
            <View style={styles.counselorCell3}>
              <View style={[styles.counselorWrapper, styles.counselorSize3]}>
                <Image source={counselorBottomLeft} style={styles.counselorImage} />
              </View>
            </View>
            {/* Avatar 4 - Bottom Right (larger, pushed left, with bottom padding) */}
            <View style={styles.counselorCell4}>
              <View style={[styles.counselorWrapper, styles.counselorSize4]}>
                <Image source={counselorBottomRight} style={styles.counselorImage} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // Screen 3: Privacy lock icon - Centered hero layout
  const renderPrivacySlide = () => (
    <View style={styles.slideContent}>
      <View style={styles.privacyContainer}>
        <View style={styles.lockIconContainer}>
          <Ionicons name="lock-closed" size={80} color="#007f80" />
        </View>
      </View>
    </View>
  );

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={styles.slide}>
        {/* Visual Content */}
        {item.type === "image" && renderImageSlide()}
        {item.type === "counselors" && renderCounselorsSlide()}
        {item.type === "privacy" && renderPrivacySlide()}

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            item.type === "counselors" && styles.titleSmaller
          ]}>
            {item.title}
          </Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              isActive ? styles.dotActive : styles.dotInactive,
            ]}
          />
        );
      })}
    </View>
  );

  const handlePrivacyPress = () => {
    if (isNavigationReady) {
      try {
        router.push("/(resources)/privacy-policy");
      } catch (error) {
        console.log("Navigation error:", error);
      }
    }
  };

  const handleTermsPress = () => {
    if (isNavigationReady) {
      try {
        router.push("/(resources)/terms");
      } catch (error) {
        console.log("Navigation error:", error);
      }
    }
  };

  const renderFooterLinks = () => {
    if (currentIndex !== slides.length - 1) return null;
    
    return (
      <View style={styles.footerLinks}>
        <Pressable onPress={handlePrivacyPress}>
          <Text style={styles.footerLinkText}>Privacy Policy</Text>
        </Pressable>
        <Text style={styles.footerDot}>•</Text>
        <Pressable onPress={handleTermsPress}>
          <Text style={styles.footerLinkText}>Terms of Service</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F8F8" />

      {/* Skip Button - Only show on first two screens */}
      {currentIndex < slides.length - 1 && (
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}                                                                                                                                                                                                                                

      {/* Page Indicator at top for privacy screen */}
      {currentIndex === slides.length - 1 && (
        <View style={styles.topDotsContainer}>
          {renderDots()}
        </View>
      )}

      {/* Slides */}
      <View style={styles.slidesWrapper}>
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
          style={styles.flatList}
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Dots - Show for first two screens */}
        {currentIndex < slides.length - 1 && renderDots()}

        {/* Action Button */}
        <Pressable
          className="bg-[#007f80] rounded-full py-4 px-6 flex-row items-center justify-center shadow-lg active:opacity-90 active:scale-[0.98]"
          onPress={handleNext}
        >
          <Text className="text-white text-base font-bold text-center">
            {slides[currentIndex].buttonText}
          </Text>
          {currentIndex < slides.length - 1 && (
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" className="ml-2" />
          )}
        </Pressable>

        {/* Footer Links for last screen */}
        {renderFooterLinks()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8F8",
  },
  skipButton: {
    position: "absolute",
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007f80",
  },
  topDotsContainer: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  slidesWrapper: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 24,
  },
  slideContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Screen 1: Main Image
  imageContainer: {
    width: SCREEN_WIDTH - 48,
    height: SCREEN_WIDTH - 48,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },

  // Screen 2: Counselors Grid - Staggered organic layout
  counselorsContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 320,
    position: "relative",
  },
  counselorsBlurBg: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "120%",
    height: "120%",
    backgroundColor: "rgba(42, 167, 157, 0.05)",
    borderRadius: 200,
    transform: [{ translateX: -192 }, { translateY: -192 }],
  },
  counselorsGrid: {
    width: "100%",
    gap: 16,
  },
  counselorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  // Cell positioning for staggered effect
  counselorCell1: {
    flex: 1,
    alignItems: "flex-end",
    paddingTop: 32,
  },
  counselorCell2: {
    flex: 1,
    alignItems: "flex-start",
  },
  counselorCell3: {
    flex: 1,
    alignItems: "flex-end",
  },
  counselorCell4: {
    flex: 1,
    alignItems: "flex-start",
    paddingBottom: 16,
  },
  // Base wrapper style
  counselorWrapper: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  // Different sizes for organic feel
  counselorSize1: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  counselorSize2: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  counselorSize3: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  counselorSize4: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  counselorImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  // Screen 3: Privacy - Hero centered layout
  privacyContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  lockIconContainer: {
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: "rgba(0, 127, 128, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },

  // Text Content
  textContainer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0c1d1d",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 36,
  },
  titleSmaller: {
    fontSize: 26,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: "#4a5b5b",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },

  // Bottom Section
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 32,
    backgroundColor: "#007f80",
  },
  dotInactive: {
    width: 8,
    backgroundColor: "rgba(0, 127, 128, 0.3)",
  },

  // Action Button
  actionButton: {
    backgroundColor: "#007f80",
    borderRadius: 9999,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007f80",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },

  // Footer Links
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  footerLinkText: {
    fontSize: 14,
    color: "rgba(12, 29, 29, 0.4)",
  },
  footerDot: {
    fontSize: 14,
    color: "rgba(12, 29, 29, 0.4)",
    marginHorizontal: 12,
  },
});
