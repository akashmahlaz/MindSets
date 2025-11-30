import { useColorScheme } from "@/lib/useColorScheme";
import { useMeditationSound, useUISound } from "@/lib/useSound";
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

const { width, height } = Dimensions.get("window");

interface MeditationSession {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string];
  benefits: string[];
}

const MEDITATION_SESSIONS: MeditationSession[] = [
  {
    id: "calm",
    title: "Calm Mind",
    description: "Release stress and find inner peace",
    duration: 5,
    category: "Stress Relief",
    icon: "leaf-outline",
    gradient: ["#2AA79D", "#3A9C94"] as const,
    benefits: ["Reduces anxiety", "Improves focus", "Better sleep"],
  },
  {
    id: "gratitude",
    title: "Gratitude",
    description: "Cultivate thankfulness and positivity",
    duration: 10,
    category: "Positivity",
    icon: "heart-outline",
    gradient: ["#E57373", "#EF9A9A"] as const,
    benefits: ["Boosts mood", "Increases optimism", "Better relationships"],
  },
  {
    id: "focus",
    title: "Deep Focus",
    description: "Sharpen your concentration",
    duration: 15,
    category: "Productivity",
    icon: "bulb-outline",
    gradient: ["#FFB74D", "#FFA726"] as const,
    benefits: ["Better concentration", "Mental clarity", "Increased productivity"],
  },
  {
    id: "sleep",
    title: "Sleep Prep",
    description: "Prepare your mind for restful sleep",
    duration: 20,
    category: "Sleep",
    icon: "moon-outline",
    gradient: ["#7986CB", "#5C6BC0"] as const,
    benefits: ["Fall asleep faster", "Deeper sleep", "Wake refreshed"],
  },
  {
    id: "body-scan",
    title: "Body Scan",
    description: "Release tension from head to toe",
    duration: 10,
    category: "Relaxation",
    icon: "body-outline",
    gradient: ["#4DB6AC", "#26A69A"] as const,
    benefits: ["Physical relaxation", "Body awareness", "Stress release"],
  },
  {
    id: "morning",
    title: "Morning Energy",
    description: "Start your day with intention",
    duration: 7,
    category: "Morning",
    icon: "sunny-outline",
    gradient: ["#FFD54F", "#FFCA28"] as const,
    benefits: ["Increased energy", "Positive mindset", "Clear intentions"],
  },
];

export default function MeditationScreen() {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  
  const [selectedSession, setSelectedSession] = useState<MeditationSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState<"in" | "out">("in");
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const breathAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sound hooks
  const meditationSound = useMeditationSound(selectedSession?.id || 'calm');
  const { playSuccess } = useUISound();

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

  // Cleanup on unmount
  useEffect(() => {
    const timer = timerRef.current;
    return () => {
      if (timer) clearInterval(timer);
      meditationSound.endSession();
    };
  }, []);

  // Breathing phase interval - separate from animation
  useEffect(() => {
    let breathInterval: NodeJS.Timeout | null = null;
    
    if (isPlaying) {
      breathInterval = setInterval(() => {
        setBreathingPhase((prev) => (prev === "in" ? "out" : "in"));
      }, 4000);
    }
    
    return () => {
      if (breathInterval) clearInterval(breathInterval);
    };
  }, [isPlaying]);

  // Pulse animation for meditation circle
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      breathAnim.setValue(0);
    }
  }, [isPlaying, pulseAnim, breathAnim]);

  const startMeditation = useCallback(async (session: MeditationSession) => {
    setSelectedSession(session);
    setTotalTime(session.duration * 60);
    setTimeRemaining(session.duration * 60);
    setIsPlaying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Start ambient sound if enabled
    if (soundEnabled) {
      await meditationSound.startSession();
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Meditation complete
          stopMeditation();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [soundEnabled, meditationSound]);

  const stopMeditation = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Stop ambient sound and play completion
    if (soundEnabled) {
      await meditationSound.endSession();
      await playSuccess();
    }
  }, [soundEnabled, meditationSound, playSuccess]);

  const pauseMeditation = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Pause ambient sound
    if (soundEnabled) {
      await meditationSound.pauseSession();
    }
  }, [soundEnabled, meditationSound]);

  const resumeMeditation = useCallback(async () => {
    setIsPlaying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Resume ambient sound
    if (soundEnabled) {
      await meditationSound.resumeSession();
    }
    
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopMeditation();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopMeditation, soundEnabled, meditationSound]);

  const endSession = useCallback(async () => {
    await stopMeditation();
    setSelectedSession(null);
    setTimeRemaining(0);
    setTotalTime(0);
  }, [stopMeditation]);

  // Toggle sound on/off
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
    if (isPlaying && meditationSound.isActive) {
      if (soundEnabled) {
        meditationSound.pauseSession();
      } else {
        meditationSound.resumeSession();
      }
    }
  }, [isPlaying, soundEnabled, meditationSound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = totalTime > 0 ? (totalTime - timeRemaining) / totalTime : 0;

  // Active meditation view
  if (selectedSession && (isPlaying || timeRemaining > 0)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />
        <LinearGradient
          colors={selectedSession.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 20 }}>
              <Pressable
                onPress={endSession}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </Pressable>
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                  {selectedSession.category}
                </Text>
                <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "700" }}>
                  {selectedSession.title}
                </Text>
              </View>
              {/* Sound toggle button */}
              <Pressable
                onPress={toggleSound}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: soundEnabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons 
                  name={soundEnabled ? "volume-high-outline" : "volume-mute-outline"} 
                  size={22} 
                  color="#FFF" 
                />
              </Pressable>
            </View>

            {/* Main content */}
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              {/* Animated circle */}
              <Animated.View
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 110,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [{ scale: pulseAnim }],
                }}
              >
                <View
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: 90,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 70,
                      backgroundColor: "rgba(255,255,255,0.95)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 42, fontWeight: "200", color: selectedSession.gradient[0] }}>
                      {formatTime(timeRemaining)}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* Breathing guidance */}
              <View style={{ marginTop: 40, alignItems: "center" }}>
                <Text style={{ color: "#FFF", fontSize: 24, fontWeight: "300" }}>
                  {breathingPhase === "in" ? "Breathe In..." : "Breathe Out..."}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 8 }}>
                  Follow the circle rhythm
                </Text>
              </View>

              {/* Progress indicator */}
              <View style={{ marginTop: 40, width: width - 80 }}>
                <View
                  style={{
                    height: 4,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 2,
                  }}
                >
                  <View
                    style={{
                      height: 4,
                      width: `${progress * 100}%`,
                      backgroundColor: "#FFF",
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Controls */}
            <View style={{ padding: 30, alignItems: "center" }}>
              <Pressable
                onPress={isPlaying ? pauseMeditation : resumeMeditation}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "rgba(255,255,255,0.95)",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={36}
                  color={selectedSession.gradient[0]}
                />
              </Pressable>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // Session selection view
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
              Meditation
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
              Find your inner peace
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        >
          {/* Featured card */}
          <Pressable onPress={() => startMeditation(MEDITATION_SESSIONS[0])}>
            <LinearGradient
              colors={["#2AA79D", "#3A9C94"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 24,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600", marginBottom: 4 }}>
                    RECOMMENDED
                  </Text>
                  <Text style={{ color: "#FFF", fontSize: 26, fontWeight: "700", marginBottom: 8 }}>
                    Start Your Day Right
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 22 }}>
                    A calming 5-minute session to center yourself and prepare for the day ahead.
                  </Text>
                </View>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="play" size={28} color="#FFF" />
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
                <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginLeft: 6 }}>
                  5 minutes
                </Text>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Section title */}
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
            All Sessions
          </Text>

          {/* Session cards */}
          {MEDITATION_SESSIONS.map((session) => (
            <Pressable
              key={session.id}
              onPress={() => startMeditation(session)}
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDarkColorScheme ? 0.15 : 0.08,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <LinearGradient
                  colors={session.gradient}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={session.icon} size={28} color="#FFF" />
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
                    {session.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                    {session.description}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                    <View
                      style={{
                        backgroundColor: isDarkColorScheme ? "rgba(42,167,157,0.15)" : "rgba(42,167,157,0.1)",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
                        {session.category}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 12 }}>
                      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>
                        {session.duration} min
                      </Text>
                    </View>
                  </View>
                </View>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isDarkColorScheme ? "rgba(42,167,157,0.15)" : "rgba(42,167,157,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="play" size={20} color={colors.primary} />
                </View>
              </View>

              {/* Benefits */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 14, gap: 8 }}>
                {session.benefits.map((benefit, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.surface,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 4 }}>
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))}

          {/* Bottom spacing */}
          <View style={{ height: insets.bottom + 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
