import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="login" options={{ headerShown: false }} />
      <Tabs.Screen name="register" options={{ headerShown: false }} />
    </Tabs>
  );
}
