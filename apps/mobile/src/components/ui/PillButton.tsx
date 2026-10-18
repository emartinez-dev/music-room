import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { ActivityIndicator, type StyleProp, StyleSheet, Text, type ViewStyle } from "react-native";

import { colors } from "@/theme/colors";

import { Touchable } from "./Touchable";

type Variant = "primary" | "secondary" | "outline" | "ghost";

type PillButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: "md" | "sm";
  icon?: ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconColor?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const backgrounds: Record<Variant, string> = {
  primary: colors.green,
  secondary: colors.text,
  outline: "transparent",
  ghost: "transparent",
};

const foregrounds: Record<Variant, string> = {
  primary: colors.black,
  secondary: colors.black,
  outline: colors.text,
  ghost: colors.text,
};

export function PillButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconColor,
  loading,
  disabled,
  style,
  testID,
}: PillButtonProps) {
  const isDisabled = disabled || loading;
  const foreground = foregrounds[variant];

  return (
    <Touchable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled }}
      style={[
        styles.base,
        size === "sm" ? styles.small : styles.medium,
        { backgroundColor: backgrounds[variant] },
        variant === "outline" && styles.outline,
        isDisabled && styles.disabled,
        style,
      ]}
      pressedStyle={styles.pressed}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={size === "sm" ? 16 : 22}
              color={iconColor ?? foreground}
              style={variant === "outline" && size === "md" ? styles.leadingIcon : undefined}
            />
          )}
          <Text
            style={[
              styles.label,
              size === "sm" && styles.smallLabel,
              { color: foreground },
              variant === "outline" && size === "md" && icon ? styles.centeredLabel : undefined,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    gap: 8,
  },
  medium: { height: 48, paddingHorizontal: 32 },
  small: { height: 32, paddingHorizontal: 16 },
  outline: { borderWidth: 1, borderColor: colors.textMuted },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: "700" },
  smallLabel: { fontSize: 13 },
  // Outline buttons with a brand icon pin the icon left and keep the label centered, like Spotify
  leadingIcon: { position: "absolute", left: 20 },
  centeredLabel: { textAlign: "center" },
});
