import { AxiosError } from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { Api } from "@/services/api";
import { resendVerificationApi } from "@/services/auth";
import { saveTokens } from "@/services/secureStore";

export default function VerifyEmailScreen() {
  const { token, email } = useLocalSearchParams<{ token?: string; email?: string }>();
  const [isLoading, setIsLoading] = useState(!!token);
  const [isResending, setIsResending] = useState(false);
  const { checkAuth, me } = useAuth();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const { data } = await Api.post("/auth/verify-email/", { token });

        await saveTokens(data.access, data.refresh);
        await checkAuth();
        await me(true);
        router.replace("/(tabs)");
      } catch (error) {
        if (error instanceof AxiosError) {
          showSnackbar(error.response?.data?.message ?? "Please try again");
        } else {
          showSnackbar("Please try again");
        }
        setIsLoading(false);
      }
    };

    void verify();
  }, [token]);

  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      await resendVerificationApi(email);
      showSnackbar(`Verification email sent to ${email}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        showSnackbar(error.response?.data?.message ?? "Could not resend email");
      } else {
        showSnackbar("Could not resend email");
      }
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-2">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-2">
      <Text>Open the link from your email to verify your account.</Text>
      {email ? (
        <Button mode="text" onPress={handleResend} disabled={isResending}>
          Resend verification email
        </Button>
      ) : null}
    </View>
  );
}
