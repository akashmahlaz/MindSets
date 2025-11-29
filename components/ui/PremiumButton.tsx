/**
 * Premium Button Component
 * World-class button with gradients, haptics, and smooth animations
 * Inspired by Apple, Google, and leading design systems
 */

import { haptics } from "@/lib/haptics";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    Pressable,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";

export interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "xl";
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  gradient?: boolean;
  gradientColors?: [string, string];
  hapticFeedback?: "light" | "medium" | "heavy" | "none";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  gradient = true,
  gradientColors,
  hapticFeedback = "medium",
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    
    // Haptic feedback
    if (hapticFeedback !== "none") {
      haptics[hapticFeedback]();
    }
    
    onPress();
  }, [disabled, loading, hapticFeedback, onPress]);

  // Size configurations
  const sizeConfig = {
    sm: { height: 40, paddingHorizontal: 16, fontSize: 14, iconSize: 16, borderRadius: 10 },
    md: { height: 48, paddingHorizontal: 20, fontSize: 15, iconSize: 18, borderRadius: 12 },
    lg: { height: 56, paddingHorizontal: 24, fontSize: 16, iconSize: 20, borderRadius: 14 },
    xl: { height: 64, paddingHorizontal: 32, fontSize: 17, iconSize: 22, borderRadius: 16 },
  };

  // Color configurations
  const colorConfig = {
    primary: {
      gradient: gradientColors || ["#2AA79D", "#3A9C94"],
      background: "#2AA79D",
      text: "#FFFFFF",
      border: "transparent",
    },
    secondary: {
      gradient: ["#3A9C94", "#248F87"],
      background: "#3A9C94",
      text: "#FFFFFF",
      border: "transparent",
    },
    outline: {
      gradient: ["transparent", "transparent"],
      background: "transparent",
      text: "#2AA79D",
      border: "#2AA79D",
    },
    ghost: {
      gradient: ["transparent", "transparent"],
      background: "transparent",
      text: "#2AA79D",
      border: "transparent",
    },
    destructive: {
      gradient: ["#EF4444", "#DC2626"],
      background: "#EF4444",
      text: "#FFFFFF",
      border: "transparent",
    },
  };

  const currentSize = sizeConfig[size];
  const currentColor = colorConfig[variant];
  const isGradient = gradient && variant !== "outline" && variant !== "ghost";
  const isDisabled = disabled || loading;

  const buttonContent = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={currentColor.text} 
        />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <Ionicons
              name={icon}
              size={currentSize.iconSize}
              color={currentColor.text}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.text,
              {
                fontSize: currentSize.fontSize,
                color: currentColor.text,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === "right" && (
            <Ionicons
              name={icon}
              size={currentSize.iconSize}
              color={currentColor.text}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  const containerStyle: ViewStyle = {
    height: currentSize.height,
    paddingHorizontal: currentSize.paddingHorizontal,
    borderRadius: currentSize.borderRadius,
    borderWidth: variant === "outline" ? 2 : 0,
    borderColor: currentColor.border,
    backgroundColor: isGradient ? "transparent" : currentColor.background,
    opacity: isDisabled ? 0.5 : 1,
    width: fullWidth ? "100%" : undefined,
    alignSelf: fullWidth ? "stretch" : "flex-start",
    overflow: "hidden",
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && { width: "100%" },
        style,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={containerStyle}
      >
        {isGradient ? (
          <LinearGradient
            colors={currentColor.gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: currentSize.borderRadius },
            ]}
          />
        ) : null}
        {buttonContent}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export { PremiumButton };
export default PremiumButton;
