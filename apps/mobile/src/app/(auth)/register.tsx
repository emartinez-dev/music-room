import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Divider, TextInput } from "react-native-paper";

import { useAuth } from "@/context/AuthContext";

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      // TODO: Mostrar error con Snackbar
      return;
    }

    const success = await register(username, email, password);
    if (success) {
      router.push({ pathname: "/(auth)/verify-email", params: { email } });
    }
  };

  return (
    <View className="flex m-4 gap-2">
      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        mode="outlined"
        autoCapitalize="none"
        left={<TextInput.Icon icon="account" />}
      />
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
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
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
        label="Confirm Password"
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
      <Button mode="contained" onPress={handleRegister} disabled={isLoading}>
        Create account
      </Button>
      <Divider bold />
      <Button mode="outlined" icon={"google"} onPress={() => {}}>
        Continue with Google
      </Button>
      <View className="flex flex-row justify-center items-center">
        <Text>Already have an account?</Text>
        <Button compact mode="text" onPress={() => router.push("/(auth)/login")}>
          Log in
        </Button>
      </View>
    </View>
  );
}
