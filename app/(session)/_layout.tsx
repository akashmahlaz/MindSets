import { useColorScheme } from "@/lib/useColorScheme";
import { Stack } from "expo-router";

export default function SessionLayout() {
  const { isDarkColorScheme } = useColorScheme();
  const backgroundColor = isDarkColorScheme ? "#0C0F14" : "#FAFBFC";

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor },
        animation: "fade",
      }}
    >
      <Stack.Screen
        name="book-session"
        options={{
          title: "Book Session",
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
