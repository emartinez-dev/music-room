import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/theme/colors";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    justifyContent: "center",
    backgroundColor: colors.highlight,
  },
  selected: { backgroundColor: colors.green },
  label: { color: colors.text, fontSize: 13, fontWeight: "500" },
  selectedLabel: { color: colors.black },
});
