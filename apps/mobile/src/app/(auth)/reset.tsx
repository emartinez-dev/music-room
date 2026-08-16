import { AxiosError } from "axios";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useSnackbar } from "@/context/SnackbarContext";
import { Api } from "@/services/api";

export default function ResetScreen() {
  const [step, setStep] = useState<"email" | "confirm">("email");

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { showSnackbar } = useSnackbar();

  const handleRequestReset = async () => {
    setIsLoading(true);
    try {
      await Api.post("/auth/request-password-reset/", { email });
      showSnackbar(`Please check ${email} for your verification code`);
      setStep("confirm");
    } catch (error) {
      if (error instanceof AxiosError) {
        showSnackbar(error.response?.data?.message ?? "Request failed");
      } else {
        showSnackbar("Request failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    try {
      await Api.post("/auth/reset-password/", {
        email,
        token,
        new_password: newPassword,
      });

      showSnackbar("Password reset successful. Please log in.");
      router.replace("/(auth)/login");
    } catch (error) {
      if (error instanceof AxiosError) {
        showSnackbar(error.response?.data?.message ?? "Reset failed");
      } else {
        showSnackbar("Reset failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex m-4 gap-2">
      {step === "email" ? (
        <>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            left={<TextInput.Icon icon="email" />}
          />
          <Button mode="contained" onPress={handleRequestReset} disabled={isLoading}>
            Request password reset
          </Button>
        </>
      ) : (
        <>
          <TextInput
            label="Verification code"
            value={token}
            onChangeText={setToken}
            mode="outlined"
            autoCapitalize="none"
            autoComplete="one-time-code"
            left={<TextInput.Icon icon="email-check" />}
          />
          <TextInput
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            mode="outlined"
            secureTextEntry
            autoComplete="new-password"
            left={<TextInput.Icon icon="lock" />}
          />
          <Button mode="contained" onPress={handleResetPassword} disabled={isLoading}>
            Reset password
          </Button>
        </>
      )}
    </View>
  );
}
