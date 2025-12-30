/**
 * Material Symbols Icon Component
 * Using @expo/vector-icons with Material Design icon naming
 * 
 * This provides a unified icon API following Material 3 guidelines
 * Supports both filled and outlined variants
 */

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";

// Map Material Symbol names to available icon sets
// Priority: MaterialCommunityIcons (most M3 compatible) > Ionicons

type IconVariant = "filled" | "outlined" | "rounded" | "sharp";

interface M3IconProps {
  name: M3IconName;
  size?: number;
  color?: string;
  variant?: IconVariant;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

// Common icon mappings for mental health app
// Material Symbol name -> { mci: MaterialCommunityIcons name, ion: Ionicons name }
const ICON_MAP = {
  // Navigation
  "home": { mci: "home", ion: "home" },
  "home-outline": { mci: "home-outline", ion: "home-outline" },
  "search": { mci: "magnify", ion: "search" },
  "settings": { mci: "cog", ion: "settings" },
  "settings-outline": { mci: "cog-outline", ion: "settings-outline" },
  "menu": { mci: "menu", ion: "menu" },
  "close": { mci: "close", ion: "close" },
  "arrow-back": { mci: "arrow-left", ion: "arrow-back" },
  "arrow-forward": { mci: "arrow-right", ion: "arrow-forward" },
  "chevron-right": { mci: "chevron-right", ion: "chevron-forward" },
  "chevron-left": { mci: "chevron-left", ion: "chevron-back" },
  "chevron-down": { mci: "chevron-down", ion: "chevron-down" },
  "chevron-up": { mci: "chevron-up", ion: "chevron-up" },
  
  // User & Profile
  "person": { mci: "account", ion: "person" },
  "person-outline": { mci: "account-outline", ion: "person-outline" },
  "people": { mci: "account-group", ion: "people" },
  "people-outline": { mci: "account-group-outline", ion: "people-outline" },
  "account-circle": { mci: "account-circle", ion: "person-circle" },
  
  // Communication
  "chat": { mci: "chat", ion: "chatbubble" },
  "chat-outline": { mci: "chat-outline", ion: "chatbubble-outline" },
  "chatbubbles": { mci: "forum", ion: "chatbubbles" },
  "chatbubbles-outline": { mci: "forum-outline", ion: "chatbubbles-outline" },
  "message": { mci: "message", ion: "mail" },
  "message-outline": { mci: "message-outline", ion: "mail-outline" },
  "send": { mci: "send", ion: "send" },
  "call": { mci: "phone", ion: "call" },
  "call-outline": { mci: "phone-outline", ion: "call-outline" },
  "videocam": { mci: "video", ion: "videocam" },
  "videocam-outline": { mci: "video-outline", ion: "videocam-outline" },
  
  // Calendar & Time
  "calendar": { mci: "calendar", ion: "calendar" },
  "calendar-outline": { mci: "calendar-outline", ion: "calendar-outline" },
  "time": { mci: "clock", ion: "time" },
  "time-outline": { mci: "clock-outline", ion: "time-outline" },
  "schedule": { mci: "calendar-clock", ion: "calendar" },
  
  // Mental Health Specific
  "heart": { mci: "heart", ion: "heart" },
  "heart-outline": { mci: "heart-outline", ion: "heart-outline" },
  "brain": { mci: "brain", ion: "fitness" },
  "meditation": { mci: "meditation", ion: "leaf" },
  "self-care": { mci: "spa", ion: "flower" },
  "mood": { mci: "emoticon", ion: "happy" },
  "mood-outline": { mci: "emoticon-outline", ion: "happy-outline" },
  "journal": { mci: "notebook", ion: "journal" },
  "journal-outline": { mci: "notebook-outline", ion: "journal-outline" },
  
  // Actions
  "add": { mci: "plus", ion: "add" },
  "add-circle": { mci: "plus-circle", ion: "add-circle" },
  "add-circle-outline": { mci: "plus-circle-outline", ion: "add-circle-outline" },
  "edit": { mci: "pencil", ion: "create" },
  "edit-outline": { mci: "pencil-outline", ion: "create-outline" },
  "delete": { mci: "delete", ion: "trash" },
  "delete-outline": { mci: "delete-outline", ion: "trash-outline" },
  "save": { mci: "content-save", ion: "save" },
  "save-outline": { mci: "content-save-outline", ion: "save-outline" },
  "share": { mci: "share-variant", ion: "share" },
  "share-outline": { mci: "share-variant-outline", ion: "share-outline" },
  "copy": { mci: "content-copy", ion: "copy" },
  "copy-outline": { mci: "content-copy", ion: "copy-outline" },
  
  // Status & Feedback
  "check": { mci: "check", ion: "checkmark" },
  "check-circle": { mci: "check-circle", ion: "checkmark-circle" },
  "check-circle-outline": { mci: "check-circle-outline", ion: "checkmark-circle-outline" },
  "checkmark-done": { mci: "check-all", ion: "checkmark-done" },
  "checkmark-done-outline": { mci: "check-all", ion: "checkmark-done-outline" },
  "close-circle": { mci: "close-circle", ion: "close-circle" },
  "close-circle-outline": { mci: "close-circle-outline", ion: "close-circle-outline" },
  "warning": { mci: "alert", ion: "warning" },
  "warning-outline": { mci: "alert-outline", ion: "warning-outline" },
  "error": { mci: "alert-circle", ion: "alert-circle" },
  "error-outline": { mci: "alert-circle-outline", ion: "alert-circle-outline" },
  "info": { mci: "information", ion: "information-circle" },
  "info-outline": { mci: "information-outline", ion: "information-circle-outline" },
  "help": { mci: "help-circle", ion: "help-circle" },
  "help-outline": { mci: "help-circle-outline", ion: "help-circle-outline" },
  
  // Media
  "camera": { mci: "camera", ion: "camera" },
  "camera-outline": { mci: "camera-outline", ion: "camera-outline" },
  "image": { mci: "image", ion: "image" },
  "image-outline": { mci: "image-outline", ion: "image-outline" },
  "images": { mci: "image-multiple", ion: "images" },
  "images-outline": { mci: "image-multiple-outline", ion: "images-outline" },
  "mic": { mci: "microphone", ion: "mic" },
  "mic-outline": { mci: "microphone-outline", ion: "mic-outline" },
  "mic-off": { mci: "microphone-off", ion: "mic-off" },
  "mic-off-outline": { mci: "microphone-off", ion: "mic-off-outline" },
  "play": { mci: "play", ion: "play" },
  "play-outline": { mci: "play-outline", ion: "play-outline" },
  "pause": { mci: "pause", ion: "pause" },
  "stop": { mci: "stop", ion: "stop" },
  "volume-high": { mci: "volume-high", ion: "volume-high" },
  "volume-mute": { mci: "volume-mute", ion: "volume-mute" },
  
  // Documents & Files
  "document": { mci: "file-document", ion: "document" },
  "document-outline": { mci: "file-document-outline", ion: "document-outline" },
  "document-text": { mci: "file-document", ion: "document-text" },
  "document-text-outline": { mci: "file-document-outline", ion: "document-text-outline" },
  "attach": { mci: "attachment", ion: "attach" },
  "folder": { mci: "folder", ion: "folder" },
  "folder-outline": { mci: "folder-outline", ion: "folder-outline" },
  
  // Misc
  "star": { mci: "star", ion: "star" },
  "star-outline": { mci: "star-outline", ion: "star-outline" },
  "bookmark": { mci: "bookmark", ion: "bookmark" },
  "bookmark-outline": { mci: "bookmark-outline", ion: "bookmark-outline" },
  "notifications": { mci: "bell", ion: "notifications" },
  "notifications-outline": { mci: "bell-outline", ion: "notifications-outline" },
  "notifications-off": { mci: "bell-off", ion: "notifications-off" },
  "notifications-off-outline": { mci: "bell-off-outline", ion: "notifications-off-outline" },
  "flash": { mci: "flash", ion: "flash" },
  "flash-outline": { mci: "flash-outline", ion: "flash-outline" },
  "shield": { mci: "shield", ion: "shield" },
  "shield-checkmark": { mci: "shield-check", ion: "shield-checkmark" },
  "shield-checkmark-outline": { mci: "shield-check-outline", ion: "shield-checkmark-outline" },
  "lock": { mci: "lock", ion: "lock-closed" },
  "lock-outline": { mci: "lock-outline", ion: "lock-closed-outline" },
  "eye": { mci: "eye", ion: "eye" },
  "eye-outline": { mci: "eye-outline", ion: "eye-outline" },
  "eye-off": { mci: "eye-off", ion: "eye-off" },
  "eye-off-outline": { mci: "eye-off-outline", ion: "eye-off-outline" },
  "link": { mci: "link", ion: "link" },
  "location": { mci: "map-marker", ion: "location" },
  "location-outline": { mci: "map-marker-outline", ion: "location-outline" },
  "globe": { mci: "earth", ion: "globe" },
  "globe-outline": { mci: "earth", ion: "globe-outline" },
  "moon": { mci: "moon-waning-crescent", ion: "moon" },
  "moon-outline": { mci: "moon-waning-crescent", ion: "moon-outline" },
  "sunny": { mci: "white-balance-sunny", ion: "sunny" },
  "sunny-outline": { mci: "white-balance-sunny", ion: "sunny-outline" },
  "refresh": { mci: "refresh", ion: "refresh" },
  "refresh-outline": { mci: "refresh", ion: "refresh-outline" },
  "sync": { mci: "sync", ion: "sync" },
  "download": { mci: "download", ion: "download" },
  "download-outline": { mci: "download-outline", ion: "download-outline" },
  "upload": { mci: "upload", ion: "cloud-upload" },
  "upload-outline": { mci: "upload-outline", ion: "cloud-upload-outline" },
  "logout": { mci: "logout", ion: "log-out" },
  "logout-outline": { mci: "logout", ion: "log-out-outline" },
  "login": { mci: "login", ion: "log-in" },
  "login-outline": { mci: "login", ion: "log-in-outline" },
  
  // Therapy specific
  "medical": { mci: "medical-bag", ion: "medical" },
  "medical-outline": { mci: "medical-bag", ion: "medical-outline" },
  "pulse": { mci: "pulse", ion: "pulse" },
  "pulse-outline": { mci: "pulse", ion: "pulse-outline" },
  "fitness": { mci: "run", ion: "fitness" },
  "fitness-outline": { mci: "run", ion: "fitness-outline" },
  "bed": { mci: "bed", ion: "bed" },
  "bed-outline": { mci: "bed-outline", ion: "bed-outline" },
  "cafe": { mci: "coffee", ion: "cafe" },
  "cafe-outline": { mci: "coffee-outline", ion: "cafe-outline" },
  "leaf": { mci: "leaf", ion: "leaf" },
  "leaf-outline": { mci: "leaf", ion: "leaf-outline" },
  "water": { mci: "water", ion: "water" },
  "water-outline": { mci: "water-outline", ion: "water-outline" },
} as const;

export type M3IconName = keyof typeof ICON_MAP;

/**
 * Material 3 Icon Component
 * Provides consistent icons across the app with M3 naming conventions
 */
export function M3Icon({
  name,
  size = 24,
  color = "#000",
  variant = "outlined",
  style,
  containerStyle,
}: M3IconProps) {
  const iconConfig = ICON_MAP[name];
  
  if (!iconConfig) {
    console.warn(`M3Icon: Unknown icon name "${name}"`);
    return null;
  }
  
  // Try MaterialCommunityIcons first (better M3 support)
  // Fall back to Ionicons if needed
  const useMCI = true; // Can be toggled for preference
  
  const IconComponent = useMCI ? MaterialCommunityIcons : Ionicons;
  const iconName = useMCI ? iconConfig.mci : iconConfig.ion;
  
  return (
    <View style={containerStyle}>
      <IconComponent
        name={iconName as any}
        size={size}
        color={color}
        style={style}
      />
    </View>
  );
}

/**
 * Icon Button with M3 styling
 */
interface M3IconButtonProps extends M3IconProps {
  onPress?: () => void;
  disabled?: boolean;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
}

export function M3IconButton({
  onPress,
  disabled = false,
  backgroundColor = "transparent",
  borderRadius = 12,
  padding = 8,
  ...iconProps
}: M3IconButtonProps) {
  const { Pressable } = require("react-native");
  const Animated = require("react-native-reanimated").default;
  const { useSharedValue, useAnimatedStyle, withSpring } = require("react-native-reanimated");
  
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
    >
      <Animated.View
        style={[
          {
            backgroundColor,
            borderRadius,
            padding,
            opacity: disabled ? 0.5 : 1,
          },
          animatedStyle,
        ]}
      >
        <M3Icon {...iconProps} />
      </Animated.View>
    </Pressable>
  );
}

export default M3Icon;
