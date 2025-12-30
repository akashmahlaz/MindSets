import { useColorScheme } from "@/lib/useColorScheme";
import { UserRole } from "@/types/user";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Premium animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Elegant staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(120, [
        Animated.spring(card1Anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(card2Anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(buttonAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Subtle pulse for selected state
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Premium 2025 color palette - Inspired by Headspace, Calm, Linear
  const colors = {
    // Background - Rich, not flat
    background: isDarkColorScheme 
      ? "#0C0F17" // Deep space black with blue tint
      : "#F8FAFF", // Soft blue-white, not harsh
    
    // Card surfaces
    cardBg: isDarkColorScheme 
      ? "rgba(30, 35, 50, 0.8)" 
      : "rgba(255, 255, 255, 0.95)",
    cardBgSelected: isDarkColorScheme
      ? "rgba(40, 45, 65, 0.9)"
      : "rgba(255, 255, 255, 1)",
    
    // Text
    textPrimary: isDarkColorScheme ? "#FFFFFF" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    textMuted: isDarkColorScheme ? "#64748B" : "#94A3B8",
    
    // Accent gradients - Desaturated for mental health
    primaryGradient: ["#2AA79D", "#3A9C94"] as const, // Desaturated teal
    secondaryGradient: ["#2AA79D", "#248F87"] as const, // Desaturated teal secondary
    
    // Borders
    border: isDarkColorScheme ? "rgba(148, 163, 184, 0.1)" : "rgba(15, 23, 42, 0.06)",
    borderSelected: isDarkColorScheme ? "rgba(42, 167, 157, 0.5)" : "rgba(42, 167, 157, 0.3)",
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole === "user") {
      router.push("/(auth)/sign-up-user");
    } else if (selectedRole === "counsellor") {
      router.push("/(auth)/sign-up-counsellor");
    }
  };

  const roleOptions = [
    {
      id: "user" as UserRole,
      icon: "heart",
      title: "I need support",
      subtitle: "Start your healing journey",
      description: "Connect with licensed therapists who understand your unique needs",
      features: ["Personalized matching", "Secure video sessions", "24/7 messaging"],
      gradient: colors.primaryGradient,
      iconBg: isDarkColorScheme ? "rgba(42, 167, 157, 0.2)" : "rgba(42, 167, 157, 0.1)",
      anim: card1Anim,
    },
    {
      id: "counsellor" as UserRole,
      icon: "medical",
      title: "I'm a therapist",
      subtitle: "Expand your practice",
      description: "Join our network and help people worldwide from anywhere",
      features: ["Set your schedule", "Manage clients easily", "Secure & HIPAA compliant"],
      gradient: colors.secondaryGradient,
      iconBg: isDarkColorScheme ? "rgba(42, 167, 157, 0.2)" : "rgba(42, 167, 157, 0.1)",
      anim: card2Anim,
    },
  ];

  const renderCard = (option: typeof roleOptions[0], index: number) => {
    const isSelected = selectedRole === option.id;
    
    return (
      <Animated.View
        key={option.id}
        style={{
          opacity: option.anim,
          transform: [
            {
              translateY: option.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0],
              }),
            },
            {
              scale: isSelected ? pulseAnim : 1,
            },
          ],
        }}
      >
        <Pressable
          onPress={() => handleRoleSelect(option.id)}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          <View
            style={{
              backgroundColor: isSelected ? colors.cardBgSelected : colors.cardBg,
              borderRadius: 24,
              overflow: "hidden",
              // Premium shadow - no borders, modern apps use elevation
              shadowColor: isSelected ? option.gradient[0] : "#000",
              shadowOffset: { width: 0, height: isSelected ? 16 : 4 },
              shadowOpacity: isSelected ? 0.35 : 0.08,
              shadowRadius: isSelected ? 28 : 12,
              elevation: isSelected ? 16 : 4,
            }}
          >
            {/* Gradient accent bar at top when selected */}
            {isSelected && (
              <LinearGradient
                colors={option.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 4 }}
              />
            )}
            
            <View style={{ padding: 24, paddingTop: isSelected ? 20 : 24 }}>
              {/* Header Row */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                {/* Icon with gradient background */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <LinearGradient
                    colors={option.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name={option.icon as any} size={26} color="#FFFFFF" />
                  </LinearGradient>
                  
                  <View>
                    <Text style={{ 
                      fontSize: 18, 
                      fontWeight: "700", 
                      color: colors.textPrimary,
                      letterSpacing: -0.3,
                    }}>
                      {option.title}
                    </Text>
                    <Text style={{ 
                      fontSize: 13, 
                      color: isSelected ? option.gradient[0] : colors.textSecondary,
                      fontWeight: "500",
                      marginTop: 2,
                    }}>
                      {option.subtitle}
                    </Text>
                  </View>
                </View>
                
                {/* Selection indicator - modern fill style, no borders */}
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSelected 
                      ? option.gradient[0] 
                      : (isDarkColorScheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"),
                  }}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </View>
              
              {/* Description */}
              <Text style={{ 
                fontSize: 14, 
                color: colors.textSecondary,
                lineHeight: 22,
                marginBottom: 18,
              }}>
                {option.description}
              </Text>
              
              {/* Feature pills - Modern style */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {option.features.map((feature, idx) => (
                  <View 
                    key={idx}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isSelected 
                        ? (isDarkColorScheme ? `${option.gradient[0]}20` : `${option.gradient[0]}10`)
                        : (isDarkColorScheme ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: isSelected ? option.gradient[0] : colors.textMuted,
                      }}
                    />
                    <Text style={{ 
                      fontSize: 12, 
                      fontWeight: "600",
                      color: isSelected ? option.gradient[0] : colors.textSecondary,
                    }}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          flexGrow: 1, 
          paddingHorizontal: 20,
          paddingTop: 32,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          {/* Logo with gradient ring */}
          <View style={{ marginBottom: 24 }}>
            <LinearGradient
              colors={["#2AA79D", "#3A9C94", "#248F87"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 88,
                height: 88,
                borderRadius: 28,
                padding: 3,
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 25,
                  backgroundColor: colors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons name="brain" size={44} color="#2AA79D" />
              </View>
            </LinearGradient>
          </View>
          
          <Text 
            style={{ 
              fontSize: 32, 
              fontWeight: "700",
              color: colors.textPrimary,
              textAlign: "center",
              marginBottom: 8,
              letterSpacing: -0.5,
            }}
          >
            Welcome to MindSets
          </Text>
          <Text 
            style={{ 
              fontSize: 16, 
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 24,
              maxWidth: 300,
            }}
          >
            Your journey to better mental health starts here
          </Text>
        </Animated.View>

        {/* Role Cards */}
        <View style={{ gap: 16, marginBottom: 32 }}>
          {roleOptions.map((option, index) => renderCard(option, index))}
        </View>

        {/* CTA Section */}
        <Animated.View
          style={{
            opacity: buttonAnim,
            transform: [{
              translateY: buttonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            }],
            marginTop: "auto",
          }}
        >
          {/* Continue Button with Gradient */}
          <Pressable
            onPress={handleContinue}
            disabled={!selectedRole}
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              marginBottom: 20,
            })}
          >
            <LinearGradient
              colors={selectedRole 
                ? (selectedRole === "user" ? colors.primaryGradient : colors.secondaryGradient)
                : [isDarkColorScheme ? "#2D3748" : "#E2E8F0", isDarkColorScheme ? "#2D3748" : "#E2E8F0"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 28,
                paddingVertical: 18,
                alignItems: "center",
                shadowColor: selectedRole ? "#2AA79D" : "transparent",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: selectedRole ? 8 : 0,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text 
                  style={{ 
                    fontSize: 17, 
                    fontWeight: "600",
                    color: selectedRole ? "#FFFFFF" : colors.textMuted,
                    letterSpacing: 0.2,
                  }}
                >
                  Continue
                </Text>
                {selectedRole && (
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                )}
              </View>
            </LinearGradient>
          </Pressable>

          {/* Sign In Link */}
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              Already have an account?{" "}
            </Text>
            <Pressable 
              onPress={() => router.replace("/(auth)/sign-in")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#2AA79D" }}>
                Sign in
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}