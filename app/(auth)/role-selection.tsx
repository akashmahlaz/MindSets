import { Button } from "@/components/ui/button";
import { useColorScheme } from "@/lib/useColorScheme";
import { UserRole } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? "#0f172a" : "#ffffff"}
      />

      <ScrollView
        className="flex-1 px-6 py-16"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", maxWidth: 400, alignSelf: "center", width: "100%" }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="items-center mb-16">
          <Text className="text-3xl font-semibold text-foreground text-center mb-8">
            Choose your role
          </Text>
        </View>
        {/* Role Selection Cards */}
        <View className="mb-16">
          {/* User/Client Option */}
          <Pressable
            onPress={() => handleRoleSelect("user")}
            className={`rounded-lg p-8 mb-6 bg-card ${
              selectedRole === "user"
                ? "bg-primary/5 dark:bg-primary/10"
                : ""
            }`}
          >
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text
                  className={`font-semibold text-xl mb-2 ${
                    selectedRole === "user"
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  I&apos;m seeking support
                </Text>
                <Text className="text-muted-foreground text-base leading-relaxed">
                  Connect with licensed mental health professionals for therapy
                  and counseling
                </Text>
              </View>
              {selectedRole === "user" && (
                <View className="ml-4">
                  <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                </View>
              )}
            </View>
          </Pressable>

          {/* Counsellor/Professional Option */}
          <Pressable
            onPress={() => handleRoleSelect("counsellor")}
            className={`rounded-lg p-8 bg-card ${
              selectedRole === "counsellor"
                ? "bg-primary/5 dark:bg-primary/10"
                : ""
            }`}
          >
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text
                  className={`font-semibold text-xl mb-2 ${
                    selectedRole === "counsellor"
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  I&apos;m a mental health professional
                </Text>
                <Text className="text-muted-foreground text-base leading-relaxed">
                  Join our platform to provide therapy and support to those in
                  need
                </Text>
              </View>
              {selectedRole === "counsellor" && (
                <View className="ml-4">
                  <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                </View>
              )}
            </View>
          </Pressable>
        </View>
        {/* Action Buttons */}
        <View className="space-y-6">
          <Button
            onPress={handleContinue}
            disabled={!selectedRole}
            variant={selectedRole ? "default" : "outline"}
            className="w-full"
          >
            <Text
              className={`font-semibold ${
                selectedRole ? "text-primary-foreground" : "text-foreground"
              }`}
            >
              Continue
            </Text>
          </Button>

          <View className="flex-row justify-center items-center pt-8">
            <Text className="text-muted-foreground text-base">
              Already have an account?{" "}
            </Text>
            <Pressable onPress={() => router.replace("/(auth)/sign-in")}>
              <Text className="text-primary font-semibold text-base">
                Sign In
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
