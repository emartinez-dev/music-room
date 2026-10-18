import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";

import { ProfileDrawer } from "./ProfileDrawer";
import { Avatar } from "./ui/Avatar";

type ScreenHeaderProps = {
  title?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
};

// Top row shared by the tab screens: profile avatar (opens the account drawer), then a title or chips
export function ScreenHeader({ title, right, children }: ScreenHeaderProps) {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <View style={styles.row}>
      <Avatar name={user?.username ?? user?.email} onPress={() => setIsDrawerOpen(true)} />
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
      {right && <View style={styles.right}>{right}</View>}
      <ProfileDrawer visible={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48 },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", flex: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: 20, marginLeft: "auto" },
});
