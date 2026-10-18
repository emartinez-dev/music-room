import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RoomCover } from "@/components/RoomCover";
import { Avatar } from "@/components/ui/Avatar";
import { FadeGradient } from "@/components/ui/FadeGradient";
import { PillButton } from "@/components/ui/PillButton";
import { Touchable } from "@/components/ui/Touchable";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { listRoomsApi, type RoomListItem } from "@/services/rooms";
import { colors } from "@/theme/colors";
import { coverColor, errorMessage } from "@/utils/format";

// Spotify-style profile page: big avatar header, stats, then the rooms the user hosts
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, spotifyLinked } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const displayName = user?.username ?? user?.email ?? "";

  useFocusEffect(
    useCallback(() => {
      listRoomsApi()
        .then(setRooms)
        .catch((error) => showSnackbar(errorMessage(error, "Failed to load rooms")));
    }, [showSnackbar]),
  );

  const hostedRooms = rooms.filter((room) => room.host_username === user?.username);
  const joinedCount = rooms.length - hostedRooms.length;

  const openRoom = (room: RoomListItem) => {
    router.back();
    router.push(`/rooms/${room.id}`);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: coverColor(displayName) }]} />
          <FadeGradient color={colors.background} reverse intensity={1} />

          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>

          <View style={styles.identity}>
            <View style={styles.avatarShadow}>
              <Avatar name={displayName} size={116} />
            </View>
            <View style={styles.identityText}>
              <Text numberOfLines={2} style={styles.name}>
                {displayName}
              </Text>
              <Text style={styles.stats}>
                <Text style={styles.statValue}>{hostedRooms.length}</Text> hosted •{" "}
                <Text style={styles.statValue}>{joinedCount}</Text> joined
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <PillButton
            label="Share"
            variant="outline"
            size="sm"
            onPress={() => Share.share({ message: `Find ${displayName} on Music Room` })}
          />
          {spotifyLinked ? (
            <View style={styles.badge}>
              <MaterialCommunityIcons name="spotify" size={16} color={colors.green} />
              <Text style={styles.badgeText}>Spotify connected</Text>
            </View>
          ) : (
            <PillButton
              label="Connect Spotify"
              size="sm"
              icon="spotify"
              onPress={() => router.push("/spotify-link-modal")}
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>Rooms</Text>
        {hostedRooms.length === 0 ? (
          <Text style={styles.empty}>Rooms you host will show up here.</Text>
        ) : (
          hostedRooms.map((room) => (
            <Touchable
              key={room.id}
              onPress={() => openRoom(room)}
              accessibilityRole="button"
              style={styles.room}
              pressedStyle={styles.pressed}
            >
              <RoomCover name={room.name} size={56} />
              <View style={styles.roomInfo}>
                <Text numberOfLines={1} style={styles.roomName}>
                  {room.name}
                </Text>
                <Text style={styles.roomMeta}>Room</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Touchable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { paddingBottom: 24, overflow: "hidden" },
  back: { marginLeft: 12, width: 36, height: 36, justifyContent: "center" },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    marginTop: 24,
  },
  avatarShadow: {
    borderRadius: 58,
    shadowColor: colors.black,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  identityText: { flex: 1, gap: 8 },
  name: { color: colors.text, fontSize: 32, fontWeight: "900", letterSpacing: -0.5 },
  stats: { color: colors.textSubdued, fontSize: 13 },
  statValue: { color: colors.text, fontWeight: "700" },
  actions: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6 },
  badgeText: { color: colors.textSubdued, fontSize: 13, fontWeight: "600" },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    paddingHorizontal: 16,
    marginTop: 32,
    marginBottom: 8,
  },
  empty: { color: colors.textSubdued, fontSize: 14, paddingHorizontal: 16 },
  room: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, height: 72 },
  pressed: { backgroundColor: colors.highlight },
  roomInfo: { flex: 1, gap: 4 },
  roomName: { color: colors.text, fontSize: 16, fontWeight: "500" },
  roomMeta: { color: colors.textSubdued, fontSize: 13 },
});
