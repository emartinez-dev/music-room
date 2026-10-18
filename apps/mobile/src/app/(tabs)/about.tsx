import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FadeGradient } from "@/components/ui/FadeGradient";
import { colors, TAB_BAR_SPACE } from "@/theme/colors";

const FEATURES: { icon: ComponentProps<typeof Ionicons>["name"]; title: string; text: string }[] = [
  {
    icon: "people-outline",
    title: "Listen together",
    text: "Create rooms and invite your friends with a link.",
  },
  {
    icon: "search-outline",
    title: "Search the Spotify catalog",
    text: "Find any song and add it to your rooms.",
  },
  {
    icon: "thumbs-up-outline",
    title: "Vote on the queue",
    text: "Link your Spotify account to vote and edit playlists.",
  },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <FadeGradient color={colors.greenDark} intensity={0.45} height={280} />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: TAB_BAR_SPACE }}
      >
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.navigate("/"))}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Ionicons name="musical-notes" size={44} color={colors.black} />
          </View>
          <Text style={styles.title}>Music Room</Text>
          <Text style={styles.subtitle}>Version 1.0.0</Text>
        </View>
        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.feature}>
              <Ionicons name={feature.icon} size={28} color={colors.green} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureBody}>{feature.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  back: { marginLeft: 12, width: 36, height: 36, justifyContent: "center" },
  hero: { alignItems: "center", gap: 8, marginTop: 24, marginBottom: 32 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
  subtitle: { color: colors.textSubdued, fontSize: 14 },
  features: { paddingHorizontal: 16, gap: 12 },
  feature: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  featureText: { flex: 1, gap: 4 },
  featureTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  featureBody: { color: colors.textSubdued, fontSize: 14 },
});
