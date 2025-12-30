/**
 * Material 3 Expressive Progress Indicators
 * Following M3 Expressive design guidelines with wave animations
 */

import { useColorScheme } from "@/lib/useColorScheme";
import React, { useEffect } from "react";
import { View, ViewStyle } from "react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

interface M3ProgressIndicatorProps {
  size?: "small" | "medium" | "large";
  color?: string;
  style?: ViewStyle;
}

/**
 * M3 Expressive Circular Progress Indicator
 * Features wave-like motion physics animation
 */
export function M3CircularProgress({
  size = "medium",
  color,
  style,
}: M3ProgressIndicatorProps) {
  const { isDarkColorScheme } = useColorScheme();
  const primaryColor = color || "#2AA79D";
  
  const sizes = {
    small: { container: 24, dot: 4 },
    medium: { container: 40, dot: 6 },
    large: { container: 56, dot: 8 },
  };
  
  const { container: containerSize, dot: dotSize } = sizes[size];
  const radius = (containerSize - dotSize) / 2;
  
  // Create 3 animated dots with staggered animations
  const dots = [0, 1, 2].map((index) => {
    const progress = useSharedValue(0);
    
    useEffect(() => {
      progress.value = withDelay(
        index * 150,
        withRepeat(
          withSequence(
            withSpring(1, {
              damping: 12,
              stiffness: 100,
              mass: 0.5,
            }),
            withSpring(0, {
              damping: 12,
              stiffness: 100,
              mass: 0.5,
            })
          ),
          -1,
          false
        )
      );
    }, []);
    
    const animatedStyle = useAnimatedStyle(() => {
      const angle = (index * 120 + progress.value * 360) * (Math.PI / 180);
      const scale = interpolate(progress.value, [0, 0.5, 1], [0.8, 1.2, 0.8]);
      const opacity = interpolate(progress.value, [0, 0.5, 1], [0.4, 1, 0.4]);
      
      return {
        transform: [
          { translateX: Math.cos(angle) * radius },
          { translateY: Math.sin(angle) * radius },
          { scale },
        ],
        opacity,
      };
    });
    
    return { progress, animatedStyle };
  });
  
  return (
    <View
      style={[
        {
          width: containerSize,
          height: containerSize,
          justifyContent: "center",
          alignItems: "center",
        },
        style,
      ]}
    >
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            {
              position: "absolute",
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: primaryColor,
            },
            dot.animatedStyle,
          ]}
        />
      ))}
    </View>
  );
}

/**
 * M3 Expressive Wave Progress Indicator
 * Features horizontal wave motion
 */
export function M3WaveProgress({
  size = "medium",
  color,
  style,
}: M3ProgressIndicatorProps) {
  const { isDarkColorScheme } = useColorScheme();
  const primaryColor = color || "#2AA79D";
  
  const sizes = {
    small: { bar: 4, gap: 3, count: 4 },
    medium: { bar: 6, gap: 4, count: 5 },
    large: { bar: 8, gap: 5, count: 6 },
  };
  
  const { bar: barWidth, gap, count } = sizes[size];
  const maxHeight = size === "small" ? 20 : size === "medium" ? 28 : 36;
  
  const bars = Array.from({ length: count }).map((_, index) => {
    const height = useSharedValue(0.3);
    
    useEffect(() => {
      height.value = withDelay(
        index * 100,
        withRepeat(
          withSequence(
            withTiming(1, {
              duration: 400,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
            }),
            withTiming(0.3, {
              duration: 400,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
            })
          ),
          -1,
          false
        )
      );
    }, []);
    
    const animatedStyle = useAnimatedStyle(() => ({
      height: height.value * maxHeight,
      opacity: interpolate(height.value, [0.3, 1], [0.5, 1]),
    }));
    
    return animatedStyle;
  });
  
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          height: maxHeight,
          gap,
        },
        style,
      ]}
    >
      {bars.map((animatedStyle, index) => (
        <Animated.View
          key={index}
          style={[
            {
              width: barWidth,
              borderRadius: barWidth / 2,
              backgroundColor: primaryColor,
            },
            animatedStyle,
          ]}
        />
      ))}
    </View>
  );
}

/**
 * M3 Expressive Pulse Progress Indicator
 * Features expanding circle with spring physics
 */
export function M3PulseProgress({
  size = "medium",
  color,
  style,
}: M3ProgressIndicatorProps) {
  const { isDarkColorScheme } = useColorScheme();
  const primaryColor = color || "#2AA79D";
  
  const sizes = {
    small: 24,
    medium: 40,
    large: 56,
  };
  
  const containerSize = sizes[size];
  
  const scale1 = useSharedValue(0.5);
  const scale2 = useSharedValue(0.5);
  const opacity1 = useSharedValue(1);
  const opacity2 = useSharedValue(0);
  
  useEffect(() => {
    // First ring
    scale1.value = withRepeat(
      withTiming(1.5, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity1.value = withRepeat(
      withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    
    // Second ring (delayed)
    setTimeout(() => {
      scale2.value = withRepeat(
        withTiming(1.5, { duration: 1200, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      opacity2.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 0 }),
          withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
    }, 600);
  }, []);
  
  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));
  
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));
  
  return (
    <View
      style={[
        {
          width: containerSize * 1.5,
          height: containerSize * 1.5,
          justifyContent: "center",
          alignItems: "center",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            borderWidth: 2,
            borderColor: primaryColor,
          },
          ring1Style,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            borderWidth: 2,
            borderColor: primaryColor,
          },
          ring2Style,
        ]}
      />
      <View
        style={{
          width: containerSize * 0.4,
          height: containerSize * 0.4,
          borderRadius: containerSize * 0.2,
          backgroundColor: primaryColor,
        }}
      />
    </View>
  );
}

/**
 * M3 Expressive Linear Progress Indicator
 * Features smooth wave animation along the track
 */
interface M3LinearProgressProps {
  progress?: number; // 0-100, undefined for indeterminate
  color?: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
}

export function M3LinearProgress({
  progress,
  color,
  trackColor,
  height = 4,
  style,
}: M3LinearProgressProps) {
  const { isDarkColorScheme } = useColorScheme();
  const primaryColor = color || "#2AA79D";
  const track = trackColor || (isDarkColorScheme ? "rgba(42, 167, 157, 0.2)" : "rgba(42, 167, 157, 0.15)");
  
  const translateX = useSharedValue(-100);
  
  useEffect(() => {
    if (progress === undefined) {
      // Indeterminate animation
      translateX.value = withRepeat(
        withTiming(100, {
          duration: 1500,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
        -1,
        false
      );
    }
  }, [progress]);
  
  const animatedStyle = useAnimatedStyle(() => {
    if (progress !== undefined) {
      return {
        width: `${progress}%`,
        transform: [{ translateX: 0 }],
      };
    }
    return {
      width: "30%",
      transform: [{ translateX: `${translateX.value}%` }],
    };
  });
  
  return (
    <View
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: track,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height: "100%",
            borderRadius: height / 2,
            backgroundColor: primaryColor,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

export default {
  Circular: M3CircularProgress,
  Wave: M3WaveProgress,
  Pulse: M3PulseProgress,
  Linear: M3LinearProgress,
};
