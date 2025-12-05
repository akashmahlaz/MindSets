import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Theme } from "@/constants/Theme";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { UserProfileData } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

interface UserSignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export default function UserSignUpScreen() {
  const router = useRouter();
  const { signUpEnhanced } = useAuth();
  const { isDarkColorScheme } = useColorScheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<UserSignUpData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const isFormValid =
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.firstName &&
    formData.lastName &&
    formData.password === formData.confirmPassword &&
    formData.email.includes("@") &&
    formData.password.length >= 6;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const profileData: Partial<UserProfileData> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
      };

      await signUpEnhanced(
        formData.email,
        formData.password,
        profileData,
        "user",
      );

      Alert.alert(
        "Welcome to Mind Sets",
        "Your journey begins now.",
        [{ text: "Let's Go", onPress: () => router.replace("/(main)") }],
      );
    } catch (error: any) {
      console.error("Sign-up error:", error);
      let errorMessage = "Failed to create account. Please try again.";
      if (error.code === "auth/email-already-in-use") errorMessage = "This email is already registered.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: isDarkColorScheme ? Theme.colors.background.dark : Theme.colors.background.default }}>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? Theme.colors.background.dark : Theme.colors.background.default}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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
              
              <View className="items-center mb-8">
                <View 
                  className="w-16 h-16 rounded-full items-center justify-center mb-4 shadow-sm"
                  style={{ backgroundColor: Theme.colors.surface }}
                >
                  <Ionicons name="person" size={32} color={Theme.colors.primary} />
                </View>
                <Text className="text-3xl font-bold text-center" style={{ color: Theme.colors.text }}>
                  Create Account
                </Text>
                <Text className="text-center mt-2" style={{ color: Theme.colors.text, opacity: 0.7 }}>
                  Join Mind Sets as a member
                </Text>
              </View>

              <Card
                style={{
                  elevation: 0,
                  shadowColor: "transparent",
                  borderRadius: 24,
                  backgroundColor: Theme.colors.surface,
                  borderWidth: 1,
                  borderColor: Theme.colors.accent,
                }}
              >
                {error ? (
                  <View className="mx-6 mt-6 bg-red-50 border border-red-100 rounded-xl p-4">
                    <View className="flex-row items-start">
                      <Ionicons
                        name="alert-circle"
                        size={20}
                        color={Theme.colors.error}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{ color: Theme.colors.error, flex: 1 }}>
                        {error}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <CardContent className="space-y-5 pt-6">
                  <View className="flex-row space-x-4">
                    <View className="flex-1 space-y-2">
                      <Label className="font-medium ml-1" style={{ color: Theme.colors.text }}>First Name</Label>
                      <Input
                        value={formData.firstName}
                        onChangeText={(text) => setFormData((prev) => ({ ...prev, firstName: text }))}
                        placeholder="First Name"
                        className="h-14 rounded-xl px-4 border-0"
                        style={{ backgroundColor: isDarkColorScheme ? Theme.colors.background.dark : Theme.colors.background.default, color: Theme.colors.text }}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    <View className="flex-1 space-y-2">
                      <Label className="font-medium ml-1" style={{ color: Theme.colors.text }}>Last Name</Label>
                      <Input
                        value={formData.lastName}
                        onChangeText={(text) => setFormData((prev) => ({ ...prev, lastName: text }))}
                        placeholder="Last Name"
                        className="h-14 rounded-xl px-4 border-0"
                        style={{ backgroundColor: isDarkColorScheme ? Theme.colors.background.dark : Theme.colors.background.default, color: Theme.colors.text }}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>

                  <View className="space-y-2">
                    <Label className="font-medium ml-1" style={{ color: Theme.colors.text }}>Email</Label>
                    <Input
                      value={formData.email}
                      onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
                      placeholder="name@example.com"
                      className="h-14 rounded-xl px-4 border-0"
                      style={{ backgroundColor: isDarkColorScheme ? Theme.colors.background.dark : Theme.colors.background.default, color: Theme.colors.text }}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View className="space-y-2">
                    <Label className="font-medium ml-1" style={{ color: Theme.colors.text }}>Password</Label>
                    <Input
                      value={formData.password}
                      onChangeText={(text) => setFormData((prev) => ({ ...prev, password: text }))}
                      placeholder="••••••••"
                      className="h-14 rounded-xl px-4 border-0"
                      style={{ backgroundColor: isDarkColorScheme ? Theme.colors.background.dark : Theme.colors.background.default, color: Theme.colors.text }}
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                    />
                  </View>

                  <View className="space-y-2">
                    <Label className="font-medium ml-1" style={{ color: Theme.colors.text }}>Confirm Password</Label>
                    <Input
                      value={formData.confirmPassword}
                      onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmPassword: text }))}
                      placeholder="••••••••"
                      className="h-14 rounded-xl px-4 border-0"
                      style={{ backgroundColor: isDarkColorScheme ? Theme.colors.background.dark : Theme.colors.background.default, color: Theme.colors.text }}
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                    />
                  </View>
                </CardContent>

                <CardContent className="pb-8">
                  <View className="flex-row justify-between mt-2 gap-4">
                    <Button
                      variant="ghost"
                      onPress={() => router.back()}
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      <Text style={{ color: Theme.colors.text }}>Back</Text>
                    </Button>
                    <Button
                      onPress={handleSubmit}
                      disabled={loading || !isFormValid}
                      style={{ 
                        flex: 2, 
                        backgroundColor: isFormValid ? Theme.colors.primary : Theme.colors.accent,
                        height: 56,
                        borderRadius: 16
                      }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="font-bold text-lg text-white">Create Account</Text>
                      )}
                    </Button>
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
