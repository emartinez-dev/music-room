import { AxiosError } from "axios";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { Api } from "@/services/api";
import { saveTokens } from "@/services/secureStore";

export default function VerifyEmailScreen() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { checkAuth, me } = useAuth();
  const { showSnackbar } = useSnackbar();

  const handleVerify = async () => {
    setIsLoading(true);

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
