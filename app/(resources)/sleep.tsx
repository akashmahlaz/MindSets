import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface SleepContent {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  type: "story" | "sounds" | "meditation" | "music";
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string];
  tags: string[];
}

const SLEEP_CONTENT: SleepContent[] = [
  {
    id: "rain",
    title: "Gentle Rain",
    description: "Soft rainfall sounds for peaceful sleep",
    duration: 60,
    type: "sounds",
    icon: "rainy-outline",
    gradient: ["#5C6BC0", "#7986CB"] as const,
    tags: ["Rain", "Nature", "Relaxing"],
  },
  {
    id: "ocean",
    title: "Ocean Waves",
    description: "Calming waves on a peaceful shore",
    duration: 60,
    type: "sounds",
    icon: "water-outline",
    gradient: ["#2AA79D", "#3A9C94"] as const,
    tags: ["Ocean", "Nature", "Beach"],
  },
  {
    id: "forest",
    title: "Forest Night",
    description: "Crickets and gentle forest sounds",
    duration: 45,
    type: "sounds",
    icon: "leaf-outline",
    gradient: ["#4DB6AC", "#26A69A"] as const,
    tags: ["Forest", "Nature", "Night"],
  },
  {
    id: "sleep-meditation",
    title: "Sleep Meditation",
    description: "Guided journey to deep sleep",
    duration: 20,
    type: "meditation",
    icon: "moon-outline",
    gradient: ["#7E57C2", "#9575CD"] as const,
    tags: ["Guided", "Relaxation", "Sleep"],
  },
  {
    id: "bedtime-story",
    title: "The Quiet Village",
    description: "A peaceful bedtime story for adults",
    duration: 25,
    type: "story",
    icon: "book-outline",
    gradient: ["#FFB74D", "#FFA726"] as const,
    tags: ["Story", "Calm", "Peaceful"],
  },
  {
    id: "piano",
    title: "Soft Piano",
    description: "Gentle piano melodies for rest",
    duration: 45,
    type: "music",
    icon: "musical-notes-outline",
    gradient: ["#E57373", "#EF9A9A"] as const,
    tags: ["Music", "Piano", "Instrumental"],
  },
  {
    id: "white-noise",
    title: "White Noise",
    description: "Constant, calming background noise",
    duration: 60,
    type: "sounds",
    icon: "radio-outline",
    gradient: ["#90A4AE", "#78909C"] as const,
    tags: ["White Noise", "Constant", "Focus"],
  },
  {
    id: "thunderstorm",
    title: "Distant Thunder",
    description: "Far-away storm with gentle rain",
    duration: 60,
    type: "sounds",
    icon: "thunderstorm-outline",
    gradient: ["#546E7A", "#607D8B"] as const,
    tags: ["Storm", "Thunder", "Rain"],
  },
];

const SLEEP_TIPS = [
  "Keep your bedroom cool (65-68°F)",
  "Avoid screens 1 hour before bed",
  "Stick to a consistent sleep schedule",
  "Limit caffeine after 2 PM",
  "Create a relaxing bedtime routine",
];

export default function SleepScreen() {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const [selectedContent, setSelectedContent] = useState<SleepContent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tipTimerRef = useRef<NodeJS.Timeout | null>(null);

  const colors = {
    background: isDarkColorScheme ? "#0F1419" : "#FAFBFC",
    cardBg: isDarkColorScheme ? "#1C2128" : "#FFFFFF",
    text: isDarkColorScheme ? "#F0F6FC" : "#1F2937",
    textSecondary: isDarkColorScheme ? "#8B949E" : "#6B7280",
    textMuted: isDarkColorScheme ? "#6E7681" : "#9CA3AF",
    primary: "#2AA79D",
    secondary: "#3A9C94",
    border: isDarkColorScheme ? "#30363D" : "#E5E7EB",
    surface: isDarkColorScheme ? "#161B22" : "#F3F4F6",
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (tipTimerRef.current) clearInterval(tipTimerRef.current);
    };
  }, []);

  // Rotate sleep tips
  useEffect(() => {
    tipTimerRef.current = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % SLEEP_TIPS.length);
    }, 5000);

    return () => {
      if (tipTimerRef.current) clearInterval(tipTimerRef.current);
    };
  }, []);

  // Star animation for sleep mode
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(starAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(starAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isPlaying]);

  const startSleep = useCallback((content: SleepContent) => {
    setSelectedContent(content);
    setTimeRemaining(content.duration * 60);
    setIsPlaying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopSleep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopSleep = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const endSession = useCallback(() => {
    stopSleep();
    setSelectedContent(null);
    setTimeRemaining(0);
  }, [stopSleep]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTypeIcon = (type: SleepContent["type"]): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "story": return "book";
      case "sounds": return "volume-high";
      case "meditation": return "flower";
      case "music": return "musical-notes";
      default: return "moon";
    }
  };

  // Active sleep view
  if (selectedContent && isPlaying) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0D1117" }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={["#0D1117", "#161B22", "#1C2128"]}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
            {/* Animated stars background */}
            {[...Array(20)].map((_, i) => (
              <Animated.View
                key={i}
                style={{
                  position: "absolute",
                  top: Math.random() * 400,
                  left: Math.random() * width,
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  borderRadius: 2,
                  backgroundColor: "#FFF",
                  opacity: starAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 0.8],
                  }),
                }}
              />
            ))}

            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 20 }}>
              <Pressable
                onPress={endSession}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </Pressable>
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                  Now Playing
                </Text>
                <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "700" }}>
                  {selectedContent.title}
                </Text>
              </View>
              <View style={{ width: 44 }} />
            </View>

            {/* Main content */}
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              {/* Icon circle */}
              <LinearGradient
                colors={selectedContent.gradient}
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: selectedContent.gradient[0],
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.4,
                  shadowRadius: 30,
                }}
              >
                <Ionicons name={selectedContent.icon} size={80} color="#FFF" />
              </LinearGradient>

              {/* Timer */}
              <View style={{ marginTop: 40, alignItems: "center" }}>
                <Text style={{ color: "#FFF", fontSize: 48, fontWeight: "200" }}>
                  {formatTime(timeRemaining)}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 8 }}>
                  remaining
                </Text>
              </View>

              {/* Description */}
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginTop: 30, textAlign: "center", paddingHorizontal: 40 }}>
                {selectedContent.description}
              </Text>
            </View>

            {/* Controls */}
            <View style={{ padding: 30, alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
                <Pressable
                  onPress={() => setTimeRemaining((prev) => Math.max(0, prev - 300))}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="remove" size={24} color="#FFF" />
                </Pressable>
                <Pressable
                  onPress={stopSleep}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: "rgba(255,255,255,0.95)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="pause" size={36} color={selectedContent.gradient[0]} />
                </Pressable>
                <Pressable
                  onPress={() => setTimeRemaining((prev) => prev + 300)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="add" size={24} color="#FFF" />
                </Pressable>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 16 }}>
                Tap +/- to adjust timer by 5 minutes
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // Content selection view
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 10 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>
              Sleep
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
              Rest & recovery sounds
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        >
          {/* Sleep tip banner */}
          <View
            style={{
              backgroundColor: isDarkColorScheme ? "#161B22" : "#E8F5F3",
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDarkColorScheme ? "rgba(42,167,157,0.2)" : "rgba(42,167,157,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600", marginBottom: 2 }}>
                SLEEP TIP
              </Text>
              <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
                {SLEEP_TIPS[currentTipIndex]}
              </Text>
            </View>
          </View>

          {/* Featured card */}
          <Pressable onPress={() => startSleep(SLEEP_CONTENT[0])}>
            <LinearGradient
              colors={["#5C6BC0", "#7986CB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 24,
                padding: 24,
                marginBottom: 24,
              }}
            >
              {/* Stars decoration */}
              <View style={{ position: "absolute", top: 20, right: 30 }}>
                <Ionicons name="star" size={12} color="rgba(255,255,255,0.4)" />
              </View>
              <View style={{ position: "absolute", top: 40, right: 60 }}>
                <Ionicons name="star" size={8} color="rgba(255,255,255,0.3)" />
              </View>
              <View style={{ position: "absolute", top: 30, right: 100 }}>
                <Ionicons name="star" size={10} color="rgba(255,255,255,0.5)" />
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <Ionicons name="moon" size={20} color="rgba(255,255,255,0.8)" />
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600", marginLeft: 8 }}>
                  TONIGHT'S PICK
                </Text>
              </View>
              <Text style={{ color: "#FFF", fontSize: 26, fontWeight: "700", marginBottom: 8 }}>
                Gentle Rain
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 22 }}>
                Let the soft patter of raindrops carry you into a peaceful night's sleep.
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="play" size={24} color="#FFF" />
                </View>
                <View style={{ marginLeft: 16 }}>
                  <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "600" }}>Start Now</Text>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>60 minutes</Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Categories */}
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
            Sounds & Stories
          </Text>

          {/* Content grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
            {SLEEP_CONTENT.map((content) => (
              <Pressable
                key={content.id}
                onPress={() => startSleep(content)}
                style={{
                  width: (width - 56) / 2,
                  backgroundColor: colors.cardBg,
                  borderRadius: 20,
                  overflow: "hidden",
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDarkColorScheme ? 0.15 : 0.08,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <LinearGradient
                  colors={content.gradient}
                  style={{
                    height: 100,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={content.icon} size={40} color="#FFF" />
                </LinearGradient>
                <View style={{ padding: 14 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }} numberOfLines={1}>
                    {content.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={2}>
                    {content.description}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name={getTypeIcon(content.type)} size={12} color={colors.textMuted} />
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 4 }}>
                        {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 4 }}>
                        {content.duration}m
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Bottom spacing */}
          <View style={{ height: insets.bottom + 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
