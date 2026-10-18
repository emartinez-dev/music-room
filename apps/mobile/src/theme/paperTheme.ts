import { MD3DarkTheme, type MD3Theme } from "react-native-paper";

import { colors } from "./colors";

export const paperTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 2,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.green,
    onPrimary: colors.black,
    background: colors.background,
    surface: colors.card,
    surfaceVariant: colors.highlight,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSubdued,
    outline: colors.textMuted,
    inverseSurface: colors.text,
    inverseOnSurface: colors.black,
    inversePrimary: colors.greenDark,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level2: colors.card,
    },
  },
};
