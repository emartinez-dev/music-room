import "../../global.css";

import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SnackbarProvider } from "@/context/SnackbarContext";
import { setupMocks } from "@/mocks/mocks";

if (__DEV__ && process.env.EXPO_PUBLIC_USE_MOCKS === "1") setupMocks();

export default function RootLayout() {
  return (
    <PaperProvider>
      <SnackbarProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </SnackbarProvider>
    </PaperProvider>
  );
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  return (
    <Stack>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
