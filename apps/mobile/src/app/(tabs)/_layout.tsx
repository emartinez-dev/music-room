import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="rooms" options={{ title: "Rooms", headerShown: false }} />
      <Tabs.Screen name="about" options={{ title: "About" }} />
    </Tabs>
  );
}
