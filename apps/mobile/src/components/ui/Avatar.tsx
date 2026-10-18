import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { coverColor, initial } from "@/utils/format";

type AvatarProps = {
  name?: string | null;
  size?: number;
  onPress?: () => void;
};

export function Avatar({ name, size = 32, onPress }: AvatarProps) {
  const circle = (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: name ? coverColor(name) : colors.highlight,
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.45 }]}>{initial(name)}</Text>
    </View>
  );

  if (!onPress) return circle;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Open profile">
      {circle}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
  letter: { color: colors.black, fontWeight: "800" },
});
