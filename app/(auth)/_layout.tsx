import { useColorScheme } from "@/lib/useColorScheme";
import { Stack } from "expo-router";

export default function AuthLayout() {
  const { isDarkColorScheme } = useColorScheme();
  const backgroundColor = isDarkColorScheme ? "#0C0F14" : "#FAFBFC";

  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen
        name="onboarding"
        options={{ title: "Welcome", headerShown: false }}
      />
      <Stack.Screen
        name="role-selection"
        options={{ title: "Choose Your Role", headerShown: false }}
      />
      <Stack.Screen
        name="sign-in"
        options={{ title: "Sign In", headerShown: false }}
      />
      <Stack.Screen
        name="sign-up"
        options={{ title: "Sign Up", headerShown: false }}
      />
      <Stack.Screen
        name="sign-up-user"
        options={{ title: "User Sign Up", headerShown: false }}
      />
      <Stack.Screen
        name="sign-up-counsellor"
        options={{ title: "Counsellor Application", headerShown: false }}
      />
      <Stack.Screen
        name="verify-email"
        options={{ title: "Verify Email", headerShown: false }}
      />
    </Stack>
  );
}
