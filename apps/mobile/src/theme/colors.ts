// Spotify-like dark palette shared by every screen
export const colors = {
  black: "#000000",
  background: "#121212",
  surface: "#181818",
  elevated: "#1F1F1F",
  card: "#282828",
  highlight: "#2A2A2A",
  border: "#3E3E3E",
  green: "#1ED760",
  greenDark: "#1DB954",
  text: "#FFFFFF",
  textSubdued: "#B3B3B3",
  textMuted: "#7A7A7A",
  danger: "#F15E6C",
} as const;

// Tile colors used for generated covers and the "Browse all" grid
export const coverPalette = [
  "#8D67AB",
  "#E8115B",
  "#1E3264",
  "#148A08",
  "#BC5900",
  "#E13300",
  "#503750",
  "#477D95",
  "#AF2896",
  "#27856A",
  "#509BF5",
  "#BA5D07",
] as const;

// Breathing room at the end of scrollable tab screens (the tab bar sits below them, not over them)
export const TAB_BAR_SPACE = 32;
