import { useAuth } from "@/context/AuthContext";
import { auth } from "@/firebaseConfig";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Pressable,
    StatusBar,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, logout, resendVerificationEmail } = useAuth();
  const { isDarkColorScheme } = useColorScheme();

  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState("");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for email icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const colors = {
    background: isDarkColorScheme ? "#0F172A" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#334155" : "#F1F5F9",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#2AA79D",
    primaryContainer: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.08)",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
    warning: "#F59E0B",
    warningContainer: isDarkColorScheme ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.08)",
    success: "#10B981",
    successContainer: isDarkColorScheme ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.08)",
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    setMessage("");
    
    try {
      await resendVerificationEmail();
      setMessage("Verification email sent! Check your inbox.");
      setResendCooldown(60); // 60 second cooldown
    } catch {
      setMessage("Failed to send email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    setMessage("");
    
    try {
      // Reload user to get latest emailVerified status
      await auth.currentUser?.reload();
      
      if (auth.currentUser?.emailVerified) {
        setMessage("Email verified! Redirecting...");
        // Small delay for user to see success message
        setTimeout(() => {
          router.replace("/(main)");
        }, 1000);
      } else {
        setMessage("Email not verified yet. Please check your inbox and click the verification link.");
      }
    } catch {
      setMessage("Error checking verification status. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.replace("/(auth)/role-selection");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: "center",
          }}
        >
          {/* Animated Email Icon */}
          <Animated.View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: colors.warningContainer,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
              transform: [{ scale: pulseAnim }],
            }}
          >
            <Ionicons name="mail-unread" size={60} color={colors.warning} />
          </Animated.View>

          {/* Title */}
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: colors.text,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Verify Your Email
          </Text>

          {/* Description */}
          <Text
            style={{
              fontSize: 16,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 24,
              marginBottom: 8,
            }}
          >
            {"We've sent a verification link to"}
          </Text>
          
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.primary,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {user?.email}
          </Text>

          {/* Instructions Card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              width: "100%",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colors.primaryContainer,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>1</Text>
              </View>
              <Text style={{ fontSize: 15, color: colors.text, flex: 1 }}>
                Check your email inbox (and spam folder)
              </Text>
            </View>
            
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colors.primaryContainer,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>2</Text>
              </View>
              <Text style={{ fontSize: 15, color: colors.text, flex: 1 }}>
                Click the verification link in the email
              </Text>
            </View>
            
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colors.primaryContainer,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>3</Text>
              </View>
              <Text style={{ fontSize: 15, color: colors.text, flex: 1 }}>
                {"Come back here and tap \"I've Verified\""}
              </Text>
            </View>
          </View>

          {/* Message */}
          {message ? (
            <View
              style={{
                backgroundColor: message.includes("verified!") || message.includes("sent!") 
                  ? colors.successContainer 
                  : colors.warningContainer,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                marginBottom: 24,
                width: "100%",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: message.includes("verified!") || message.includes("sent!") 
                    ? colors.success 
                    : colors.warning,
                  textAlign: "center",
                }}
              >
                {message}
              </Text>
            </View>
          ) : null}

          {/* Primary Action - Check Verification */}
          <Pressable
            onPress={handleCheckVerification}
            disabled={isChecking}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 16,
              paddingHorizontal: 32,
              borderRadius: 16,
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              opacity: isChecking ? 0.7 : 1,
            }}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>
                  {"I've Verified My Email"}
                </Text>
              </>
            )}
          </Pressable>

          {/* Resend Email Button */}
          <Pressable
            onPress={handleResendEmail}
            disabled={isResending || resendCooldown > 0}
            style={{
              backgroundColor: colors.surfaceVariant,
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 12,
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              opacity: (isResending || resendCooldown > 0) ? 0.6 : 1,
            }}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="refresh" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 15, fontWeight: "500", color: colors.primary }}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Email"}
                </Text>
              </>
            )}
          </Pressable>

          {/* Sign Out Link */}
          <Pressable onPress={handleSignOut}>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center" }}>
              Wrong email? <Text style={{ color: colors.primary, fontWeight: "600" }}>Sign out</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
