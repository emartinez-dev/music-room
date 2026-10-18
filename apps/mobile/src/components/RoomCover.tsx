import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { coverColor } from "@/utils/format";

type RoomCoverProps = {
  name: string;
  size: number;
  images?: string[];
  radius?: number;
};

// Rooms have no artwork of their own: like Spotify playlists, the cover is a mosaic
// of the first tracks, or a generated color tile when there are not enough tracks
export function RoomCover({ name, size, images = [], radius = 4 }: RoomCoverProps) {
  const frame = { width: size, height: size, borderRadius: radius };
  const uniqueImages = [...new Set(images.filter(Boolean))];

  if (uniqueImages.length >= 4) {
    const half = size / 2;
    return (
      <View style={[styles.mosaic, frame]}>
        {uniqueImages.slice(0, 4).map((uri) => (
          <Image key={uri} source={{ uri }} style={{ width: half, height: half }} />
        ))}
      </View>
    );
  }

  if (uniqueImages.length > 0) {
    return <Image source={{ uri: uniqueImages[0] }} style={[styles.clip, frame]} />;
  }

  const showTitle = size >= 120;
  return (
    <View style={[styles.tile, frame, { backgroundColor: coverColor(name) }]}>
      <Ionicons
        name="musical-notes"
        size={showTitle ? size * 0.22 : size * 0.45}
        color="rgba(255,255,255,0.85)"
      />
      {showTitle && (
        <Text numberOfLines={2} style={[styles.title, { fontSize: Math.min(28, size * 0.12) }]}>
          {name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  mosaic: { flexDirection: "row", flexWrap: "wrap", overflow: "hidden" },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    gap: 8,
    padding: 10,
  },
  title: { color: colors.text, fontWeight: "800", textAlign: "center" },
});
