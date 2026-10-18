import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";

type FadeGradientProps = {
  // Hex color, e.g. "#1DB954"
  color: string;
  // Opacity at the top edge; it eases out to 0 at the bottom (or the reverse when `reverse`)
  intensity?: number;
  reverse?: boolean;
  // Fixed height anchored to the top; fills the parent when omitted
  height?: number;
  style?: StyleProp<ViewStyle>;
};

// Color stops along the ease-out curve; the renderer interpolates smoothly between them
const STOPS = 12;

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

// Builds a CSS linear-gradient that fades `color` out with an ease-out curve
export function fadeGradient(color: string, intensity = 1, reverse = false): string {
  const [r, g, b] = hexToRgb(color);
  const stops = Array.from({ length: STOPS + 1 }, (_, i) => {
    const t = i / STOPS;
    const alpha = (intensity * (1 - t) ** 1.6).toFixed(3);
    return `rgba(${r}, ${g}, ${b}, ${alpha}) ${(t * 100).toFixed(1)}%`;
  });
  return `linear-gradient(${reverse ? "to top" : "to bottom"}, ${stops.join(", ")})`;
}

// Vertical fade drawn natively as a real gradient (New Architecture), so there is no banding
export function FadeGradient({ color, intensity = 1, reverse, height, style }: FadeGradientProps) {
  return (
    <View
      style={[
        height === undefined ? StyleSheet.absoluteFill : [styles.top, { height }],
        styles.passThrough,
        { experimental_backgroundImage: fadeGradient(color, intensity, reverse) },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  top: { position: "absolute", top: 0, left: 0, right: 0 },
  passThrough: { pointerEvents: "none" },
});
