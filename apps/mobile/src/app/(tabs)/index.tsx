import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RoomCover } from "@/components/RoomCover";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Chip } from "@/components/ui/Chip";
import { FadeGradient } from "@/components/ui/FadeGradient";
import { PillButton } from "@/components/ui/PillButton";
import { Touchable } from "@/components/ui/Touchable";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { listRoomsApi, type RoomListItem } from "@/services/rooms";
import { colors, TAB_BAR_SPACE } from "@/theme/colors";
import { errorMessage, greeting } from "@/utils/format";

type Filter = "all" | "hosted";

const QUICK_ACCESS_COUNT = 6;

export default function HomeScreen() {
  const { user, spotifyLinked } = useAuth();
  const { showSnackbar } = useSnackbar();
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useFocusEffect(
    useCallback(() => {
      listRoomsApi()
        .then(setRooms)
        .catch((error) => showSnackbar(errorMessage(error, "Failed to load rooms")));
    }, [showSnackbar]),
  );

  const hostedRooms = rooms.filter((room) => room.host_username === user?.username);
  const visibleRooms = filter === "hosted" ? hostedRooms : rooms;
  const openRoom = (room: RoomListItem) => router.push(`/rooms/${room.id}`);
  // Your Library opens its "Give your room a name" screen when it receives ?create=1
  const openCreateRoom = () => router.push({ pathname: "/rooms", params: { create: "1" } });

  return (
    <View style={styles.screen}>
      <FadeGradient color="#3B2A6B" intensity={0.55} height={320} />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: TAB_BAR_SPACE }}
      >
        <View style={styles.padded}>
          <ScreenHeader
            right={
              <Pressable
                onPress={openCreateRoom}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Create room"
              >
                <Ionicons name="add" size={30} color={colors.text} />
              </Pressable>
            }
          >
            <Chip label="All" selected={filter === "all"} onPress={() => setFilter("all")} />
            <Chip
              label="Hosted by you"
              selected={filter === "hosted"}
              onPress={() => setFilter("hosted")}
            />
          </ScreenHeader>

          <Text style={styles.greeting}>{greeting()}</Text>
          {user?.username && <Text style={styles.subtitle}>Welcome back, {user.username}</Text>}

          {visibleRooms.length > 0 ? (
            <View style={styles.quickGrid}>
              {visibleRooms.slice(0, QUICK_ACCESS_COUNT).map((room) => (
                <Touchable
                  key={room.id}
                  onPress={() => openRoom(room)}
                  accessibilityRole="button"
                  style={styles.quickItem}
                  pressedStyle={styles.pressed}
                >
                  <RoomCover name={room.name} size={56} radius={0} />
                  <Text numberOfLines={2} style={styles.quickLabel}>
                    {room.name}
                  </Text>
                </Touchable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {filter === "hosted" ? "You don't host any rooms yet" : "No rooms yet"}
              </Text>
              <Text style={styles.emptyText}>
                Create a room, add songs and invite your friends to listen together.
              </Text>
              <PillButton
                label="Create a room"
                variant="secondary"
                size="sm"
                onPress={openCreateRoom}
                style={styles.emptyButton}
              />
            </View>
          )}

          {!spotifyLinked && (
            <View style={styles.spotifyCard}>
              <MaterialCommunityIcons name="spotify" size={40} color={colors.green} />
              <View style={styles.spotifyInfo}>
                <Text style={styles.spotifyTitle}>Connect your Spotify account</Text>
                <Text style={styles.spotifyText}>Vote and edit playlists with your music.</Text>
              </View>
              <PillButton
                label="Link"
                size="sm"
                onPress={() => router.push("/spotify-link-modal")}
              />
            </View>
          )}
        </View>

        {rooms.length > 0 && (
          <Section title="Your rooms">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onPress={() => openRoom(room)} />
            ))}
          </Section>
        )}

        {hostedRooms.length > 0 && filter === "all" && (
          <Section title="Hosted by you">
            {hostedRooms.map((room) => (
              <RoomCard key={room.id} room={room} onPress={() => openRoom(room)} />
            ))}
          </Section>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, styles.padded]}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function RoomCard({ room, onPress }: { room: RoomListItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.card}>
      <RoomCover name={room.name} size={150} />
      <Text numberOfLines={1} style={styles.cardTitle}>
        {room.name}
      </Text>
      <Text numberOfLines={1} style={styles.cardSubtitle}>
        By {room.host_username}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: 16 },
  greeting: { color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 20 },
  subtitle: { color: colors.textSubdued, fontSize: 14, marginTop: 4 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  quickItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "48.5%",
    height: 56,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  pressed: { opacity: 0.7 },
  quickLabel: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "700", paddingRight: 8 },
  emptyCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 8,
    backgroundColor: colors.highlight,
    gap: 8,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  emptyText: { color: colors.textSubdued, fontSize: 14 },
  emptyButton: { alignSelf: "flex-start", marginTop: 8 },
  spotifyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  spotifyInfo: { flex: 1 },
  spotifyTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  spotifyText: { color: colors.textSubdued, fontSize: 13 },
  section: { marginTop: 32 },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: "800", marginBottom: 12 },
  carousel: { paddingHorizontal: 16, gap: 16 },
  card: { width: 150 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: "700", marginTop: 8 },
  cardSubtitle: { color: colors.textSubdued, fontSize: 13, marginTop: 2 },
});
