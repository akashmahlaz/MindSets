import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { H1, H2, P } from "@/components/ui/typography";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
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
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
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
  const [loadingType, setLoadingType] = useState<
    "email" | "google" | "apple" | null
  >(null);
  const router = useRouter();
  const auth = getAuth(app);
  const { isDarkColorScheme } = useColorScheme();

  // Google
  const [_, __, promptAsync] = Google.useAuthRequest({
    clientId:
      "84524660788-3unj4cgjivvh4jqj39o8aeae6tu41anm.apps.googleusercontent.com",
  });
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setLoadingType("google");
      setError("");

      const result = await promptAsync();
      if (result?.type === "success" && result.authentication?.idToken) {
        const credential = GoogleAuthProvider.credential(
          result.authentication.idToken,
        );
        await signInWithCredential(auth, credential);
      } else if (result?.type === "cancel") {
        // User cancelled, don't show error
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };
  // Apple
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
      console.error("Apple sign-in error:", error);
      if (error.code !== "ERR_REQUEST_CANCELED") {
        setError("Failed to sign in with Apple. Please try again.");
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
      console.error("Email sign-in error:", error);

      // Provide user-friendly error messages
      switch (error.code) {
        case "auth/user-not-found":
          setError("No account found with this email address");
          break;
        case "auth/wrong-password":
          setError("Incorrect password");
          break;
        case "auth/invalid-email":
          setError("Invalid email address");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again later");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your connection");
          break;
        default:
          setError("Failed to sign in. Please try again");
      }
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? "#0f172a" : "#ffffff"}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              padding: 24,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ maxWidth: 480, width: "100%", alignSelf: "center" }}>
              {/* Hero Section */}
              <View className="items-center mb-8">
                <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
                  <Ionicons
                    name="heart"
                    size={40}
                    color={isDarkColorScheme ? "#3b82f6" : "#1d4ed8"}
                  />
                </View>
                <H1 className="mb-2 text-center">Welcome Back</H1>
                <P className="mb-2 text-center">
                  Sign in to continue your mental health journey with{" "}
                  <Text className="text-primary font-semibold">
                    MindConnect
                  </Text>
                </P>
              </View>
              {/* Form Section */}
              <Card
                style={{
                  elevation: 4,
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  borderRadius: 16,
                }}
              >
                <CardHeader className="pb-6">
                  <H2 className="text-center">Sign In</H2>
                  <P className="text-center">
                    Enter your credentials to access your account
                  </P>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Input */}
                  <View className="space-y-2">
                    <Label className="font-semibold text-base">Email</Label>
                    <View className="relative">
                      <Input
                        placeholder="Enter your email address"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          setError("");
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!isLoading}
                        className="h-12 rounded-lg px-4 bg-background border border-input text-base text-foreground pl-12"
                        placeholderTextColor="#9CA3AF"
                      />
                      <View className="absolute left-3 top-3">
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
                        />
                      </View>
                    </View>
                  </View>
                  {/* Password Input */}
                  <View className="space-y-2">
                    <Label className="font-semibold text-base">Password</Label>
                    <View className="relative">
                      <Input
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          setError("");
                        }}
                        secureTextEntry
                        editable={!isLoading}
                        className="h-12 rounded-lg px-4 bg-background border border-input text-base text-foreground pl-12"
                        placeholderTextColor="#9CA3AF"
                      />
                      <View className="absolute left-3 top-3">
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
                        />
                      </View>
                    </View>
                  </View>
                  {/* Error Message */}
                  {error ? (
                    <View className="bg-red-100 rounded-lg p-2 mb-2">
                      <Text className="text-red-700 text-center text-sm">
                        {error}
                      </Text>
                    </View>
                  ) : null}
                  {/* Loading Indicator */}
                  {isLoading && (
                    <View className="mb-2">
                      <ActivityIndicator size="small" color="#3B82F6" />
                    </View>
                  )}
                  {/* Sign In Button */}
                  <Button
                    onPress={handleEmailSignIn}
                    disabled={isLoading}
                    className="w-full h-12 mt-2"
                  >
                    <Text className="text-primary-foreground font-semibold text-base">
                      Sign In
                    </Text>
                  </Button>
                  {/* Social Sign In Buttons */}
                  <View className="relative my-6">
                    <View className="absolute inset-0 flex items-center">
                      <View className="w-full border-t border-border" />
                    </View>
                    <View className="relative flex justify-center text-xs uppercase">
                      <Text className="bg-card px-4 text-muted-foreground font-medium">
                        Or continue with
                      </Text>
                    </View>
                  </View>
                  <View className="space-y-3">
                    {/* Google Sign In */}
                    <Button
                      variant="outline"
                      onPress={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full h-12 border-border"
                    >
                      {isLoading && loadingType === "google" ? (
                        <View className="flex-row items-center">
                          <ActivityIndicator
                            size="small"
                            color={isDarkColorScheme ? "#ffffff" : "#000000"}
                            style={{ marginRight: 8 }}
                          />
                          <Text className="text-foreground font-medium">
                            Connecting...
                          </Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center">
                          <Ionicons
                            name="logo-google"
                            size={20}
                            color="#EA4335"
                            style={{ marginRight: 8 }}
                          />
                          <Text className="text-foreground font-medium text-base">
                            Continue with Google
                          </Text>
                        </View>
                      )}
                    </Button>

                    {/* Apple Sign In */}
                    {Platform.OS === "ios" && (
                      <View>
                        {isLoading && loadingType === "apple" ? (
                          <Button
                            variant="outline"
                            disabled
                            className="w-full h-12"
                          >
                            <View className="flex-row items-center">
                              <ActivityIndicator
                                size="small"
                                color={
                                  isDarkColorScheme ? "#ffffff" : "#000000"
                                }
                                style={{ marginRight: 8 }}
                              />
                              <Text className="text-foreground font-medium">
                                Connecting...
                              </Text>
                            </View>
                          </Button>
                        ) : (
                          <Apple.AppleAuthenticationButton
                            buttonType={
                              Apple.AppleAuthenticationButtonType.SIGN_IN
                            }
                            buttonStyle={
                              isDarkColorScheme
                                ? Apple.AppleAuthenticationButtonStyle.WHITE
                                : Apple.AppleAuthenticationButtonStyle.BLACK
                            }
                            cornerRadius={8}
                            style={{ width: "100%", height: 48 }}
                            onPress={handleAppleSignIn}
                          />
                        )}
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
