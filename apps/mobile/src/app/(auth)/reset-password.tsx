import { AxiosError } from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useSnackbar } from "@/context/SnackbarContext";
import { Api } from "@/services/api";

export default function ResetScreen() {
  const { token, email: emailParam } = useLocalSearchParams<{ token?: string; email?: string }>();

  const [email, setEmail] = useState(emailParam ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  const { showSnackbar } = useSnackbar();

  const handleRequestReset = async () => {
    setIsLoading(true);
    try {
      await Api.post("/auth/request-password-reset/", { email });
      showSnackbar(`Please check ${email} for a reset link`);
      setRequested(true);
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
    if (newPassword !== confirmPassword) {
      showSnackbar("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await Api.post("/auth/reset-password/", {
        email,
        token,
        new_password: newPassword,
      });

      showSnackbar("Password reset successful. Please log in.");
      router.dismissAll();
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

  if (token) {
    return (
      <View className="flex m-4 gap-2">
        <TextInput
          key={`password-${showPassword ? "visible" : "hidden"}`}
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          mode="outlined"
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />
        <TextInput
          key={`confirm-password-${showConfirmPassword ? "visible" : "hidden"}`}
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          secureTextEntry={!showConfirmPassword}
          autoComplete="new-password"
          left={<TextInput.Icon icon="lock-check" />}
          right={
            <TextInput.Icon
              icon={showConfirmPassword ? "eye-off" : "eye"}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          }
        />
        <Button mode="contained" onPress={handleResetPassword} disabled={isLoading}>
          Reset password
        </Button>
      </View>
    );
  }

  return (
    <View className="flex m-4 gap-2">
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!requested}
        left={<TextInput.Icon icon="email" />}
      />
      <Button mode="contained" onPress={handleRequestReset} disabled={isLoading || requested}>
        {requested ? "Check your email" : "Request password reset"}
      </Button>
    </View>
  );
}
