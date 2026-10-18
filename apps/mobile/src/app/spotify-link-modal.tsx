import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FadeGradient } from "@/components/ui/FadeGradient";
import { PillButton } from "@/components/ui/PillButton";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";

export default function SpotifyLinkModal() {
  const { linkSpotify, isLoading } = useAuth();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleLink = async () => {
    const linked = await linkSpotify();
    // On Android, the spotify-callback screen may have already dismissed this
    // modal (dismissAll()) by the time this resolves, racing with the navigation
    // below — skip it if that already happened.
    if (linked && isMounted.current && router.canGoBack()) router.back();
  };

  return (
    <View style={styles.screen}>
      <FadeGradient color={colors.greenDark} intensity={0.5} height={360} />
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={styles.close}
      >
        <Ionicons name="close" size={28} color={colors.text} />
      </Pressable>
      <View style={styles.content}>
        <MaterialCommunityIcons name="spotify" size={96} color={colors.green} />
        <Text style={styles.title}>Link your Spotify account to vote and edit playlists</Text>
        <Text style={styles.subtitle}>
          You'll be redirected to Spotify to authorize Music Room.
        </Text>
        <PillButton
          label="Link your Spotify account"
          icon="spotify"
          onPress={handleLink}
          loading={isLoading}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  close: { position: "absolute", top: 16, right: 16, zIndex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", textAlign: "center" },
  subtitle: { color: colors.textSubdued, fontSize: 14, textAlign: "center" },
  button: { alignSelf: "stretch", marginTop: 16 },
});
