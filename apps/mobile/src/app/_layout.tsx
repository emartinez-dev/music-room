import { Slot, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { setupMocks } from "@/mocks/mocks";

import "../../global.css";

if (__DEV__) setupMocks();

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </PaperProvider>
  );
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Slot />;
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
