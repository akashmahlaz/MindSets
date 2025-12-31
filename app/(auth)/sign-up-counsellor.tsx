import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { AdminService } from "@/services/adminService";
import {
    CounsellorProfileData,
    LICENSE_TYPES,
    MENTAL_HEALTH_CONCERNS,
    THERAPY_APPROACHES,
} from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
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
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface CounsellorSignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  licenseType: string;
  yearsExperience: string;
  specializations: string[];
  approaches: string[];
  hourlyRate: string;
  documents: {
    license?: DocumentPicker.DocumentPickerAsset;
    degree?: DocumentPicker.DocumentPickerAsset;
  };
}

export default function CounsellorSignUpScreen() {
  const router = useRouter();
  const { signUpEnhanced } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CounsellorSignUpData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    licenseNumber: "",
    licenseType: "",
    yearsExperience: "",
    specializations: [],
    approaches: [],
    hourlyRate: "",
    documents: {},
  });

  // Premium animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, fadeAnim, slideAnim]);

  // Premium Material Design 3 colors
  const colors = {
    background: isDarkColorScheme ? "#0F172A" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1E293B" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#334155" : "#F1F5F9",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#2AA79D",
    primaryContainer: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.08)",
    secondary: "#2AA79D",
    secondaryContainer: isDarkColorScheme ? "rgba(42, 167, 157, 0.15)" : "rgba(42, 167, 157, 0.08)",
    accent: "#3A9C94",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
    input: isDarkColorScheme ? "#1E293B" : "#F8FAFC",
    error: "#EF4444",
    success: "#2AA79D",
  };

  const pickDocument = async (type: "license" | "degree") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        setFormData((prev) => ({
          ...prev,
          documents: { ...prev.documents, [type]: result.assets[0] },
        }));
      }
    } catch {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const isStep1Valid =
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.firstName &&
    formData.lastName &&
    formData.password === formData.confirmPassword &&
    formData.password.length >= 6;

  const isStep2Valid =
    formData.licenseNumber &&
    formData.licenseType &&
    formData.yearsExperience &&
    formData.specializations.length > 0;

  const toggleSpecialization = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(item)
        ? prev.specializations.filter((s) => s !== item)
        : [...prev.specializations, item],
    }));
  };

  const toggleApproach = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      approaches: prev.approaches.includes(item)
        ? prev.approaches.filter((a) => a !== item)
        : [...prev.approaches, item],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const profileData: Partial<CounsellorProfileData> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `Dr. ${formData.firstName} ${formData.lastName}`,
        licenseNumber: formData.licenseNumber,
        licenseType: formData.licenseType,
        yearsExperience: parseInt(formData.yearsExperience),
        specializations: formData.specializations,
        approaches: formData.approaches,
        hourlyRate: parseFloat(formData.hourlyRate) || undefined,
        languages: ["English"],
        acceptsNewClients: true,
        verificationStatus: "pending",
        availableHours: { timezone: "UTC" },
      };

      const userCredential = await signUpEnhanced(
        formData.email,
        formData.password,
        profileData,
        "counsellor",
      );

      if (userCredential?.user?.uid && Object.keys(formData.documents).length > 0) {
        try {
          const uploadedDocuments = await AdminService.uploadCounsellorDocuments(
            formData.documents,
            userCredential.user.uid,
          );
          await AdminService.updateCounsellorDocuments(
            userCredential.user.uid,
            uploadedDocuments,
          );
        } catch (uploadError) {
          console.error("Error uploading documents:", uploadError);
        }
      }

      Alert.alert(
        "Application Submitted! 📧",
        "Thank you for applying! We've sent a verification email to your address. Please verify your email. Your application is under review and we'll contact you within 3-5 business days.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/sign-in") }],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Personal & Account Info
  const renderStep1 = () => (
    <View style={{ gap: 20 }}>
      {/* Section Header */}
      <View style={{ alignItems: "center", marginBottom: 8 }}>
        <LinearGradient
          colors={["#2AA79D", "#3A9C94"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 64, height: 64, borderRadius: 20,
            alignItems: "center", justifyContent: "center", marginBottom: 16
          }}
        >
          <Ionicons name="person-outline" size={32} color="#FFFFFF" />
        </LinearGradient>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, letterSpacing: -0.3 }}>
          Personal Information
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6 }}>
          Let&apos;s start with your basic details
        </Text>
      </View>

      {/* Name Row */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            First Name
          </Text>
          <Input
            value={formData.firstName}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, firstName: text }))}
            placeholder="John"
            style={{
              height: 54, borderRadius: 14, paddingHorizontal: 16,
              backgroundColor: colors.input,
              borderWidth: 2, borderColor: formData.firstName ? colors.primary : colors.border,
              fontSize: 16, color: colors.text
            }}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Last Name
          </Text>
          <Input
            value={formData.lastName}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, lastName: text }))}
            placeholder="Smith"
            style={{
              height: 54, borderRadius: 14, paddingHorizontal: 16,
              backgroundColor: colors.input,
              borderWidth: 2, borderColor: formData.lastName ? colors.primary : colors.border,
              fontSize: 16, color: colors.text
            }}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      {/* Email */}
      <View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Professional Email
        </Text>
        <Input
          value={formData.email}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
          placeholder="dr.smith@clinic.com"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            height: 54, borderRadius: 14, paddingHorizontal: 16,
            backgroundColor: colors.input,
            borderWidth: 2, borderColor: formData.email.includes("@") ? colors.success : (formData.email ? colors.primary : colors.border),
            fontSize: 16, color: colors.text
          }}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Password */}
      <View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Password
        </Text>
        <Input
          value={formData.password}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, password: text }))}
          placeholder="Create a secure password"
          secureTextEntry
          style={{
            height: 54, borderRadius: 14, paddingHorizontal: 16,
            backgroundColor: colors.input,
            borderWidth: 2, borderColor: formData.password.length >= 6 ? colors.success : (formData.password ? colors.primary : colors.border),
            fontSize: 16, color: colors.text
          }}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Confirm Password */}
      <View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Confirm Password
        </Text>
        <Input
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmPassword: text }))}
          placeholder="Confirm your password"
          secureTextEntry
          style={{
            height: 54, borderRadius: 14, paddingHorizontal: 16,
            backgroundColor: colors.input,
            borderWidth: 2, borderColor: (formData.password === formData.confirmPassword && formData.confirmPassword) ? colors.success : (formData.confirmPassword ? colors.primary : colors.border),
            fontSize: 16, color: colors.text
          }}
          placeholderTextColor={colors.textSecondary}
        />
        {formData.password !== formData.confirmPassword && formData.confirmPassword ? (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <Ionicons name="alert-circle" size={14} color={colors.error} />
            <Text style={{ color: colors.error, fontSize: 12, marginLeft: 6 }}>Passwords do not match</Text>
          </View>
        ) : formData.password === formData.confirmPassword && formData.confirmPassword ? (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={{ color: colors.success, fontSize: 12, marginLeft: 6 }}>Passwords match</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  // Step 2: Professional Credentials & Specializations
  const renderStep2 = () => (
    <View style={{ gap: 20 }}>
      {/* Section Header */}
      <View style={{ alignItems: "center", marginBottom: 8 }}>
        <LinearGradient
          colors={["#2AA79D", "#248F87"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 64, height: 64, borderRadius: 20,
            alignItems: "center", justifyContent: "center", marginBottom: 16
          }}
        >
          <Ionicons name="medal-outline" size={32} color="#FFFFFF" />
        </LinearGradient>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, letterSpacing: -0.3 }}>
          Professional Credentials
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6 }}>
          Your qualifications and expertise
        </Text>
      </View>

      {/* License Number & Years */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            License Number
          </Text>
          <Input
            value={formData.licenseNumber}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, licenseNumber: text }))}
            placeholder="LIC-12345"
            style={{
              height: 54, borderRadius: 14, paddingHorizontal: 16,
              backgroundColor: colors.input,
              borderWidth: 2, borderColor: formData.licenseNumber ? colors.primary : colors.border,
              fontSize: 16, color: colors.text
            }}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Experience (Years)
          </Text>
          <Input
            value={formData.yearsExperience}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, yearsExperience: text }))}
            placeholder="5"
            keyboardType="numeric"
            style={{
              height: 54, borderRadius: 14, paddingHorizontal: 16,
              backgroundColor: colors.input,
              borderWidth: 2, borderColor: formData.yearsExperience ? colors.primary : colors.border,
              fontSize: 16, color: colors.text
            }}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      {/* License Type */}
      <View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          License Type
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {LICENSE_TYPES.slice(0, 6).map((license) => (
              <Pressable
                key={license}
                onPress={() => setFormData((prev) => ({ ...prev, licenseType: license }))}
                style={{
                  paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24,
                  backgroundColor: formData.licenseType === license ? colors.primary : colors.surfaceVariant,
                  borderWidth: 2,
                  borderColor: formData.licenseType === license ? colors.primary : "transparent",
                }}
              >
                <Text style={{
                  fontSize: 14, fontWeight: "600",
                  color: formData.licenseType === license ? "#FFFFFF" : colors.text,
                }}>
                  {license}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Specializations */}
      <View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Specializations (Select at least 1)
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {MENTAL_HEALTH_CONCERNS.slice(0, 10).map((spec) => (
            <Pressable
              key={spec}
              onPress={() => toggleSpecialization(spec)}
              style={{
                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                backgroundColor: formData.specializations.includes(spec) ? colors.secondary : colors.surfaceVariant,
                borderWidth: 2,
                borderColor: formData.specializations.includes(spec) ? colors.secondary : "transparent",
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: "600",
                color: formData.specializations.includes(spec) ? "#FFFFFF" : colors.text,
              }}>
                {spec.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Therapy Approaches */}
      <View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Therapy Approaches
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {THERAPY_APPROACHES.slice(0, 6).map((approach) => (
            <Pressable
              key={approach}
              onPress={() => toggleApproach(approach)}
              style={{
                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                backgroundColor: formData.approaches.includes(approach) ? colors.accent : colors.surfaceVariant,
                borderWidth: 2,
                borderColor: formData.approaches.includes(approach) ? colors.accent : "transparent",
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: "600",
                color: formData.approaches.includes(approach) ? "#FFFFFF" : colors.text,
              }}>
                {approach}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Hourly Rate */}
      <View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Hourly Rate (USD) - Optional
        </Text>
        <Input
          value={formData.hourlyRate}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, hourlyRate: text }))}
          placeholder="e.g., 120"
          keyboardType="numeric"
          style={{
            height: 54, borderRadius: 14, paddingHorizontal: 16,
            backgroundColor: colors.input,
            borderWidth: 2, borderColor: formData.hourlyRate ? colors.primary : colors.border,
            fontSize: 16, color: colors.text
          }}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Document Upload */}
      <View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Documents (Optional - can upload later)
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => pickDocument("license")}
            style={{
              flex: 1, height: 90, borderRadius: 16,
              backgroundColor: colors.surfaceVariant,
              borderWidth: 2, borderStyle: "dashed",
              borderColor: formData.documents.license ? colors.success : colors.border,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons 
              name={formData.documents.license ? "checkmark-circle" : "document-outline"} 
              size={28} 
              color={formData.documents.license ? colors.success : colors.textSecondary} 
            />
            <Text style={{ fontSize: 13, fontWeight: "600", color: formData.documents.license ? colors.success : colors.textSecondary, marginTop: 6 }}>
              {formData.documents.license ? "License ✓" : "License"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => pickDocument("degree")}
            style={{
              flex: 1, height: 90, borderRadius: 16,
              backgroundColor: colors.surfaceVariant,
              borderWidth: 2, borderStyle: "dashed",
              borderColor: formData.documents.degree ? colors.success : colors.border,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons 
              name={formData.documents.degree ? "checkmark-circle" : "school-outline"} 
              size={28} 
              color={formData.documents.degree ? colors.success : colors.textSecondary} 
            />
            <Text style={{ fontSize: 13, fontWeight: "600", color: formData.documents.degree ? colors.success : colors.textSecondary, marginTop: 6 }}>
              {formData.documents.degree ? "Degree ✓" : "Degree"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Info Box */}
      <View style={{
        backgroundColor: colors.primaryContainer,
        padding: 18, borderRadius: 16,
        borderWidth: 1, borderColor: colors.primary + "30",
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <View style={{ 
            width: 32, height: 32, borderRadius: 10, 
            backgroundColor: colors.primary + "20", 
            alignItems: "center", justifyContent: "center" 
          }}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary, marginLeft: 10 }}>
            Review Process
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>
          Your application will be reviewed within 3-5 business days. We&apos;ll verify your credentials and contact you with next steps.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* Premium Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable
          onPress={() => currentStep === 1 ? router.back() : setCurrentStep(1)}
          style={{
            width: 44, height: 44, borderRadius: 14,
            backgroundColor: colors.surfaceVariant,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, letterSpacing: -0.3 }}>
            Join as Professional
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <View style={{ 
              width: 8, height: 8, borderRadius: 4, 
              backgroundColor: colors.primary, marginRight: 6 
            }} />
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: "500" }}>
              Step {currentStep} of 2
            </Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress Bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <View style={{ 
          height: 6, 
          backgroundColor: colors.surfaceVariant, 
          borderRadius: 3,
          overflow: "hidden"
        }}>
          <LinearGradient
            colors={["#2AA79D", "#3A9C94"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 6, 
              width: `${currentStep * 50}%`, 
              borderRadius: 3,
            }}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {currentStep === 1 ? renderStep1() : renderStep2()}
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Bottom Action - Fixed with safe area */}
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: Math.max(insets.bottom, 20),
        backgroundColor: colors.background,
        borderTopWidth: 1, borderTopColor: colors.border,
      }}>
        <Pressable
          onPress={currentStep === 1 ? () => setCurrentStep(2) : handleSubmit}
          disabled={loading || (currentStep === 1 ? !isStep1Valid : !isStep2Valid)}
          style={{ opacity: loading || (currentStep === 1 ? !isStep1Valid : !isStep2Valid) ? 0.6 : 1 }}
        >
          <LinearGradient
            colors={(currentStep === 1 ? isStep1Valid : isStep2Valid) ? ["#2AA79D", "#3A9C94"] : [colors.surfaceVariant, colors.surfaceVariant]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 56, borderRadius: 16,
              alignItems: "center", justifyContent: "center",
              flexDirection: "row",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: (currentStep === 1 ? isStep1Valid : isStep2Valid) ? 0.3 : 0,
              shadowRadius: 12,
              elevation: (currentStep === 1 ? isStep1Valid : isStep2Valid) ? 6 : 0,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={{ 
                  fontSize: 17, 
                  fontWeight: "700", 
                  color: (currentStep === 1 ? isStep1Valid : isStep2Valid) ? "#FFFFFF" : colors.textSecondary 
                }}>
                  {currentStep === 1 ? "Continue" : "Submit Application"}
                </Text>
                <Ionicons 
                  name={currentStep === 1 ? "arrow-forward" : "checkmark-circle"} 
                  size={20} 
                  color={(currentStep === 1 ? isStep1Valid : isStep2Valid) ? "#FFFFFF" : colors.textSecondary} 
                  style={{ marginLeft: 8 }} 
                />
              </>
            )}
          </LinearGradient>
        </Pressable>

        {currentStep === 1 && (
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>Already have an account? </Text>
            <Pressable onPress={() => router.push("/(auth)/sign-in")}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>Sign In</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
