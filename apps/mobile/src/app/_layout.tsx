import "../../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { SnackbarProvider } from "@/context/SnackbarContext";
import { setupMocks } from "@/mocks/mocks";
import { colors } from "@/theme/colors";
import { paperTheme } from "@/theme/paperTheme";

if (__DEV__ && process.env.EXPO_PUBLIC_USE_MOCKS === "1") setupMocks();

export default function RootLayout() {
  return (
    <PaperProvider theme={paperTheme}>
      <SnackbarProvider>
        <AuthProvider>
          <PlayerProvider>
            <StatusBar style="light" />
            <RootLayoutNav />
          </PlayerProvider>
        </AuthProvider>
      </SnackbarProvider>
    </PaperProvider>
  );
}

function RootLayoutNav() {
  const { isAuthenticated, isCheckingAuth } = useAuth();

  if (isCheckingAuth) return null;
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="spotify-link-modal" options={{ presentation: "modal" }} />
        <Stack.Screen name="player" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="queue" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="profile" options={{ animation: "slide_from_right" }} />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
