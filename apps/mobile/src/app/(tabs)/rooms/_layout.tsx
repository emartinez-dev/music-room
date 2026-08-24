import { Stack } from "expo-router";

export default function RoomsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Rooms" }} />
      <Stack.Screen name="[roomId]" />
    </Stack>
  );
}
