import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { TextInput } from "react-native-paper";

import { AuthScaffold, authInputProps, OrDivider } from "@/components/AuthScaffold";
import { PillButton } from "@/components/ui/PillButton";
import { useAuth } from "@/context/AuthContext";
import { handleGoogleSignIn } from "@/services/googleAuth";
import { colors } from "@/theme/colors";

export default function RegisterScreen() {
  const { register, loginWithGoogle, isLoading } = useAuth();
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
    <AuthScaffold title="Sign up to start listening">
      <TextInput
        {...authInputProps}
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        left={<TextInput.Icon icon="account-outline" />}
      />
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
        key={`password-${showPassword ? "visible" : "hidden"}`}
        {...authInputProps}
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        left={<TextInput.Icon icon="lock-outline" />}
        right={
          <TextInput.Icon
            icon={showPassword ? "eye-off" : "eye"}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />
      <TextInput
        key={`confirm-password-${showConfirmPassword ? "visible" : "hidden"}`}
        {...authInputProps}
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        autoComplete="new-password"
        left={<TextInput.Icon icon="lock-check-outline" />}
        right={
          <TextInput.Icon
            icon={showConfirmPassword ? "eye-off" : "eye"}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        }
      />
      <PillButton
        label="Create account"
        onPress={handleRegister}
        disabled={isLoading}
        style={styles.submit}
      />
      <OrDivider />
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
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <PillButton
          label="Log in"
          variant="ghost"
          size="sm"
          onPress={() => router.push("/(auth)/login")}
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
