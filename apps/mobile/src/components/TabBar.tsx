import { Ionicons } from "@expo/vector-icons";
import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

import { MiniPlayer } from "./MiniPlayer";

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];
type IconName = ComponentProps<typeof Ionicons>["name"];

// Only these routes get a tab button; any other tab route stays reachable by link
const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: "home", inactive: "home-outline" },
  search: { active: "search", inactive: "search-outline" },
  rooms: { active: "library", inactive: "library-outline" },
};

export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={styles.player}>
        <MiniPlayer />
      </View>
      <View style={[styles.tabs, { paddingBottom: insets.bottom + 8 }]}>
        {state.routes.map((route, index) => {
          const icons = TAB_ICONS[route.name];
          if (!icons) return null;

          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              style={styles.tab}
            >
              <Ionicons
                name={isFocused ? icons.active : icons.inactive}
                size={26}
                color={isFocused ? colors.text : colors.textSubdued}
              />
              <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Solid and in the layout flow, so screens end above it instead of scrolling underneath
  container: { backgroundColor: colors.black },
  player: { backgroundColor: colors.background, paddingBottom: 4 },
  tabs: {
    flexDirection: "row",
    paddingTop: 10,
    backgroundColor: colors.black,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.highlight,
  },
  tab: { flex: 1, alignItems: "center", gap: 4 },
  label: { color: colors.textSubdued, fontSize: 10, fontWeight: "500" },
  labelFocused: { color: colors.text },
});
