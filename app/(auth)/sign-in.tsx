import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import * as Apple from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../firebaseConfig";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"email" | "google" | "apple" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  
  // Premium animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
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
      Animated.spring(formAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, formAnim]);

  // Premium 2025 color palette
  const colors = {
    // Background
    background: isDarkColorScheme ? "#0C0F17" : "#F8FAFF",
    
    // Cards & surfaces
    card: isDarkColorScheme ? "rgba(30, 35, 50, 0.8)" : "rgba(255, 255, 255, 0.95)",
    
    // Text
    text: isDarkColorScheme ? "#FFFFFF" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    textMuted: isDarkColorScheme ? "#64748B" : "#94A3B8",
    
    // Primary gradient
    primaryGradient: ["#6366F1", "#8B5CF6"] as const,
    primary: "#6366F1",
    
    // Inputs
    inputBg: isDarkColorScheme ? "rgba(30, 35, 50, 0.6)" : "rgba(255, 255, 255, 0.8)",
    inputBorder: isDarkColorScheme ? "rgba(148, 163, 184, 0.15)" : "rgba(15, 23, 42, 0.08)",
    inputFocusBorder: "#6366F1",
    
    // Borders
    border: isDarkColorScheme ? "rgba(148, 163, 184, 0.1)" : "rgba(15, 23, 42, 0.06)",
    
    // Error
    error: "#EF4444",
    errorBg: isDarkColorScheme ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)",
  };

  // Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "84524660788-3unj4cgjivvh4jqj39o8aeae6tu41anm.apps.googleusercontent.com",
    iosClientId: "84524660788-3unj4cgjivvh4jqj39o8aeae6tu41anm.apps.googleusercontent.com",
    androidClientId: "84524660788-3unj4cgjivvh4jqj39o8aeae6tu41anm.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSignInResponse(response);
    }
  }, [response]);

  const handleGoogleSignInResponse = async (result: any) => {
    try {
      setIsLoading(true);
      setLoadingType("google");
      setError("");

      if (result?.authentication?.idToken) {
        const credential = GoogleAuthProvider.credential(
          result.authentication.idToken,
          result.authentication.accessToken,
        );
        await signInWithCredential(auth, credential);
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } catch (error: any) {
      if (error.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with this email.");
      } else if (error.code !== "auth/popup-closed-by-user") {
        setError("Failed to sign in with Google.");
      }
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setLoadingType("google");
      setError("");

      if (!request) {
        setError("Google sign-in is not available.");
        return;
      }

      const result = await promptAsync();
      if (result?.type === "cancel" || result?.type === "dismiss") {
        setIsLoading(false);
        setLoadingType(null);
      }
    } catch (error) {
      setError("Failed to start Google sign-in.");
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      setLoadingType("apple");
      setError("");

      const credential = await Apple.signInAsync({
        requestedScopes: [
          Apple.AppleAuthenticationScope.FULL_NAME,
          Apple.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const provider = new OAuthProvider("apple.com");
        const firebaseCredential = provider.credential({
          idToken: credential.identityToken,
          rawNonce: credential.state!,
        });
        await signInWithCredential(auth, firebaseCredential);
      }
    } catch (err: any) {
      if (err.code !== "ERR_REQUEST_CANCELED") {
        setError("Failed to sign in with Apple.");
      }
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      setLoadingType("email");
      setError("");
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      const errorMessages: Record<string, string> = {
        "auth/user-not-found": "No account found with this email",
        "auth/wrong-password": "Incorrect password",
        "auth/invalid-email": "Invalid email address",
        "auth/user-disabled": "This account has been disabled",
        "auth/too-many-requests": "Too many attempts. Try again later",
        "auth/network-request-failed": "Network error. Check your connection",
      };
      setError(errorMessages[error.code] || "Failed to sign in");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 20,
              paddingTop: 40,
              paddingBottom: 32,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Premium Header */}
            <Animated.View 
              style={{ 
                alignItems: "center", 
                marginBottom: 40,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {/* Logo with gradient ring */}
              <View style={{ marginBottom: 24 }}>
                <LinearGradient
                  colors={["#6366F1", "#8B5CF6", "#EC4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 24,
                    padding: 3,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      borderRadius: 21,
                      backgroundColor: colors.background,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 40 }}>🧠</Text>
                  </View>
                </LinearGradient>
              </View>
              
              <Text 
                style={{ 
                  fontSize: 28, 
                  fontWeight: "700", 
                  color: colors.text, 
                  marginBottom: 8,
                  letterSpacing: -0.5,
                }}
              >
                Welcome Back
              </Text>
              <Text 
                style={{ 
                  fontSize: 15, 
                  color: colors.textSecondary, 
                  textAlign: "center",
                  lineHeight: 22,
                }}
              >
                Sign in to continue your wellness journey
              </Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View 
              style={{ 
                marginBottom: 24,
                opacity: formAnim,
                transform: [{
                  translateY: formAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                }],
              }}
            >
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                {/* Email Input */}
                <View style={{ marginBottom: 16 }}>
                  <Text 
                    style={{ 
                      fontSize: 13, 
                      fontWeight: "600", 
                      color: colors.textSecondary, 
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Email
                  </Text>
                  <View 
                    style={{
                      backgroundColor: colors.inputBg,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: colors.inputBorder,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isDarkColorScheme ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="mail" size={18} color={colors.primary} />
                    </View>
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={(text) => { setEmail(text); setError(""); }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!isLoading}
                      style={{
                        flex: 1,
                        paddingVertical: 16,
                        paddingHorizontal: 12,
                        fontSize: 16,
                        color: colors.text,
                      }}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text 
                    style={{ 
                      fontSize: 13, 
                      fontWeight: "600", 
                      color: colors.textSecondary, 
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Password
                  </Text>
                  <View 
                    style={{
                      backgroundColor: colors.inputBg,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: colors.inputBorder,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isDarkColorScheme ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="lock-closed" size={18} color={colors.primary} />
                    </View>
                    <TextInput
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={(text) => { setPassword(text); setError(""); }}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                      style={{
                        flex: 1,
                        paddingVertical: 16,
                        paddingHorizontal: 12,
                        fontSize: 16,
                        color: colors.text,
                      }}
                    />
                    <Pressable 
                      onPress={() => setShowPassword(!showPassword)}
                      style={{
                        padding: 8,
                      }}
                    >
                      <Ionicons 
                        name={showPassword ? "eye" : "eye-off"} 
                        size={20} 
                        color={colors.textMuted}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Error Message */}
                {error ? (
                  <View 
                    style={{
                      backgroundColor: colors.errorBg,
                      borderRadius: 12,
                      padding: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <Ionicons name="alert-circle" size={20} color={colors.error} />
                    <Text style={{ color: colors.error, fontSize: 14, marginLeft: 10, flex: 1, fontWeight: "500" }}>
                      {error}
                    </Text>
                  </View>
                ) : null}

                {/* Sign In Button with Gradient */}
                <Pressable
                  onPress={handleEmailSignIn}
                  disabled={isLoading}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <LinearGradient
                    colors={colors.primaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 14,
                      paddingVertical: 16,
                      alignItems: "center",
                      opacity: isLoading ? 0.7 : 1,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.35,
                      shadowRadius: 12,
                      elevation: 6,
                    }}
                  >
                    {isLoading && loadingType === "email" ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>
                          Sign In
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>

            {/* Divider */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ paddingHorizontal: 16, fontSize: 13, color: colors.textMuted, fontWeight: "500" }}>
                or continue with
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            {/* Social Sign In */}
            <View style={{ gap: 12, marginBottom: 32 }}>
              {/* Google */}
              <Pressable
                onPress={handleGoogleSignIn}
                disabled={isLoading || !request}
                style={({ pressed }) => ({
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: 15,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isLoading ? 0.7 : pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                })}
              >
                {isLoading && loadingType === "google" ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#DB4437" />
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text, marginLeft: 10 }}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Apple - iOS only */}
              {Platform.OS === "ios" && (
                <Pressable
                  onPress={handleAppleSignIn}
                  disabled={isLoading}
                  style={({ pressed }) => ({
                    backgroundColor: isDarkColorScheme ? "#FFFFFF" : "#000000",
                    borderRadius: 14,
                    paddingVertical: 15,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isLoading ? 0.7 : pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 2,
                  })}
                >
                  {isLoading && loadingType === "apple" ? (
                    <ActivityIndicator size="small" color={isDarkColorScheme ? "#000000" : "#FFFFFF"} />
                  ) : (
                    <>
                      <Ionicons name="logo-apple" size={20} color={isDarkColorScheme ? "#000000" : "#FFFFFF"} />
                      <Text 
                        style={{ 
                          fontSize: 15, 
                          fontWeight: "600", 
                          color: isDarkColorScheme ? "#000000" : "#FFFFFF", 
                          marginLeft: 10 
                        }}
                      >
                        Continue with Apple
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>

            {/* Sign Up Link */}
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: "auto" }}>
              <Text style={{ fontSize: 15, color: colors.textSecondary }}>
                Don&apos;t have an account?{" "}
              </Text>
              <Pressable 
                onPress={() => router.push("/(auth)/role-selection")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.primary }}>
                  Sign Up
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
