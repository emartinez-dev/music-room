import { router, Stack } from "expo-router";
import { IconButton } from "react-native-paper";

import { colors } from "@/theme/colors";

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "700" },
        headerTitleAlign: "center",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerTitle: "Create account" }} />
      <Stack.Screen
        name="reset-password"
        options={{
          headerTitle: "Reset password",
          headerLeft: () => (
            <IconButton
              icon="arrow-left"
              iconColor={colors.text}
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/(auth)/login"))}
            />
          ),
        }}
      />
      <Stack.Screen name="verify-email" options={{ headerTitle: "Verify email" }} />
    </Stack>
  );
}
