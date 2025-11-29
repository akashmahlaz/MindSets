import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: "user" | "counsellor" }>();

  useEffect(() => {
    // Redirect based on role or default to role selection
    if (role === "user") {
      router.replace("/(auth)/sign-up-user");
    } else if (role === "counsellor") {
      router.replace("/(auth)/sign-up-counsellor");
    } else {
      router.replace("/(auth)/role-selection");
    }
  }, [role, router]);

  return (
    <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color="#2AA79D" />
    </SafeAreaView>
  );
}
