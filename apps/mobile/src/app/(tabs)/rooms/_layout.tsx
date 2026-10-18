import { Stack } from "expo-router";

import { colors } from "@/theme/colors";

export default function RoomsLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen name="index" options={{ title: "Your Library" }} />
      <Stack.Screen name="[roomId]" />
    </Stack>
  );
}
