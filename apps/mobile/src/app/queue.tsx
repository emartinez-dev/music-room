import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TrackRow } from "@/components/TrackRow";
import { PillButton } from "@/components/ui/PillButton";
import { usePlayer } from "@/context/PlayerContext";
import { colors } from "@/theme/colors";

export default function QueueScreen() {
  const insets = useSafeAreaInsets();
  const {
    current,
    source,
    upNext,
    upcoming,
    shuffle,
    repeat,
    playFromQueue,
    playUpcoming,
    removeFromQueue,
    clearQueue,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  useEffect(() => {
    if (!current && router.canGoBack()) router.back();
  }, [current]);

  if (!current) return null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close queue"
        >
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {source?.name ?? "Queue"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Now playing</Text>
        <TrackRow track={current} />

        {upNext.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Next in queue</Text>
              <PillButton label="Clear queue" variant="outline" size="sm" onPress={clearQueue} />
            </View>
            {upNext.map((track, index) => (
              <TrackRow
                // biome-ignore lint/suspicious/noArrayIndexKey: the same song can be queued twice
                key={`${track.spotify_uri}-${index}`}
                track={track}
                onPress={() => playFromQueue(index)}
                action={{ icon: "remove-circle-outline", label: `Remove ${track.name} from queue` }}
                onAction={() => removeFromQueue(index)}
              />
            ))}
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
              Next from: {source?.name ?? "your music"}
            </Text>
            {upcoming.map((track, index) => (
              <TrackRow
                // biome-ignore lint/suspicious/noArrayIndexKey: positions are what the queue is about
                key={`${track.spotify_uri}-${index}`}
                track={track}
                onPress={() => playUpcoming(index)}
              />
            ))}
          </>
        )}

        {upNext.length === 0 && upcoming.length === 0 && (
          <Text style={styles.empty}>
            Nothing else to play. Swipe a song to the right to add it to your queue.
          </Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={toggleShuffle}
          accessibilityRole="button"
          accessibilityState={{ selected: shuffle }}
          style={styles.footerButton}
        >
          <MaterialCommunityIcons
            name="shuffle-variant"
            size={24}
            color={shuffle ? colors.green : colors.text}
          />
          <Text style={[styles.footerLabel, shuffle && styles.footerActive]}>Shuffle</Text>
        </Pressable>
        <Pressable
          onPress={cycleRepeat}
          accessibilityRole="button"
          accessibilityState={{ selected: repeat !== "off" }}
          style={styles.footerButton}
        >
          <MaterialCommunityIcons
            name={repeat === "one" ? "repeat-once" : "repeat"}
            size={24}
            color={repeat === "off" ? colors.text : colors.green}
          />
          <Text style={[styles.footerLabel, repeat !== "off" && styles.footerActive]}>
            {repeat === "one" ? "Repeat one" : "Repeat"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 8 },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: { width: 28 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
  },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "800", marginVertical: 8 },
  sectionSpacing: { marginTop: 24 },
  empty: { color: colors.textSubdued, fontSize: 14, marginTop: 24, textAlign: "center" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    backgroundColor: colors.surface,
  },
  footerButton: { alignItems: "center", gap: 4, paddingHorizontal: 24 },
  footerLabel: { color: colors.textSubdued, fontSize: 12, fontWeight: "600" },
  footerActive: { color: colors.green },
});
