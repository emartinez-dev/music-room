import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, TextInput } from "react-native-paper";

import { Api } from "@/services/api";

export default function VerifyEmailScreen() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);

    try {
      await Api.post("/auth/verify-email/", { token });

      router.replace("/(auth)/login");
    } catch {
      // Handled by Api interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex m-4 gap-2">
      <TextInput
        label="Verification code"
        value={token}
        onChangeText={setToken}
        mode="outlined"
        autoCapitalize="none"
        autoComplete="one-time-code"
        left={<TextInput.Icon icon="email-check" />}
      />
      <Button mode="contained" onPress={handleVerify} disabled={isLoading}>
        Verify email
      </Button>
    </View>
  );
}