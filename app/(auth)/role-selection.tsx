import { useColorScheme } from "@/lib/useColorScheme";
import { UserRole } from "@/types/user";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Dimensions, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Premium color scheme
  const colors = {
    background: isDarkColorScheme ? "#0F1419" : "#FAFBFC",
    card: isDarkColorScheme ? "#171D26" : "#FFFFFF",
    text: isDarkColorScheme ? "#F0F2F5" : "#1E2530",
    textSecondary: isDarkColorScheme ? "#8B95A5" : "#747B8A",
    primary: isDarkColorScheme ? "#6B8CF5" : "#4A6CF4",
    secondary: isDarkColorScheme ? "#4CC38A" : "#3FA57A",
    accent: isDarkColorScheme ? "#B79CFC" : "#A78BFA",
    border: isDarkColorScheme ? "#323A48" : "#E2E5E9",
    cardSelected: isDarkColorScheme ? "#1E2B4A" : "#EEF4FF",
    borderSelected: isDarkColorScheme ? "#6B8CF5" : "#4A6CF4",
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      router.push({
        pathname: "/(auth)/sign-up",
        params: { role: selectedRole },
      });
    }
  };

  const roleOptions = [
    {
      id: "user" as UserRole,
      icon: "heart-outline",
      title: "I'm seeking support",
      description: "Connect with licensed mental health professionals for personalized therapy and counseling sessions.",
      features: ["1-on-1 video sessions", "Chat with counselors", "Track your progress"],
      gradient: [colors.primary, colors.accent],
    },
    {
      id: "counsellor" as UserRole,
      icon: "medical-outline",
      title: "I'm a mental health professional",
      description: "Join our platform to provide therapy and support to those in need through our secure platform.",
      features: ["Manage your practice", "Connect with clients", "Flexible scheduling"],
      gradient: [colors.secondary, colors.primary],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          flexGrow: 1, 
          paddingHorizontal: 24,
          paddingTop: 48,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          {/* Logo/Brand Icon */}
          <View 
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: colors.primary + "15",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <MaterialCommunityIcons name="brain" size={40} color={colors.primary} />
          </View>
          
          <Text 
            style={{ 
              fontSize: 28, 
              fontWeight: "700", 
              color: colors.text,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Welcome to MindSets
          </Text>
          <Text 
            style={{ 
              fontSize: 16, 
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 24,
              maxWidth: 320,
            }}
          >
            Your journey to mental wellness starts here. Choose how you'd like to get started.
          </Text>
        </View>

        {/* Role Selection Cards */}
        <View style={{ marginBottom: 32 }}>
          {roleOptions.map((option, index) => {
            const isSelected = selectedRole === option.id;
            
            return (
              <Pressable
                key={option.id}
                onPress={() => handleRoleSelect(option.id)}
                style={{ marginBottom: index === 0 ? 16 : 0 }}
              >
                <View 
                  style={{
                    backgroundColor: isSelected ? colors.cardSelected : colors.card,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.borderSelected : colors.border,
                    padding: 24,
                    overflow: "hidden",
                  }}
                >
                  {/* Icon and Checkmark Row */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <View 
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        backgroundColor: isSelected ? colors.primary + "20" : colors.primary + "10",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons 
                        name={option.icon as any} 
                        size={28} 
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                    </View>
                    
                    {isSelected && (
                      <View 
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: colors.primary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="checkmark" size={18} color="#FFF" />
                      </View>
                    )}
                  </View>
                  
                  {/* Content */}
                  <Text 
                    style={{ 
                      fontSize: 18, 
                      fontWeight: "700", 
                      color: isSelected ? colors.primary : colors.text,
                      marginBottom: 8,
                    }}
                  >
                    {option.title}
                  </Text>
                  <Text 
                    style={{ 
                      fontSize: 14, 
                      color: colors.textSecondary,
                      lineHeight: 21,
                      marginBottom: 16,
                    }}
                  >
                    {option.description}
                  </Text>
                  
                  {/* Features */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {option.features.map((feature, idx) => (
                      <View 
                        key={idx}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: isSelected ? colors.primary + "10" : colors.background,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 20,
                        }}
                      >
                        <Ionicons 
                          name="checkmark-circle" 
                          size={14} 
                          color={isSelected ? colors.primary : colors.textSecondary}
                          style={{ marginRight: 4 }}
                        />
                        <Text 
                          style={{ 
                            fontSize: 12, 
                            fontWeight: "500",
                            color: isSelected ? colors.primary : colors.textSecondary,
                          }}
                        >
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={{ marginTop: "auto" }}>
          <Pressable
            onPress={handleContinue}
            disabled={!selectedRole}
            style={{
              backgroundColor: selectedRole ? colors.primary : colors.border,
              borderRadius: 14,
              paddingVertical: 18,
              alignItems: "center",
              marginBottom: 16,
              opacity: selectedRole ? 1 : 0.6,
            }}
          >
            <Text 
              style={{ 
                fontSize: 16, 
                fontWeight: "600",
                color: selectedRole ? "#FFFFFF" : colors.textSecondary,
              }}
            >
              Continue
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 15, color: colors.textSecondary }}>
              Already have an account?{" "}
            </Text>
            <Pressable onPress={() => router.replace("/(auth)/sign-in")}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.primary }}>
                Sign In
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}