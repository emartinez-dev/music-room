import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Divider, TextInput } from "react-native-paper";

import { useAuth } from "@/context/AuthContext";
import { handleGoogleSignIn } from "@/services/googleAuth";

export default function LoginScreen() {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
        left={<TextInput.Icon icon="email" />}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry={!showPassword}
        autoComplete="password"
        left={<TextInput.Icon icon="lock" />}
        right={
          <TextInput.Icon
            icon={showPassword ? "eye-off" : "eye"}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />
      <Button
        mode="text"
        compact
        onPress={() => {
          router.push("/(auth)/reset");
        }}
      >
        Forgot your password?
      </Button>
      <Button
        mode="contained"
        onPress={() => {
          login(email, password);
        }}
        disabled={isLoading}
      >
        Log in
      </Button>
      <Divider bold />
      <Button
        mode="outlined"
        icon="google"
        onPress={async () => {
          try {
            const tokens = await handleGoogleSignIn();
            await loginWithGoogle(tokens);
          } catch (error) {
            console.error("Google login failed:", error);
          }
        }}
      >
        Continue with Google
      </Button>
      <View className="flex flex-row justify-center items-center">
        <Text>New here?</Text>
        <Button compact mode="text" onPress={() => router.push("/(auth)/register")}>
          Create an account
        </Button>
      </View>
    </View>
  );
}
