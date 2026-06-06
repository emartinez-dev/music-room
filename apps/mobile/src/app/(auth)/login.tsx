import { useState } from "react";
import { View } from "react-native";
import { Button, Divider, Text, TextInput } from "react-native-paper";

import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="flex m-8 gap-4">
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
      <Button mode="text" compact onPress={() => {}}>
        Forgot your password?
      </Button>
      <Button
        mode="contained"
        onPress={() => {
          login(email, password);
        }}
      >
        Log in
      </Button>
      <Divider bold />
      <Button mode="outlined" icon={"google"} onPress={() => {}}>
        Continue with Google
      </Button>
      <View className="flex flex-row justify-center items-center">
        <Text>New here?</Text>
        <Button compact mode="text">
          Create an account
        </Button>
      </View>
    </View>
  );
}
