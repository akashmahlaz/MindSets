import { useColorScheme } from "@/lib/useColorScheme";
import { Stack } from "expo-router";
import React from "react";

export default function ResourcesLayout() {
  const { isDarkColorScheme } = useColorScheme();
  const backgroundColor = isDarkColorScheme ? "#0C0F14" : "#FAFBFC";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="journal" />
      <Stack.Screen name="meditation" />
      <Stack.Screen name="breathing" />
      <Stack.Screen name="sleep" />
      <Stack.Screen name="articles/index" />
      <Stack.Screen name="articles/[articleId]" />
      <Stack.Screen name="articles/create" />
    </Stack>
  );
}
