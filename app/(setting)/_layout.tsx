import { useColorScheme } from "@/lib/useColorScheme";
import { Stack } from "expo-router";

export default function SettingLayout() {
  const { isDarkColorScheme } = useColorScheme();
  
  // Match the settings screen background color to prevent white flash
  const backgroundColor = isDarkColorScheme ? "#0F1117" : "#FFFFFF";
  
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor },
        animation: "fade",
      }}
    >
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
