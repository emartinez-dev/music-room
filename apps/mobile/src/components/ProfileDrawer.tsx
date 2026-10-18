import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { colors } from "@/theme/colors";

import { Avatar } from "./ui/Avatar";
import { Touchable } from "./ui/Touchable";

type ProfileDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

// Spotify's account menu: slides in from the left when the avatar is tapped
export function ProfileDrawer({ visible, onClose }: ProfileDrawerProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, spotifyLinked, logout } = useAuth();
  const { stop } = usePlayer();
  const panelWidth = Math.min(width * 0.85, 340);
  const translateX = useRef(new Animated.Value(-panelWidth)).current;

  useEffect(() => {
    if (!visible) return;
    translateX.setValue(-panelWidth);
    Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  }, [visible, panelWidth, translateX]);

  const go = (href: "/profile" | "/about" | "/spotify-link-modal") => {
    onClose();
    router.push(href);
  };

  const handleLogout = () => {
    onClose();
    stop();
    void logout();
  };

  const displayName = user?.username ?? user?.email ?? "";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View
          style={[
            styles.panel,
            { width: panelWidth, paddingTop: insets.top + 16, transform: [{ translateX }] },
          ]}
        >
          <Touchable
            onPress={() => go("/profile")}
            accessibilityRole="button"
            style={styles.identity}
            pressedStyle={styles.pressed}
          >
            <Avatar name={displayName} size={52} />
            <View style={styles.identityText}>
              <Text numberOfLines={1} style={styles.name}>
                {displayName}
              </Text>
              <Text style={styles.viewProfile}>View profile</Text>
            </View>
          </Touchable>

          <View style={styles.divider} />

          {spotifyLinked ? (
            <View style={styles.item}>
              <MaterialCommunityIcons name="spotify" size={26} color={colors.green} />
              <Text style={styles.itemLabel}>Spotify connected</Text>
            </View>
          ) : (
            <DrawerItem
              icon={<MaterialCommunityIcons name="spotify" size={26} color={colors.text} />}
              label="Connect Spotify"
              onPress={() => go("/spotify-link-modal")}
            />
          )}
          <DrawerItem
            icon={<Ionicons name="information-circle-outline" size={26} color={colors.text} />}
            label="About Music Room"
            onPress={() => go("/about")}
          />
          <DrawerItem
            icon={<Ionicons name="log-out-outline" size={26} color={colors.text} />}
            label="Log out"
            onPress={handleLogout}
          />
        </Animated.View>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close menu" />
      </View>
    </Modal>
  );
}

type DrawerItemProps = { icon: React.ReactNode; label: string; onPress: () => void };

function DrawerItem({ icon, label, onPress }: DrawerItemProps) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      style={styles.item}
      pressedStyle={styles.pressed}
    >
      {icon}
      <Text style={styles.itemLabel}>{label}</Text>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  panel: { height: "100%", backgroundColor: colors.elevated },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  identityText: { flex: 1 },
  name: { color: colors.text, fontSize: 20, fontWeight: "800" },
  viewProfile: { color: colors.textSubdued, fontSize: 13, marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 18, paddingHorizontal: 20, height: 56 },
  itemLabel: { color: colors.text, fontSize: 16, fontWeight: "500" },
  pressed: { backgroundColor: colors.highlight },
});
