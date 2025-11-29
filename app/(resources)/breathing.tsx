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

interface BreathingExercise {
  id: string;
  title: string;
  description: string;
  pattern: {
    inhale: number;
    hold1: number;
    exhale: number;
    hold2: number;
  };
  cycles: number;
  benefits: string[];
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string];
}

const BREATHING_EXERCISES: BreathingExercise[] = [
  {
    id: "box",
    title: "Box Breathing",
    description: "Military technique for calm under pressure",
    pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
    cycles: 4,
    benefits: ["Reduces stress", "Improves focus", "Calms nerves"],
    icon: "square-outline",
    gradient: ["#2AA79D", "#3A9C94"] as const,
  },
  {
    id: "478",
    title: "4-7-8 Relaxing",
    description: "Dr. Weil's natural tranquilizer",
    pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
    cycles: 4,
    benefits: ["Promotes sleep", "Reduces anxiety", "Lowers heart rate"],
    icon: "moon-outline",
    gradient: ["#7986CB", "#5C6BC0"] as const,
  },
  {
    id: "energize",
    title: "Energizing Breath",
    description: "Quick technique to boost energy",
    pattern: { inhale: 2, hold1: 0, exhale: 2, hold2: 0 },
    cycles: 10,
    benefits: ["Increases alertness", "Boosts energy", "Clears mind"],
    icon: "flash-outline",
    gradient: ["#FFB74D", "#FFA726"] as const,
  },
  {
    id: "calm",
    title: "Calming Breath",
    description: "Simple technique for instant calm",
    pattern: { inhale: 4, hold1: 2, exhale: 6, hold2: 0 },
    cycles: 5,
    benefits: ["Instant relief", "Slows thoughts", "Relaxes body"],
    icon: "leaf-outline",
    gradient: ["#4DB6AC", "#26A69A"] as const,
  },
  {
    id: "morning",
    title: "Morning Wake-Up",
    description: "Gentle energizing for the morning",
    pattern: { inhale: 5, hold1: 2, exhale: 5, hold2: 2 },
    cycles: 6,
    benefits: ["Gentle awakening", "Mental clarity", "Positive start"],
    icon: "sunny-outline",
    gradient: ["#FFD54F", "#FFCA28"] as const,
  },
  {
    id: "anxiety",
    title: "Anti-Anxiety",
    description: "When you feel overwhelmed",
    pattern: { inhale: 3, hold1: 3, exhale: 6, hold2: 0 },
    cycles: 5,
    benefits: ["Stops panic", "Grounds you", "Restores control"],
    icon: "shield-checkmark-outline",
    gradient: ["#E57373", "#EF9A9A"] as const,
  },
];

type BreathPhase = "inhale" | "hold1" | "exhale" | "hold2" | "complete";

export default function BreathingScreen() {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const [selectedExercise, setSelectedExercise] = useState<BreathingExercise | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<BreathPhase>("inhale");
  const [currentCycle, setCurrentCycle] = useState(1);
  const [phaseTime, setPhaseTime] = useState(0);

  const circleScale = useRef(new Animated.Value(0.6)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    };
  }, []);

  // Circle animation based on phase
  useEffect(() => {
    if (!isActive || !selectedExercise) return;

    const pattern = selectedExercise.pattern;
    let targetScale: number;
    let duration: number;

    switch (currentPhase) {
      case "inhale":
        targetScale = 1;
        duration = pattern.inhale * 1000;
        break;
      case "hold1":
        targetScale = 1;
        duration = pattern.hold1 * 1000;
        break;
      case "exhale":
        targetScale = 0.6;
        duration = pattern.exhale * 1000;
        break;
      case "hold2":
        targetScale = 0.6;
        duration = pattern.hold2 * 1000;
        break;
      default:
        return;
    }

    Animated.timing(circleScale, {
      toValue: targetScale,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [currentPhase, isActive, selectedExercise]);

  const getPhaseLabel = (phase: BreathPhase): string => {
    switch (phase) {
      case "inhale": return "Breathe In";
      case "hold1": return "Hold";
      case "exhale": return "Breathe Out";
      case "hold2": return "Hold";
      case "complete": return "Complete!";
      default: return "";
    }
  };

  const getNextPhase = (phase: BreathPhase, pattern: BreathingExercise["pattern"]): BreathPhase => {
    switch (phase) {
      case "inhale":
        return pattern.hold1 > 0 ? "hold1" : "exhale";
      case "hold1":
        return "exhale";
      case "exhale":
        return pattern.hold2 > 0 ? "hold2" : "inhale";
      case "hold2":
        return "inhale";
      default:
        return "inhale";
    }
  };

  const getPhaseDuration = (phase: BreathPhase, pattern: BreathingExercise["pattern"]): number => {
    switch (phase) {
      case "inhale": return pattern.inhale;
      case "hold1": return pattern.hold1;
      case "exhale": return pattern.exhale;
      case "hold2": return pattern.hold2;
      default: return 0;
    }
  };

  const startExercise = useCallback((exercise: BreathingExercise) => {
    setSelectedExercise(exercise);
    setIsActive(true);
    setCurrentPhase("inhale");
    setCurrentCycle(1);
    setPhaseTime(exercise.pattern.inhale);
    circleScale.setValue(0.6);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    timerRef.current = setInterval(() => {
      setPhaseTime((prev) => {
        if (prev <= 1) {
          // Move to next phase
          setCurrentPhase((currentPhase) => {
            const nextPhase = getNextPhase(currentPhase, exercise.pattern);
            
            // Check if cycle complete
            if (currentPhase === "exhale" && exercise.pattern.hold2 === 0) {
              setCurrentCycle((cycle) => {
                if (cycle >= exercise.cycles) {
                  // Exercise complete
                  stopExercise();
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  return cycle;
                }
                return cycle + 1;
              });
            } else if (currentPhase === "hold2") {
              setCurrentCycle((cycle) => {
                if (cycle >= exercise.cycles) {
                  stopExercise();
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  return cycle;
                }
                return cycle + 1;
              });
            }

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            return nextPhase;
          });
          
          return getPhaseDuration(getNextPhase(currentPhase, exercise.pattern), exercise.pattern);
        }
        return prev - 1;
      });
    }, 1000);
  }, [currentPhase]);

  const stopExercise = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    setCurrentPhase("complete");
  }, []);

  const endSession = useCallback(() => {
    stopExercise();
    setSelectedExercise(null);
    setPhaseTime(0);
    setCurrentCycle(1);
  }, [stopExercise]);

  // Active breathing view
  if (selectedExercise && isActive) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />
        <LinearGradient
          colors={selectedExercise.gradient}
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
                  Cycle {currentCycle} of {selectedExercise.cycles}
                </Text>
                <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "700" }}>
                  {selectedExercise.title}
                </Text>
              </View>
              <View style={{ width: 44 }} />
            </View>

            {/* Main breathing circle */}
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                {/* Outer glow rings */}
                <View
                  style={{
                    position: "absolute",
                    width: 280,
                    height: 280,
                    borderRadius: 140,
                    backgroundColor: "rgba(255,255,255,0.08)",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    width: 240,
                    height: 240,
                    borderRadius: 120,
                    backgroundColor: "rgba(255,255,255,0.12)",
                  }}
                />

                {/* Animated breathing circle */}
                <Animated.View
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    backgroundColor: "rgba(255,255,255,0.95)",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ scale: circleScale }],
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.2,
                    shadowRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 56,
                      fontWeight: "200",
                      color: selectedExercise.gradient[0],
                    }}
                  >
                    {phaseTime}
                  </Text>
                </Animated.View>
              </View>

              {/* Phase instruction */}
              <View style={{ marginTop: 50, alignItems: "center" }}>
                <Text style={{ color: "#FFF", fontSize: 32, fontWeight: "300" }}>
                  {getPhaseLabel(currentPhase)}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 8 }}>
                  Follow the circle
                </Text>
              </View>
            </View>

            {/* Stop button */}
            <View style={{ padding: 30, alignItems: "center" }}>
              <Pressable
                onPress={endSession}
                style={{
                  paddingHorizontal: 40,
                  paddingVertical: 16,
                  borderRadius: 30,
                  backgroundColor: "rgba(255,255,255,0.2)",
                }}
              >
                <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>
                  End Session
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // Exercise selection view
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
              Breathing
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
              Calm your mind with breath
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        >
          {/* Featured card */}
          <Pressable onPress={() => startExercise(BREATHING_EXERCISES[0])}>
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
                    MOST POPULAR
                  </Text>
                  <Text style={{ color: "#FFF", fontSize: 26, fontWeight: "700", marginBottom: 8 }}>
                    Box Breathing
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 22 }}>
                    Used by Navy SEALs to stay calm under pressure. Equal parts inhale, hold, exhale, hold.
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
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="repeat" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginLeft: 6 }}>
                    4-4-4-4 pattern • 4 cycles
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Section title */}
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
            All Exercises
          </Text>

          {/* Exercise cards */}
          {BREATHING_EXERCISES.map((exercise) => (
            <Pressable
              key={exercise.id}
              onPress={() => startExercise(exercise)}
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
                  colors={exercise.gradient}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={exercise.icon} size={28} color="#FFF" />
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
                    {exercise.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                    {exercise.description}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, flexWrap: "wrap", gap: 8 }}>
                    <View
                      style={{
                        backgroundColor: isDarkColorScheme ? "rgba(42,167,157,0.15)" : "rgba(42,167,157,0.1)",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
                        {exercise.pattern.inhale}-{exercise.pattern.hold1 || "0"}-{exercise.pattern.exhale}-{exercise.pattern.hold2 || "0"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="repeat" size={14} color={colors.textMuted} />
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>
                        {exercise.cycles} cycles
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
                {exercise.benefits.map((benefit, idx) => (
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
