import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Apple from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import {
    getAuth,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
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
import { app } from "../../firebaseConfig";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"email" | "google" | "apple" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const auth = getAuth(app);
  const { isDarkColorScheme } = useColorScheme();

  // Premium color scheme
  const colors = {
    background: isDarkColorScheme ? "#0F1419" : "#FAFBFC",
    card: isDarkColorScheme ? "#171D26" : "#FFFFFF",
    text: isDarkColorScheme ? "#F0F2F5" : "#1E2530",
    textSecondary: isDarkColorScheme ? "#8B95A5" : "#747B8A",
    primary: isDarkColorScheme ? "#6B8CF5" : "#4A6CF4",
    secondary: isDarkColorScheme ? "#4CC38A" : "#3FA57A",
    border: isDarkColorScheme ? "#323A48" : "#E2E5E9",
    input: isDarkColorScheme ? "#1E2632" : "#F4F5F7",
    error: "#EF4444",
    errorBg: isDarkColorScheme ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
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
    } catch (error: any) {
      if (error.code !== "ERR_REQUEST_CANCELED") {
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
              paddingHorizontal: 24,
              paddingTop: 48,
              paddingBottom: 32,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={{ alignItems: "center", marginBottom: 40 }}>
              <View 
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  backgroundColor: colors.primary + "15",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <MaterialCommunityIcons name="brain" size={36} color={colors.primary} />
              </View>
              
              <Text style={{ fontSize: 26, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
                Welcome Back
              </Text>
              <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: "center" }}>
                Sign in to continue your wellness journey
              </Text>
            </View>

            {/* Form */}
            <View style={{ marginBottom: 24 }}>
              {/* Email Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                  Email
                </Text>
                <View 
                  style={{
                    backgroundColor: colors.input,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textSecondary}
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
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                  Password
                </Text>
                <View 
                  style={{
                    backgroundColor: colors.input,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textSecondary}
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
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Error Message */}
              {error ? (
                <View 
                  style={{
                    backgroundColor: colors.errorBg,
                    borderRadius: 10,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <Text style={{ color: colors.error, fontSize: 14, marginLeft: 8, flex: 1 }}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Sign In Button */}
              <Pressable
                onPress={handleEmailSignIn}
                disabled={isLoading}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading && loadingType === "email" ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>
                    Sign In
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Divider */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ paddingHorizontal: 16, fontSize: 13, color: colors.textSecondary }}>
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
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isLoading ? 0.7 : 1,
                }}
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
                  style={{
                    backgroundColor: isDarkColorScheme ? "#FFFFFF" : "#000000",
                    borderRadius: 12,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isLoading ? 0.7 : 1,
                  }}
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
                Don't have an account?{" "}
              </Text>
              <Pressable onPress={() => router.push("/(auth)/role-selection")}>
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
