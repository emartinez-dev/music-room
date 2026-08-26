import { router, Stack } from "expo-router";
import { IconButton } from "react-native-paper";

export default function TabLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerTitle: "Create account" }} />
      <Stack.Screen
        name="reset-password"
        options={{
          headerTitle: "Reset password",
          headerLeft: () => (
            <IconButton
              icon="arrow-left"
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/(auth)/login"))}
            />
          ),
        }}
      />
      <Stack.Screen name="verify-email" options={{ headerTitle: "Verify email" }} />
    </Stack>
  );
}
