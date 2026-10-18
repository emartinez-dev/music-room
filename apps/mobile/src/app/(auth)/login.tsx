import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { TextInput } from "react-native-paper";

import { AuthScaffold, authInputProps, OrDivider } from "@/components/AuthScaffold";
import { PillButton } from "@/components/ui/PillButton";
import { useAuth } from "@/context/AuthContext";
import { handleGoogleSignIn } from "@/services/googleAuth";
import { colors } from "@/theme/colors";

export default function LoginScreen() {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthScaffold showLogo title="Log in to Music Room">
      <PillButton
        label="Continue with Google"
        variant="outline"
        icon="google"
        onPress={async () => {
          try {
            const tokens = await handleGoogleSignIn();
            await loginWithGoogle(tokens);
          } catch (error) {
            console.error("Google login failed:", error);
          }
        }}
      />
      <OrDivider />
      <TextInput
        {...authInputProps}
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        left={<TextInput.Icon icon="email-outline" />}
      />
      <TextInput
        {...authInputProps}
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoComplete="password"
        left={<TextInput.Icon icon="lock-outline" />}
        right={
          <TextInput.Icon
            icon={showPassword ? "eye-off" : "eye"}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />
      <PillButton
        label="Log in"
        onPress={() => {
          login(email, password);
        }}
        disabled={isLoading}
        style={styles.submit}
      />
      <PillButton
        label="Forgot your password?"
        variant="ghost"
        size="sm"
        onPress={() => {
          router.push("/(auth)/reset-password");
        }}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>New here?</Text>
        <PillButton
          label="Create an account"
          variant="ghost"
          size="sm"
          onPress={() => router.push("/(auth)/register")}
          style={styles.footerLink}
        />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: 12 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16 },
  footerText: { color: colors.textSubdued },
  footerLink: { paddingHorizontal: 8 },
});
