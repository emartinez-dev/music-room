import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

import { FadeGradient } from "./ui/FadeGradient";

// Shared react-native-paper TextInput styling for the auth forms
export const authInputProps = {
  mode: "outlined" as const,
  outlineColor: colors.textMuted,
  activeOutlineColor: colors.text,
  textColor: colors.text,
  outlineStyle: { borderRadius: 6 },
  style: { backgroundColor: colors.background },
};

type AuthScaffoldProps = {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  children: React.ReactNode;
};

export function AuthScaffold({ title, subtitle, showLogo, children }: AuthScaffoldProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <FadeGradient color="#2A2A2A" intensity={0.9} height={260} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {showLogo && (
          <View style={styles.logo}>
            <Ionicons name="musical-notes" size={36} color={colors.black} />
          </View>
        )}
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function OrDivider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>or</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: "center", padding: 24, paddingVertical: 48 },
  logo: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: { color: colors.textSubdued, fontSize: 15, textAlign: "center" },
  body: { gap: 12, marginTop: 24 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 8 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: { color: colors.textSubdued, fontSize: 13 },
});
