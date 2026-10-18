import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { usePlayer } from "@/context/PlayerContext";
import { colors } from "@/theme/colors";

import { Touchable } from "./ui/Touchable";

type TrackRowProps = {
  track: { spotify_uri: string; name: string; artist: string; image_url: string; album?: string };
  onPress?: () => void;
  onMore?: () => void;
  // Optional trailing action that replaces the "more" button (e.g. add to room)
  action?: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; active?: boolean };
  onAction?: () => void;
};

export function TrackRow({ track, onPress, onMore, action, onAction }: TrackRowProps) {
  const { current, isPlaying } = usePlayer();
  const isCurrent = current?.spotify_uri === track.spotify_uri;

  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      style={styles.row}
      pressedStyle={styles.pressed}
    >
      {track.image_url ? (
        <Image source={{ uri: track.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="musical-note" size={20} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          {isCurrent && isPlaying && <Ionicons name="volume-high" size={14} color={colors.green} />}
          <Text numberOfLines={1} style={[styles.name, isCurrent && styles.current]}>
            {track.name}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.artist}>
          {track.album ? `${track.artist} • ${track.album}` : track.artist}
        </Text>
      </View>
      {action ? (
        <Pressable
          onPress={onAction}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Ionicons
            name={action.icon}
            size={26}
            color={action.active ? colors.green : colors.textSubdued}
          />
        </Pressable>
      ) : (
        onMore && (
          <Pressable
            onPress={onMore}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={`More options for ${track.name}`}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textSubdued} />
          </Pressable>
        )
      )}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  pressed: { opacity: 0.6 },
  image: { width: 48, height: 48, borderRadius: 2 },
  placeholder: {
    backgroundColor: colors.highlight,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: colors.text, fontSize: 16, flexShrink: 1 },
  current: { color: colors.green },
  artist: { color: colors.textSubdued, fontSize: 13 },
});
