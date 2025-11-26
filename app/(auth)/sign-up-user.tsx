import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { H2, P } from "@/components/ui/typography";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { MENTAL_HEALTH_CONCERNS, UserProfileData } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Animated } from "react-native";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserSignUpData {
  // Basic info
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  age: number;
  profession?: string;
  location?: string;
  occupation?: string;
  childhoodExperience?: string;
  problemsYouFacing?: string;

  // Mental health info
  primaryConcerns: string[];
  severityLevel: "mild" | "moderate" | "severe" | "";
  previousTherapy: boolean | null;

  // Preferences
  preferredCounsellorGender: "male" | "female" | "no-preference";
  preferredSessionType: "video" | "audio" | "chat" | "any";

  // Emergency contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
}

export default function UserSignUpScreen() {
  const router = useRouter();
  const { signUpEnhanced } = useAuth();
  const params = useLocalSearchParams();
  const { isDarkColorScheme } = useColorScheme();

  const [currentStep, setCurrentStep] = useState(1);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<UserSignUpData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    age: 0,
    primaryConcerns: [],
    severityLevel: "",
    previousTherapy: null,
    preferredCounsellorGender: "no-preference",
    preferredSessionType: "any",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
  });

  const isStep1Valid =
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.firstName &&
    formData.lastName &&
    formData.password === formData.confirmPassword &&
    formData.email.includes("@") &&
    formData.password.length >= 6;

  // Simplified: Combine step 2 and 3 into one step
  const isStep2Valid =
    formData.primaryConcerns.length > 0 &&
    formData.severityLevel &&
    formData.emergencyContactName &&
    formData.emergencyContactPhone &&
    formData.emergencyContactRelation;

  const handleConcernToggle = (concern: string) => {
    setFormData((prev) => ({
      ...prev,
      primaryConcerns: prev.primaryConcerns.includes(concern)
        ? prev.primaryConcerns.filter((c) => c !== concern)
        : [...prev.primaryConcerns, concern],
    }));
  };
  const handleNext = () => {
    setError(""); // Clear any errors when moving to next step
    if (currentStep < 2) {
      // Reset animations for next step
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError(""); // Clear any errors when going back
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };
  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Create the enhanced profile data
      const profileData: Partial<UserProfileData> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        primaryConcerns: formData.primaryConcerns,
        severityLevel: formData.severityLevel as any,
        previousTherapy: formData.previousTherapy!,
        preferredCounsellorGender: formData.preferredCounsellorGender,
        preferredSessionType: formData.preferredSessionType,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelation,
        },
      };

      await signUpEnhanced(
        formData.email,
        formData.password,
        profileData,
        "user",
      );

      Alert.alert(
        "Registration Successful",
        "Welcome to MindConnect! Your account has been created.",
        [{ text: "OK", onPress: () => router.replace("/(main)") }],
      );
    } catch (error: any) {
      console.error("Sign-up error:", error);

      // Provide user-friendly error messages
      let errorMessage = "Failed to create account. Please try again.";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "An account with this email already exists";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/weak-password":
          errorMessage =
            "Password is too weak. Please use at least 6 characters";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection";
          break;
        default:
          errorMessage =
            error.message || "Failed to create account. Please try again.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const renderStep1 = () => (
    <CardContent className="space-y-4">
      <H2 className="mb-2">Basic Information</H2>
      <P className="mb-4">Let's start with some basic information about you.</P>
      <View className="space-y-2">
        <Label className="font-semibold text-base">First Name</Label>
        <Input
          value={formData.firstName}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, firstName: text }));
            setError("");
          }}
          placeholder="Enter your first name"
          editable={!loading}
          className="h-12 rounded-md px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <View className="space-y-2">
        <Label className="font-semibold text-base">Last Name</Label>
        <Input
          value={formData.lastName}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, lastName: text }));
            setError("");
          }}
          placeholder="Enter your last name"
          editable={!loading}
          className="h-12 rounded-md px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <View className="space-y-2">
        <Label className="font-semibold text-base">Email</Label>
        <Input
          value={formData.email}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, email: text }));
            setError("");
          }}
          placeholder="Enter your email"
          editable={!loading}
          className="h-12 rounded-md px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      <View className="space-y-2">
        <Label className="font-semibold text-base">Password</Label>
        <Input
          value={formData.password}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, password: text }));
            setError("");
          }}
          placeholder="Create a password"
          editable={!loading}
          className="h-12 rounded-md px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />
      </View>
      <View className="space-y-2">
        <Label className="font-semibold text-base">Confirm Password</Label>
        <Input
          value={formData.confirmPassword}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, confirmPassword: text }));
            setError("");
          }}
          placeholder="Re-enter your password"
          editable={!loading}
          className="h-12 rounded-md px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />
      </View>

      {formData.password !== formData.confirmPassword &&
        formData.confirmPassword && (
          <View className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <View className="flex-row items-center">
              <Ionicons
                name="alert-circle"
                size={16}
                color="#ef4444"
                style={{ marginRight: 6 }}
              />
              <Text className="text-destructive text-sm">
                Passwords do not match
              </Text>
            </View>
          </View>
        )}

      {formData.password && formData.password.length < 6 && (
        <View className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <View className="flex-row items-center">
            <Ionicons
              name="alert-circle"
              size={16}
              color="#ef4444"
              style={{ marginRight: 6 }}
            />
            <Text className="text-destructive text-sm">
              Password must be at least 6 characters
            </Text>
          </View>
        </View>
      )}
    </CardContent>
  );
  const renderStep2 = () => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <CardContent className="space-y-4">
        <H2 className="mb-2">Mental Health & Safety</H2>
        <P className="mb-4">Help us understand how we can best support you.</P>
      <View className="space-y-2">
        <Label className="font-semibold text-base">
          What are your primary mental health concerns? (Select all that apply)
        </Label>
        <View className="flex-row flex-wrap gap-2">
          {MENTAL_HEALTH_CONCERNS.slice(0, 12).map((concern) => (
            <Pressable
              key={concern}
              onPress={() => {
                if (!loading) {
                  handleConcernToggle(concern);
                  setError(""); // Clear error when user makes a selection
                }
              }}
              disabled={loading}
              className={`px-3 py-2 rounded-md border ${
                formData.primaryConcerns.includes(concern)
                  ? "bg-primary border-primary"
                  : "bg-background border-border"
              } ${loading ? "opacity-50" : ""}`}
            >
              <Text
                className={`text-sm ${
                  formData.primaryConcerns.includes(concern)
                    ? "text-primary-foreground"
                    : "text-foreground"
                }`}
              >
                {concern
                  .replace("-", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="space-y-2">
        <Label className="font-semibold text-base">
          How would you rate the severity of your concerns?
        </Label>
        <View className="space-y-2">
          {[
            { value: "mild", label: "Mild - Some difficulty but manageable" },
            {
              value: "moderate",
              label: "Moderate - Noticeable impact on daily life",
            },
            {
              value: "severe",
              label: "Severe - Significant impact on daily functioning",
            },
          ].map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                if (!loading) {
                  setFormData((prev) => ({
                    ...prev,
                    severityLevel: option.value as any,
                  }));
                  setError(""); // Clear error when user makes a selection
                }
              }}
              disabled={loading}
              className={`p-3 rounded-md border ${
                formData.severityLevel === option.value
                  ? "bg-primary/10 border-primary"
                  : "bg-background border-border"
              } ${loading ? "opacity-50" : ""}`}
            >
              <Text className="text-foreground">{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="space-y-2">
        <Label className="font-semibold text-base">
          Have you had therapy or counseling before?
        </Label>
        <View className="flex-row space-x-4">
          {[
            { value: true, label: "Yes" },
            { value: false, label: "No" },
          ].map((option) => (
            <Pressable
              key={option.label}
              onPress={() => {
                if (!loading) {
                  setFormData((prev) => ({
                    ...prev,
                    previousTherapy: option.value,
                  }));
                  setError(""); // Clear error when user makes a selection
                }
              }}
              disabled={loading}
              className={`flex-1 p-3 rounded-lg border ${
                formData.previousTherapy === option.value
                  ? "bg-primary/10 border-primary"
                  : "bg-background border-border"
              } ${loading ? "opacity-50" : ""}`}
            >
              <Text className="text-foreground text-center">
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

        {/* Emergency Contact Section */}
        <View className="mt-6 pt-6 border-t border-border">
          <View className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
            <View className="flex-row items-start">
              <Ionicons
                name="information-circle"
                size={20}
                color="#f59e0b"
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <Text className="text-yellow-800 dark:text-yellow-200 text-sm flex-1">
                Emergency contact information helps us reach someone if you're in
                crisis and need immediate support.
              </Text>
            </View>
          </View>

          <View className="space-y-2">
            <Label className="font-semibold text-base">
              Emergency Contact Name
            </Label>
            <Input
              value={formData.emergencyContactName}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, emergencyContactName: text }));
                setError("");
              }}
              placeholder="Full name"
              editable={!loading}
              className="h-12 rounded-md px-4 bg-background border border-input text-base text-foreground"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="space-y-2">
            <Label className="font-semibold text-base">
              Emergency Contact Phone
            </Label>
            <Input
              value={formData.emergencyContactPhone}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, emergencyContactPhone: text }));
                setError("");
              }}
              placeholder="Phone number"
              keyboardType="phone-pad"
              editable={!loading}
              className="h-12 rounded-md px-4 bg-background border border-input text-base text-foreground"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="space-y-2">
            <Label className="font-semibold text-base">Relationship</Label>
            <Input
              value={formData.emergencyContactRelation}
              onChangeText={(text) => {
                setFormData((prev) => ({
                  ...prev,
                  emergencyContactRelation: text,
                }));
                setError("");
              }}
              placeholder="e.g., Parent, Spouse, Friend"
              editable={!loading}
              className="h-12 rounded-md px-4 bg-background border border-input text-base text-foreground"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="space-y-2 mt-4">
            <Label className="font-semibold text-base">
              Preferred Counsellor Gender
            </Label>
            <View className="space-y-2">
              {[
                { value: "no-preference", label: "No preference" },
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    if (!loading) {
                      setFormData((prev) => ({
                        ...prev,
                        preferredCounsellorGender: option.value as any,
                      }));
                      setError("");
                    }
                  }}
                  disabled={loading}
                  className={`p-3 rounded-md border ${
                    formData.preferredCounsellorGender === option.value
                      ? "bg-primary/10 border-primary"
                      : "bg-background border-border"
                  } ${loading ? "opacity-50" : ""}`}
                >
                  <Text className="text-foreground">{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </CardContent>
    </Animated.View>
  );
  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
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
              <Card
                style={{
                  elevation: 4,
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  borderRadius: 12,
                }}
              >
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center mb-2">
                    Sign Up as User
                  </CardTitle>
                  <CardDescription className="text-center mb-2">
                    Create your MindConnect account
                  </CardDescription>
                  {/* Step Indicator */}
                  <View className="flex-row justify-center items-center mb-2">
                    {[1, 2].map((step) => (
                      <View
                        key={step}
                        className={`w-3 h-3 rounded-full mx-1 ${currentStep === step ? "bg-primary" : "bg-muted"}`}
                      />
                    ))}
                  </View>
                </CardHeader>
                {/* Error Message */}
                {error ? (
                  <View className="bg-red-100 rounded-lg p-2 mb-2">
                    <Text className="text-red-700 text-center text-sm">
                      {error}
                    </Text>
                  </View>
                ) : null}
                {/* Loading Indicator */}
                {loading && (
                  <View className="mb-2">
                    <ActivityIndicator size="small" color="#3B82F6" />
                  </View>
                )}
                {/* Step Content */}
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {/* Navigation Buttons */}
                <CardContent>
                  <View className="flex-row justify-between mt-4">
                    <Button
                      variant="outline"
                      onPress={handleBack}
                      disabled={loading}
                      style={{ flex: 1, marginRight: 8 }}
                    >
                      <Text className="text-foreground">Back</Text>
                    </Button>
                    {currentStep < 2 ? (
                      <Button
                        onPress={handleNext}
                        disabled={loading || (currentStep === 1 && !isStep1Valid)}
                        style={{ flex: 1, marginLeft: 8 }}
                        className="rounded-md"
                      >
                        <Text className="text-primary-foreground">Next</Text>
                      </Button>
                    ) : (
                      <Button
                        onPress={handleSubmit}
                        disabled={loading || !isStep2Valid}
                        style={{ flex: 1, marginLeft: 8 }}
                        className="rounded-md"
                      >
                        <Text className="text-primary-foreground">Sign Up</Text>
                      </Button>
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
