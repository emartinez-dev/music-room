import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops! Not Found" }} />
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textSubdued} />
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.subtitle}>We can't seem to find the page you're looking for.</Text>
        <Link href="/" style={styles.button}>
          Go back to Home screen!
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 32,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: "800" },
  subtitle: { color: colors.textSubdued, fontSize: 14, textAlign: "center", marginBottom: 16 },
  button: {
    color: colors.black,
    backgroundColor: colors.text,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    overflow: "hidden",
  },
});
