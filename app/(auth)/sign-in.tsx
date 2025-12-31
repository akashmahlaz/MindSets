import { M3Icon } from "@/components/ui/M3Icon";
import { M3CircularProgress } from "@/components/ui/M3ProgressIndicator";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Apple from "expo-apple-authentication";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const { forgotPassword } = useAuth();
  
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
    primaryGradient: ["#2AA79D", "#3A9C94"] as const,
    primary: "#2AA79D",
    
    // Inputs
    inputBg: isDarkColorScheme ? "rgba(30, 35, 50, 0.6)" : "rgba(255, 255, 255, 0.8)",
    inputBorder: isDarkColorScheme ? "rgba(148, 163, 184, 0.15)" : "rgba(15, 23, 42, 0.08)",
    inputFocusBorder: "#2AA79D",
    
    // Borders
    border: isDarkColorScheme ? "rgba(148, 163, 184, 0.1)" : "rgba(15, 23, 42, 0.06)",
    
    // Error
    error: "#EF4444",
    errorBg: isDarkColorScheme ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)",
  };

  // Google Sign-In removed per user request

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

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    if (!forgotPasswordEmail.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      setForgotPasswordLoading(true);
      await forgotPassword(forgotPasswordEmail.trim());
      Alert.alert(
        "Email Sent! 📧",
        "We've sent a password reset link to your email. Please check your inbox.",
        [{ text: "OK", onPress: () => setShowForgotPassword(false) }]
      );
      setForgotPasswordEmail("");
    } catch (error: any) {
      const errorMessages: Record<string, string> = {
        "auth/user-not-found": "No account found with this email",
        "auth/invalid-email": "Invalid email address",
        "auth/too-many-requests": "Too many requests. Try again later",
      };
      Alert.alert("Error", errorMessages[error.code] || "Failed to send reset email");
    } finally {
      setForgotPasswordLoading(false);
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
                  colors={["#2AA79D", "#3A9C94", "#248F87"]}
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
                    <MaterialCommunityIcons name="brain" size={40} color="#2AA79D" />
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
                        backgroundColor: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <M3Icon name="mail" size={18} color={colors.primary} />
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
                        backgroundColor: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <M3Icon name="lock-closed" size={18} color={colors.primary} />
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
                      <M3Icon 
                        name={showPassword ? "eye" : "eye-off"} 
                        size={20} 
                        color={colors.textMuted}
                      />
                    </Pressable>
                  </View>
                  
                  {/* Forgot Password Link */}
                  <Pressable
                    onPress={() => {
                      setForgotPasswordEmail(email);
                      setShowForgotPassword(true);
                    }}
                    style={{ alignSelf: "flex-end", marginTop: 8 }}
                  >
                    <Text style={{ 
                      fontSize: 14, 
                      color: colors.primary, 
                      fontWeight: "600" 
                    }}>
                      Forgot Password?
                    </Text>
                  </Pressable>
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
                    <M3Icon name="error" size={20} color={colors.error} />
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
                      <M3CircularProgress size={20} color="#FFFFFF" />
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>
                          Sign In
                        </Text>
                        <M3Icon name="arrow-forward" size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>

            {/* Divider */}
            {/* <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ paddingHorizontal: 16, fontSize: 13, color: colors.textMuted, fontWeight: "500" }}>
                or continue with
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View> */}

            {/* Social Sign In */}
            <View style={{ gap: 12, marginBottom: 32 }}>
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
                    <M3CircularProgress size={20} color={isDarkColorScheme ? "#000000" : "#FFFFFF"} />
                  ) : (
                    <>
                      <M3Icon name="logo-apple" size={20} color={isDarkColorScheme ? "#000000" : "#FFFFFF"} />
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

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowForgotPassword(false)}>
          <View style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 24,
                width: "100%",
                maxWidth: 400,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
                elevation: 10,
              }}>
                {/* Modal Header */}
                <View style={{ alignItems: "center", marginBottom: 24 }}>
                  <View style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    backgroundColor: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}>
                    <M3Icon name="mail" size={32} color={colors.primary} />
                  </View>
                  <Text style={{ 
                    fontSize: 22, 
                    fontWeight: "700", 
                    color: colors.text,
                    marginBottom: 8,
                  }}>
                    Reset Password
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    color: colors.textSecondary, 
                    textAlign: "center",
                    lineHeight: 20,
                  }}>
                    Enter your email and we&apos;ll send you a link to reset your password
                  </Text>
                </View>

                {/* Email Input */}
                <View style={{
                  backgroundColor: colors.inputBg,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: colors.inputBorder,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  marginBottom: 20,
                }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <M3Icon name="mail" size={18} color={colors.primary} />
                  </View>
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textMuted}
                    value={forgotPasswordEmail}
                    onChangeText={setForgotPasswordEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!forgotPasswordLoading}
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: colors.text,
                    }}
                  />
                </View>

                {/* Buttons */}
                <View style={{ gap: 12 }}>
                  <Pressable
                    onPress={handleForgotPassword}
                    disabled={forgotPasswordLoading}
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
                        opacity: forgotPasswordLoading ? 0.7 : 1,
                      }}
                    >
                      {forgotPasswordLoading ? (
                        <M3CircularProgress size={20} color="#FFFFFF" />
                      ) : (
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>
                          Send Reset Link
                        </Text>
                      )}
                    </LinearGradient>
                  </Pressable>

                  <Pressable
                    onPress={() => setShowForgotPassword(false)}
                    disabled={forgotPasswordLoading}
                    style={({ pressed }) => ({
                      backgroundColor: colors.inputBg,
                      borderRadius: 14,
                      paddingVertical: 16,
                      alignItems: "center",
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textSecondary }}>
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
