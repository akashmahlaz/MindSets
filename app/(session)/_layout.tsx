import { Stack } from "expo-router";

export default function SessionLayout() {
  return (
    <Stack>
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
