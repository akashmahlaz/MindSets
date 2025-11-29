import { Stack } from "expo-router";
import React from "react";

export default function ResourcesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
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
