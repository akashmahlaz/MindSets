import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { H1, H2 } from "@/components/ui/typography";
import { useColorScheme } from "@/lib/useColorScheme";
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
  ActivityIndicator, Animated, Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableWithoutFeedback,
  View
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
  
  // Animation for hero icon
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:
      "84524660788-3unj4cgjivvh4jqj39o8aeae6tu41anm.apps.googleusercontent.com",
    iosClientId:
      "84524660788-3unj4cgjivvh4jqj39o8aeae6tu41anm.apps.googleusercontent.com",
    androidClientId:
      "84524660788-3unj4cgjivvh4jqj39o8aeae6tu41anm.apps.googleusercontent.com",
  });

  // Handle Google sign-in response
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
        const userCredential = await signInWithCredential(auth, credential);
        console.log("Google sign-in successful:", userCredential.user.uid);
        // Navigation will happen automatically via onAuthStateChanged
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      if (error.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with this email. Please sign in with your password.");
      } else if (error.code === "auth/popup-closed-by-user") {
        // User closed popup, don't show error
      } else {
        setError("Failed to sign in with Google. Please try again.");
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
        setError("Google sign-in is not available. Please try again later.");
        setIsLoading(false);
        setLoadingType(null);
        return;
      }

      const result = await promptAsync();
      if (result?.type === "cancel") {
        // User cancelled, don't show error
        setIsLoading(false);
        setLoadingType(null);
      } else if (result?.type === "dismiss") {
        setIsLoading(false);
        setLoadingType(null);
      }
      // If success, the useEffect will handle it
    } catch (error: any) {
      console.error("Google sign-in prompt error:", error);
      setError("Failed to start Google sign-in. Please try again.");
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
              paddingTop: 64,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ maxWidth: 400, width: "100%", alignSelf: "center" }}>
              {/* Header Section */}
              <View className="items-center mb-16">
                <H1 className="mb-8 text-center">Sign In</H1>
              </View>
              {/* Form Section */}
              <Card>
                <CardHeader className="pb-8">
                  <H2 className="text-center">Welcome back</H2>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Input */}
                  <View className="space-y-2">
                    <Label className="font-semibold text-base">Email</Label>
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
                    />
                  </View>
                  {/* Password Input */}
                  <View className="space-y-2">
                    <Label className="font-semibold text-base">Password</Label>
                    <Input
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setError("");
                      }}
                      secureTextEntry
                      editable={!isLoading}
                    />
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
                    className="w-full mt-2"
                  >
                    <Text className="text-primary-foreground font-semibold">
                      {isLoading && loadingType === "email" ? "Signing in..." : "Sign In"}
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
                      disabled={isLoading || !request}
                      className="w-full"
                    >
                      {isLoading && loadingType === "google" ? (
                        <View className="flex-row items-center">
                          <ActivityIndicator
                            size="small"
                            color={isDarkColorScheme ? "#ffffff" : "#000000"}
                            style={{ marginRight: 8 }}
                          />
                          <Text className="text-foreground font-semibold">
                            Connecting...
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-foreground font-semibold">
                          Continue with Google
                        </Text>
                      )}
                    </Button>

                    {/* Apple Sign In */}
                    {Platform.OS === "ios" && (
                      <View>
                        {isLoading && loadingType === "apple" ? (
                          <Button
                            variant="outline"
                            disabled
                            className="w-full"
                          >
                            <View className="flex-row items-center">
                              <ActivityIndicator
                                size="small"
                                color={
                                  isDarkColorScheme ? "#ffffff" : "#000000"
                                }
                                style={{ marginRight: 8 }}
                              />
                              <Text className="text-foreground font-semibold">
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
                            cornerRadius={12}
                            style={{ width: "100%", height: 56 }}
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
