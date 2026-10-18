import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { usePlayer, usePlayerProgress } from "@/context/PlayerContext";
import { colors } from "@/theme/colors";
import { coverColor } from "@/utils/format";

import { SwipeTrackSwitcher } from "./SwipeTrackSwitcher";

export function MiniPlayer() {
  const { current, isPlaying, toggle, next, previous } = usePlayer();
  const { progressMs, durationMs } = usePlayerProgress();

  if (!current) return null;

  // The swipe area wraps the tap target, not the other way round: a responder only hands the
  // gesture over to its ancestors, so a Pressable around the swipe area would swallow swipes
  return (
    <View style={[styles.container, { backgroundColor: coverColor(current.name) }]}>
      <View style={styles.shade} />
      <View style={styles.content}>
        <SwipeTrackSwitcher onNext={next} onPrevious={previous} style={styles.swipeArea}>
          <Pressable
            onPress={() => router.push("/player")}
            accessibilityRole="button"
            accessibilityLabel="Open now playing"
            style={styles.openArea}
          >
            <Image source={{ uri: current.image_url }} style={styles.image} />
            <View style={styles.info}>
              <Text numberOfLines={1} style={styles.name}>
                {current.name}
              </Text>
              <Text numberOfLines={1} style={styles.artist}>
                {current.artist}
              </Text>
            </View>
          </Pressable>
        </SwipeTrackSwitcher>
        <Pressable
          onPress={toggle}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={28} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.progress, { width: `${Math.min(100, (progressMs / durationMs) * 100)}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 8, borderRadius: 6, overflow: "hidden" },
  shade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  content: { flexDirection: "row", alignItems: "center", gap: 12, padding: 8, paddingRight: 16 },
  swipeArea: { flex: 1 },
  openArea: { flexDirection: "row", alignItems: "center", gap: 12 },
  image: { width: 40, height: 40, borderRadius: 4 },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 14, fontWeight: "700" },
  artist: { color: colors.textSubdued, fontSize: 13 },
  track: { height: 2, marginHorizontal: 8, backgroundColor: "rgba(255,255,255,0.3)" },
  progress: { height: 2, backgroundColor: colors.text },
});
