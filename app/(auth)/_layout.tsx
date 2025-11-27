import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ animation: "slide_from_right" }}>
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
    </Stack>
  );
}
