import { useColorScheme } from "@/lib/useColorScheme";
import { Stack } from "expo-router";

export default function CallLayout() {
  const { isDarkColorScheme } = useColorScheme();
  const backgroundColor = isDarkColorScheme ? "#0C0F14" : "#FAFBFC";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
        animation: "fade",
      }}
    >
      <Stack.Screen name="[callId]" />
    </Stack>
  );
}
