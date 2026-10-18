import { Ionicons } from "@expo/vector-icons";
import { AxiosError } from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { PillButton } from "@/components/ui/PillButton";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { Api } from "@/services/api";
import { resendVerificationApi } from "@/services/auth";
import { saveTokens } from "@/services/secureStore";
import { colors } from "@/theme/colors";

// Guards against Android redelivering the link's Intent and remounting with a stale token
const processedTokens = new Set<string>();

export default function VerifyEmailScreen() {
  const { token, email } = useLocalSearchParams<{ token?: string; email?: string }>();
  const [isLoading, setIsLoading] = useState(!!token && !processedTokens.has(token));
  const [isResending, setIsResending] = useState(false);
  const { checkAuth, refreshProfile } = useAuth();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (!token || processedTokens.has(token)) return;
    processedTokens.add(token);

    const verify = async () => {
      try {
        const { data } = await Api.post("/auth/verify-email/", { token });

        await saveTokens(data.access, data.refresh);
        await checkAuth();
        await refreshProfile();
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
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Ionicons name="mail-unread-outline" size={72} color={colors.green} />
      <Text style={styles.title}>Check your inbox</Text>
      <Text style={styles.text}>Open the link from your email to verify your account.</Text>
      {email ? (
        <PillButton
          label="Resend verification email"
          variant="outline"
          onPress={handleResend}
          disabled={isResending}
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
    backgroundColor: colors.background,
  },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", textAlign: "center" },
  text: { color: colors.textSubdued, fontSize: 15, textAlign: "center" },
  button: { marginTop: 16 },
});
