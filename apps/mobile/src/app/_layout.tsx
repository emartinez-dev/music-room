import "../../global.css";

import { router, Stack } from "expo-router";
import { useEffect } from "react";
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
  const { isAuthenticated, isCheckingAuth, spotifyLinked } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !isCheckingAuth && !spotifyLinked) {
      router.push("/spotify-link-modal");
    }
  }, [isAuthenticated, isCheckingAuth, spotifyLinked]);

  if (isCheckingAuth) return null;
  return (
    <Stack>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="spotify-link-modal" options={{ presentation: "modal" }} />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
