/**
 * M3 Expressive Animated Components
 * Shape morphing and motion physics following Material 3 Expressive guidelines
 */

import React, { useEffect } from "react";
import { Pressable, View, ViewStyle } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from "react-native-reanimated";

// Spring configurations for M3 Expressive motion physics
export const M3Springs = {
  // Snappy - for immediate interactions
  snappy: {
    damping: 20,
    stiffness: 400,
    mass: 0.5,
  },
  // Bouncy - for playful, expressive animations
  bouncy: {
    damping: 10,
    stiffness: 180,
    mass: 0.8,
  },
  // Smooth - for subtle, elegant transitions
  smooth: {
    damping: 25,
    stiffness: 120,
    mass: 1,
  },
  // Gentle - for calming, mental health appropriate
  gentle: {
    damping: 30,
    stiffness: 80,
    mass: 1.2,
  },
};

// Timing configurations for M3 motion
export const M3Timing = {
  emphasized: {
    duration: 500,
    easing: Easing.bezier(0.2, 0, 0, 1),
  },
  emphasizedDecelerate: {
    duration: 400,
    easing: Easing.bezier(0.05, 0.7, 0.1, 1),
  },
  emphasizedAccelerate: {
    duration: 200,
    easing: Easing.bezier(0.3, 0, 0.8, 0.15),
  },
  standard: {
    duration: 300,
    easing: Easing.bezier(0.2, 0, 0, 1),
  },
  standardDecelerate: {
    duration: 250,
    easing: Easing.bezier(0, 0, 0, 1),
  },
  standardAccelerate: {
    duration: 200,
    easing: Easing.bezier(0.3, 0, 1, 1),
  },
};

/**
 * M3 Shape Morphing Button
 * Animates between rounded rectangle and pill shape on press
 */
interface M3MorphButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  morphIntensity?: number; // 0-1, how much the shape morphs
  color?: string;
}

export function M3MorphButton({
  children,
  onPress,
  style,
  morphIntensity = 0.3,
  color = "#2AA79D",
}: M3MorphButtonProps) {
  const pressed = useSharedValue(0);
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    const baseBorderRadius = 16;
    const morphedRadius = baseBorderRadius * (1 + morphIntensity * pressed.value);
    
    return {
      transform: [{ scale: scale.value }],
      borderRadius: morphedRadius,
    };
  });
  
  const handlePressIn = () => {
    pressed.value = withSpring(1, M3Springs.snappy);
    scale.value = withSpring(0.96, M3Springs.snappy);
  };
  
  const handlePressOut = () => {
    pressed.value = withSpring(0, M3Springs.bouncy);
    scale.value = withSpring(1, M3Springs.bouncy);
  };
  
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            backgroundColor: color,
            paddingVertical: 14,
            paddingHorizontal: 24,
            alignItems: "center",
            justifyContent: "center",
          },
          animatedStyle,
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

/**
 * M3 Floating Action Button with shape morphing
 */
interface M3FABProps {
  children: React.ReactNode;
  onPress?: () => void;
  size?: "small" | "medium" | "large";
  color?: string;
  style?: ViewStyle;
}

export function M3FAB({
  children,
  onPress,
  size = "medium",
  color = "#2AA79D",
  style,
}: M3FABProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  const sizes = {
    small: 40,
    medium: 56,
    large: 96,
  };
  
  const fabSize = sizes[size];
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.9, M3Springs.snappy);
    rotation.value = withSpring(-5, M3Springs.snappy);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, M3Springs.bouncy);
    rotation.value = withSpring(0, M3Springs.bouncy);
  };
  
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            width: fabSize,
            height: fabSize,
            borderRadius: size === "large" ? 28 : fabSize / 2,
            backgroundColor: color,
            alignItems: "center",
            justifyContent: "center",
            elevation: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.27,
            shadowRadius: 4.65,
          },
          animatedStyle,
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

/**
 * M3 Card with enter animation and hover/press effects
 */
interface M3CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  delay?: number;
  style?: ViewStyle;
}

export function M3Card({
  children,
  onPress,
  delay = 0,
  style,
}: M3CardProps) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withSpring(0, M3Springs.gentle)
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300 })
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.98, M3Springs.snappy);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, M3Springs.bouncy);
  };
  
  const content = (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
  
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </Pressable>
    );
  }
  
  return content;
}

/**
 * M3 Staggered List Animation
 * Animates children with staggered entrance
 */
interface M3StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  style?: ViewStyle;
}

export function M3StaggeredList({
  children,
  staggerDelay = 50,
  style,
}: M3StaggeredListProps) {
  return (
    <View style={style}>
      {React.Children.map(children, (child, index) => (
        <M3Card delay={index * staggerDelay}>
          {child}
        </M3Card>
      ))}
    </View>
  );
}

/**
 * M3 Page Transition Wrapper
 * Provides smooth page entrance animation
 */
interface M3PageTransitionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function M3PageTransition({
  children,
  style,
}: M3PageTransitionProps) {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    translateY.value = withSpring(0, M3Springs.gentle);
    opacity.value = withTiming(1, M3Timing.emphasized);
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
    flex: 1,
  }));
  
  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * M3 Breathing Animation (great for mental health apps)
 * Expands and contracts gently to guide breathing
 */
interface M3BreathingCircleProps {
  size?: number;
  color?: string;
  duration?: number; // Full breath cycle in ms
  style?: ViewStyle;
}

export function M3BreathingCircle({
  size = 120,
  color = "#2AA79D",
  duration = 8000,
  style,
}: M3BreathingCircleProps) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.3);
  
  useEffect(() => {
    const halfDuration = duration / 2;
    
    scale.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: halfDuration,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
        withTiming(0.6, {
          duration: halfDuration,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        })
      ),
      -1,
      false
    );
    
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: halfDuration }),
        withTiming(0.3, { duration: halfDuration })
      ),
      -1,
      false
    );
  }, [duration]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/**
 * M3 Ripple Effect (for touch feedback)
 */
interface M3RippleProps {
  children: React.ReactNode;
  color?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export function M3Ripple({
  children,
  color = "rgba(42, 167, 157, 0.2)",
  style,
  onPress,
}: M3RippleProps) {
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  
  const rippleStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    width: "100%",
    height: "100%",
    borderRadius: 1000,
    backgroundColor: color,
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));
  
  const handlePress = () => {
    rippleScale.value = 0;
    rippleOpacity.value = 1;
    
    rippleScale.value = withTiming(2, M3Timing.standard);
    rippleOpacity.value = withDelay(
      100,
      withTiming(0, { duration: 400 })
    );
    
    onPress?.();
  };
  
  return (
    <Pressable onPress={handlePress} style={[{ overflow: "hidden" }, style]}>
      <Animated.View style={rippleStyle} />
      {children}
    </Pressable>
  );
}

export default {
  Springs: M3Springs,
  Timing: M3Timing,
  MorphButton: M3MorphButton,
  FAB: M3FAB,
  Card: M3Card,
  StaggeredList: M3StaggeredList,
  PageTransition: M3PageTransition,
  BreathingCircle: M3BreathingCircle,
  Ripple: M3Ripple,
};
