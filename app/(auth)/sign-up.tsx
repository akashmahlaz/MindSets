import { Button } from "@/components/ui/button";
import { useColorScheme } from "@/lib/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const { role } = useLocalSearchParams<{ role: "user" | "counsellor" }>();

  useEffect(() => {
    // If role is provided, redirect to the appropriate sign-up form
    if (role) {
      if (role === "user") {
        router.replace("/(auth)/sign-up-user");
      } else if (role === "counsellor") {
        router.replace("/(auth)/sign-up-counsellor");
      }
    }
  }, [role, router]);

  const handleRoleSelection = (selectedRole: "user" | "counsellor") => {
    if (selectedRole === "user") {
      router.push("/(auth)/sign-up-user");
    } else {
      router.push("/(auth)/sign-up-counsellor");
    }
  };

  // If role is already provided, show loading or redirect immediately
  if (role) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
          backgroundColor={isDarkColorScheme ? "#0f172a" : "#ffffff"}
        />
        <View className="items-center">
          <View className="w-16 h-16 bg-blue-500 rounded-full items-center justify-center mb-4">
            <Ionicons name="hourglass" size={24} color="white" />
          </View>
          <Text className="text-foreground text-lg font-medium">
            Setting up your account...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  // Fallback: Show role selection if no role is provided
  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? "#0f172a" : "#ffffff"}
      />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-10">
          <View className="w-24 h-24 bg-primary rounded-3xl items-center justify-center mb-6 shadow-lg">
            <Ionicons name="heart" size={40} color="white" />
          </View>
          <Text className="text-3xl font-bold text-foreground text-center mb-3">
            Join Mind Sets
          </Text>
          <Text className="text-muted-foreground text-center text-lg leading-relaxed max-w-sm">
            Start your mental wellness journey with professional support
          </Text>
        </View>

        {/* Role Selection Cards */}
        <View className="space-y-6 mb-10">
          {/* User Role Card */}
          <Pressable
            onPress={() => handleRoleSelection("user")}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm active:opacity-95"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center space-x-4 mb-6">
              <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl items-center justify-center">
                <Ionicons name="person" size={28} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-foreground mb-2">
                  I'm seeking support
                </Text>
                <Text className="text-muted-foreground text-base leading-relaxed">
                  Connect with licensed professionals for therapy and counseling
                </Text>
              </View>
            </View>

            <Button className="w-full h-12 bg-blue-500 rounded-xl">
              <Text className="text-white font-semibold text-base">
                Get Started
              </Text>
            </Button>
          </Pressable>

          {/* Professional Role Card */}
          <Pressable
            onPress={() => handleRoleSelection("counsellor")}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm active:opacity-95"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center space-x-4 mb-6">
              <View className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl items-center justify-center">
                <Ionicons name="medical" size={28} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-foreground mb-2">
                  I'm a mental health professional
                </Text>
                <Text className="text-muted-foreground text-base leading-relaxed">
                  Provide professional therapy and support to those in need
                </Text>
              </View>
            </View>

            <Button
              variant="outline"
              className="w-full h-12 border-green-500 rounded-xl"
            >
              <Text className="text-green-500 font-semibold text-base">
                Join as Professional
              </Text>
            </Button>
          </Pressable>
        </View>

        {/* Sign In Link */}
        <View className="items-center">
          <Text className="text-muted-foreground text-base mb-3">
            Already have an account?
          </Text>
          <Pressable onPress={() => router.push("/(auth)/sign-in")}>
            <Text className="text-blue-500 font-semibold text-base">
              Sign In
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
