import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { UserProfileData } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
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

export default function UserSignUpScreen() {
  const router = useRouter();
  const { signUpEnhanced } = useAuth();
  const { isDarkColorScheme } = useColorScheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, formAnim]);
  
  // Essential fields only
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    primaryConcerns: [] as string[],
  });

  // Premium Material Design 3 color scheme
  const colors = {
    background: isDarkColorScheme ? "#0F172A" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#334155" : "#F1F5F9",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#2AA79D",
    primaryContainer: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.08)",
    secondary: "#3A9C94",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
    input: isDarkColorScheme ? "#1E293B" : "#F8FAFC",
    error: "#EF4444",
    errorContainer: isDarkColorScheme ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.08)",
    success: "#2AA79D",
    successContainer: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.08)",
  };

  const isFormValid =
    formData.email.trim() &&
    formData.password.length >= 6 &&
    formData.firstName.trim() &&
    formData.email.includes("@");

  const handleConcernToggle = (concern: string) => {
    setFormData((prev) => ({
      ...prev,
      primaryConcerns: prev.primaryConcerns.includes(concern)
        ? prev.primaryConcerns.filter((c) => c !== concern)
        : [...prev.primaryConcerns, concern].slice(0, 5), // Max 5 concerns
    }));
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const profileData: Partial<UserProfileData> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        primaryConcerns: formData.primaryConcerns,
        preferredCounsellorGender: "no-preference",
        preferredSessionType: "any",
      };

      await signUpEnhanced(formData.email, formData.password, profileData, "user");

      Alert.alert(
        "Welcome to MindSets! 🎉",
        "Your account has been created successfully. Let's start your wellness journey.",
        [{ text: "Get Started", onPress: () => router.replace("/(main)") }],
      );
    } catch (err: any) {
      console.error("Sign-up error:", err);
      const errorMessages: Record<string, string> = {
        "auth/email-already-in-use": "An account with this email already exists",
        "auth/invalid-email": "Please enter a valid email address",
        "auth/weak-password": "Password should be at least 6 characters",
        "auth/network-request-failed": "Network error. Please check your connection",
      };
      setError(errorMessages[err.code] || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Quick concerns for faster selection
  const quickConcerns = [
    { id: "Anxiety", icon: "pulse-outline", color: "#2AA79D" },
    { id: "Depression", icon: "cloud-outline", color: "#3A9C94" },
    { id: "Stress", icon: "fitness-outline", color: "#EC4899" },
    { id: "Relationships", icon: "heart-outline", color: "#EF4444" },
    { id: "Self-esteem", icon: "sparkles-outline", color: "#F59E0B" },
    { id: "Sleep", icon: "moon-outline", color: "#3B82F6" },
  ];

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
              paddingTop: 16,
              paddingBottom: 32,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <Pressable
                onPress={() => router.back()}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 24,
                  alignSelf: "flex-start",
                  backgroundColor: colors.surfaceVariant,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 24,
                }}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text, marginLeft: 8 }}>Back</Text>
              </Pressable>
            </Animated.View>

            {/* Header with gradient accent */}
            <Animated.View 
              style={{ 
                marginBottom: 32,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <LinearGradient
                  colors={["#2AA79D", "#3A9C94"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="person-add" size={24} color="#FFFFFF" />
                </LinearGradient>
                <View>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "800",
                      color: colors.text,
                      letterSpacing: -0.5,
                    }}
                  >
                    Create Account
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>
                Join thousands finding peace of mind with professional support
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View style={{ gap: 20, opacity: formAnim }}>
              {/* Name Row */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    First Name *
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.input,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: formData.firstName ? colors.primary : colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                    }}
                  >
                    <Ionicons name="person-outline" size={18} color={formData.firstName ? colors.primary : colors.textSecondary} />
                    <TextInput
                      placeholder="John"
                      placeholderTextColor={colors.textSecondary}
                      value={formData.firstName}
                      onChangeText={(text) => { setFormData((prev) => ({ ...prev, firstName: text })); setError(""); }}
                      editable={!loading}
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
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Last Name
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.input,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: formData.lastName ? colors.primary : colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                    }}
                  >
                    <Ionicons name="person-outline" size={18} color={formData.lastName ? colors.primary : colors.textSecondary} />
                    <TextInput
                      placeholder="Doe"
                      placeholderTextColor={colors.textSecondary}
                      value={formData.lastName}
                      onChangeText={(text) => setFormData((prev) => ({ ...prev, lastName: text }))}
                      editable={!loading}
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
              </View>

              {/* Email */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Email *
                </Text>
                <View
                  style={{
                    backgroundColor: colors.input,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: formData.email.includes("@") ? colors.success : (formData.email ? colors.primary : colors.border),
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={formData.email.includes("@") ? colors.success : (formData.email ? colors.primary : colors.textSecondary)} 
                  />
                  <TextInput
                    placeholder="your@email.com"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.email}
                    onChangeText={(text) => { setFormData((prev) => ({ ...prev, email: text })); setError(""); }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: colors.text,
                    }}
                  />
                  {formData.email.includes("@") && (
                    <View style={{ backgroundColor: colors.successContainer, borderRadius: 12, padding: 4 }}>
                      <Ionicons name="checkmark" size={16} color={colors.success} />
                    </View>
                  )}
                </View>
              </View>

              {/* Password */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Password *
                </Text>
                <View
                  style={{
                    backgroundColor: colors.input,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: formData.password.length >= 6 ? colors.success : (formData.password ? colors.primary : colors.border),
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={formData.password.length >= 6 ? colors.success : (formData.password ? colors.primary : colors.textSecondary)} 
                  />
                  <TextInput
                    placeholder="Minimum 6 characters"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.password}
                    onChangeText={(text) => { setFormData((prev) => ({ ...prev, password: text })); setError(""); }}
                    secureTextEntry={!showPassword}
                    editable={!loading}
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
                    style={{ padding: 4 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={22}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>
                {formData.password && formData.password.length < 6 && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                    <Ionicons name="alert-circle" size={14} color={colors.error} />
                    <Text style={{ fontSize: 12, color: colors.error, marginLeft: 6 }}>
                      Password must be at least 6 characters
                    </Text>
                  </View>
                )}
                {formData.password.length >= 6 && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={{ fontSize: 12, color: colors.success, marginLeft: 6 }}>
                      Strong password
                    </Text>
                  </View>
                )}
              </View>

              {/* Quick Concerns Selection */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  What brings you here? (Optional)
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
                  Select up to 5 areas you&apos;d like to work on
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {quickConcerns.map((concern) => {
                    const isSelected = formData.primaryConcerns.includes(concern.id);
                    return (
                      <Pressable
                        key={concern.id}
                        onPress={() => !loading && handleConcernToggle(concern.id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: 24,
                          backgroundColor: isSelected ? concern.color : colors.surfaceVariant,
                          borderWidth: 2,
                          borderColor: isSelected ? concern.color : "transparent",
                        }}
                      >
                        <Ionicons 
                          name={concern.icon as any} 
                          size={18} 
                          color={isSelected ? "#FFFFFF" : colors.textSecondary}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: isSelected ? "#FFFFFF" : colors.text,
                          }}
                        >
                          {concern.id}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Error Message */}
              {error ? (
                <View
                  style={{
                    backgroundColor: colors.errorContainer,
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.error + "30",
                  }}
                >
                  <View style={{ backgroundColor: colors.error + "20", borderRadius: 12, padding: 8 }}>
                    <Ionicons name="alert-circle" size={20} color={colors.error} />
                  </View>
                  <Text style={{ color: colors.error, fontSize: 14, marginLeft: 12, flex: 1, fontWeight: "500" }}>
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Sign Up Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={loading || !isFormValid}
                style={{ opacity: loading ? 0.7 : 1, marginTop: 8 }}
              >
                <LinearGradient
                  colors={isFormValid ? ["#2AA79D", "#3A9C94"] : [colors.surfaceVariant, colors.surfaceVariant]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                  }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={20} color={isFormValid ? "#FFFFFF" : colors.textSecondary} style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 17, fontWeight: "700", color: isFormValid ? "#FFFFFF" : colors.textSecondary }}>
                        Create Account
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Terms */}
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                By signing up, you agree to our{" "}
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Terms of Service</Text> and{" "}
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Privacy Policy</Text>
              </Text>

              {/* Sign In Link */}
              <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 8 }}>
                <Text style={{ fontSize: 15, color: colors.textSecondary }}>
                  Already have an account?{" "}
                </Text>
                <Pressable onPress={() => router.replace("/(auth)/sign-in")}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>
                    Sign In
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
