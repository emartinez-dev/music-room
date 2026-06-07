import { Stack } from "expo-router";

export default function TabLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerTitle: "Create account" }} />
      <Stack.Screen name="reset" options={{ headerTitle: "Reset password" }} />
    </Stack>
  );
}
