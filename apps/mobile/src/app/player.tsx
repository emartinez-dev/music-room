import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, Share, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SwipeTrackSwitcher } from "@/components/SwipeTrackSwitcher";
import { TrackActionsSheet } from "@/components/TrackActionsSheet";
import { FadeGradient } from "@/components/ui/FadeGradient";
import { type PlayerTrack, usePlayer, usePlayerProgress } from "@/context/PlayerContext";
import { colors } from "@/theme/colors";
import { coverColor, formatDuration } from "@/utils/format";

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const {
    current,
    isPlaying,
    source,
    shuffle,
    repeat,
    toggle,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();
  const { progressMs, durationMs } = usePlayerProgress();
  const [sheetTrack, setSheetTrack] = useState<PlayerTrack | null>(null);

  // Nothing to show once playback is cleared (e.g. after logging out)
  useEffect(() => {
    if (!current && router.canGoBack()) router.back();
  }, [current]);

  if (!current) return null;

  const artSize = width - 48;
  const progress = Math.min(1, progressMs / durationMs);
  const fromRoom = source?.id.startsWith("room:");

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
    >
      <FadeGradient color={coverColor(current.name)} intensity={0.9} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close player"
        >
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerOverline}>
            {fromRoom ? "PLAYING FROM ROOM" : "PLAYING FROM"}
          </Text>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {source?.name ?? "Your queue"}
          </Text>
        </View>
        <Pressable
          onPress={() => setSheetTrack(current)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Track options"
        >
          <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
        </Pressable>
      </View>

      <SwipeTrackSwitcher onNext={next} onPrevious={previous} style={styles.swipeArea}>
        <View style={styles.artWrapper}>
          <Image
            source={{ uri: current.image_url }}
            style={[styles.art, { width: artSize, height: artSize }]}
          />
        </View>
        <View style={styles.info}>
          <View style={styles.infoText}>
            <Text numberOfLines={1} style={styles.name}>
              {current.name}
            </Text>
            <Text numberOfLines={1} style={styles.artist}>
              {current.artist}
            </Text>
          </View>
          <Pressable
            onPress={() => setSheetTrack(current)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Add to room"
          >
            <Ionicons name="add-circle-outline" size={30} color={colors.text} />
          </Pressable>
        </View>
      </SwipeTrackSwitcher>

      <View>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
          <View style={[styles.knob, { left: `${progress * 100}%` }]} />
        </View>
        <View style={styles.times}>
          <Text style={styles.time}>{formatDuration(progressMs)}</Text>
          <Text style={styles.time}>-{formatDuration(durationMs - progressMs)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <ModeButton
          active={shuffle}
          onPress={toggleShuffle}
          label={shuffle ? "Disable shuffle" : "Enable shuffle"}
        >
          <MaterialCommunityIcons
            name="shuffle-variant"
            size={26}
            color={shuffle ? colors.green : colors.text}
          />
        </ModeButton>
        <Pressable onPress={previous} hitSlop={10} accessibilityLabel="Previous track">
          <Ionicons name="play-skip-back" size={34} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
          style={styles.playButton}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={34}
            color={colors.black}
            style={isPlaying ? undefined : styles.playIcon}
          />
        </Pressable>
        <Pressable onPress={next} hitSlop={10} accessibilityLabel="Next track">
          <Ionicons name="play-skip-forward" size={34} color={colors.text} />
        </Pressable>
        <ModeButton
          active={repeat !== "off"}
          onPress={cycleRepeat}
          label={`Repeat: ${repeat === "off" ? "off" : repeat === "all" ? "all" : "one song"}`}
        >
          <MaterialCommunityIcons
            name={repeat === "one" ? "repeat-once" : "repeat"}
            size={26}
            color={repeat === "off" ? colors.text : colors.green}
          />
        </ModeButton>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() =>
            Share.share({
              message: `Listening to ${current.name} by ${current.artist} on Music Room`,
            })
          }
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <Ionicons name="share-outline" size={22} color={colors.textSubdued} />
        </Pressable>
        <Pressable
          onPress={() => router.push("/queue")}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Open queue"
        >
          <MaterialCommunityIcons name="playlist-music" size={24} color={colors.textSubdued} />
        </Pressable>
      </View>

      <TrackActionsSheet track={sheetTrack} onClose={() => setSheetTrack(null)} />
    </View>
  );
}

type ModeButtonProps = {
  active: boolean;
  onPress: () => void;
  label: string;
  children: React.ReactNode;
};

// Shuffle and repeat: green with a dot underneath when on, like Spotify
function ModeButton({ active, onPress, label, children }: ModeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={styles.modeButton}
    >
      {children}
      <View style={[styles.modeDot, active && styles.modeDotActive]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  header: { flexDirection: "row", alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 12 },
  headerOverline: { color: colors.text, fontSize: 11, letterSpacing: 1, opacity: 0.8 },
  headerTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  swipeArea: { gap: 28 },
  artWrapper: {
    alignItems: "center",
    shadowColor: colors.black,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  art: { borderRadius: 8, backgroundColor: colors.highlight },
  info: { flexDirection: "row", alignItems: "center", gap: 16 },
  infoText: { flex: 1 },
  name: { color: colors.text, fontSize: 22, fontWeight: "800" },
  artist: { color: colors.textSubdued, fontSize: 16, marginTop: 4 },
  bar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
  },
  barFill: { height: 4, borderRadius: 2, backgroundColor: colors.text },
  knob: {
    position: "absolute",
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: 6,
    backgroundColor: colors.text,
  },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  time: { color: colors.textSubdued, fontSize: 12 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modeButton: { alignItems: "center", gap: 4 },
  modeDot: { width: 4, height: 4, borderRadius: 2 },
  modeDotActive: { backgroundColor: colors.green },
  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { marginLeft: 4 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
