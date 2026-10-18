import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateRoomModal } from "@/components/CreateRoomModal";
import { RoomCover } from "@/components/RoomCover";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Chip } from "@/components/ui/Chip";
import { PillButton } from "@/components/ui/PillButton";
import { Touchable } from "@/components/ui/Touchable";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { createRoomApi, listRoomsApi, type RoomListItem } from "@/services/rooms";
import { colors, TAB_BAR_SPACE } from "@/theme/colors";
import { errorMessage } from "@/utils/format";

type Filter = "all" | "hosted" | "joined";
type Layout = "list" | "grid";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Rooms" },
  { key: "hosted", label: "By you" },
  { key: "joined", label: "By others" },
];

export default function LibraryScreen() {
  const { create } = useLocalSearchParams<{ create?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [layout, setLayout] = useState<Layout>("list");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listRoomsApi()
        .then(setRooms)
        .catch((error) => showSnackbar(errorMessage(error, "Failed to load rooms")));
    }, [showSnackbar]),
  );

  // Home's "Create a room" lands here with ?create=1
  useEffect(() => {
    if (create === "1") {
      setIsCreateOpen(true);
      router.setParams({ create: undefined });
    }
  }, [create]);

  const handleCreate = async (name: string) => {
    setIsCreating(true);
    try {
      const room = await createRoomApi(name);
      setRooms((current) => [room, ...current]);
      setIsCreateOpen(false);
      router.push(`/rooms/${room.id}`);
    } catch (error) {
      showSnackbar(errorMessage(error, "Failed to create room"));
    } finally {
      setIsCreating(false);
    }
  };

  const visibleRooms = rooms.filter((room) => {
    const hosted = room.host_username === user?.username;
    if (filter === "hosted") return hosted;
    if (filter === "joined") return !hosted;
    return true;
  });

  const isGrid = layout === "grid";
  // Two columns inside 16px side padding with a 16px gutter
  const gridSize = (width - 48) / 2;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.top}>
        <ScreenHeader
          title="Your Library"
          right={
            <Pressable
              onPress={() => setIsCreateOpen(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Create room"
            >
              <Ionicons name="add" size={30} color={colors.text} />
            </Pressable>
          }
        />
        <View style={styles.chips}>
          {FILTERS.map(({ key, label }) => (
            <Chip
              key={key}
              label={label}
              selected={filter === key}
              onPress={() => setFilter(filter === key ? "all" : key)}
            />
          ))}
        </View>
      </View>

      <FlatList
        key={layout}
        data={visibleRooms}
        numColumns={isGrid ? 2 : 1}
        keyExtractor={(room) => String(room.id)}
        columnWrapperStyle={isGrid ? styles.gridRow : undefined}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.sortRow}>
              <View style={styles.sortLabel}>
                <Ionicons name="swap-vertical" size={16} color={colors.text} />
                <Text style={styles.sortText}>Recents</Text>
              </View>
              <Pressable
                onPress={() => setLayout(isGrid ? "list" : "grid")}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={isGrid ? "Show as list" : "Show as grid"}
              >
                <Ionicons name={isGrid ? "list" : "grid-outline"} size={18} color={colors.text} />
              </Pressable>
            </View>
            {/* Always-visible entry point, like Spotify's "Create playlist" row */}
            {visibleRooms.length > 0 && (
              <Touchable
                onPress={() => setIsCreateOpen(true)}
                accessibilityRole="button"
                style={[styles.row, styles.createRow]}
                pressedStyle={styles.pressed}
              >
                <View style={styles.createIcon}>
                  <Ionicons name="add" size={34} color={colors.textSubdued} />
                </View>
                <Text style={styles.name}>Create room</Text>
              </Touchable>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Create your first room</Text>
            <Text style={styles.emptyText}>It's easy, we'll help you.</Text>
            <PillButton
              label="Create room"
              variant="secondary"
              onPress={() => setIsCreateOpen(true)}
            />
          </View>
        }
        renderItem={({ item }) =>
          isGrid ? (
            <Pressable
              onPress={() => router.push(`/rooms/${item.id}`)}
              accessibilityRole="button"
              style={[styles.gridItem, { width: gridSize }]}
            >
              <RoomCover name={item.name} size={gridSize} />
              <Text numberOfLines={1} style={styles.name}>
                {item.name}
              </Text>
              <Text numberOfLines={1} style={styles.meta}>
                Room • {item.host_username}
              </Text>
            </Pressable>
          ) : (
            <Touchable
              onPress={() => router.push(`/rooms/${item.id}`)}
              accessibilityRole="button"
              style={styles.row}
              pressedStyle={styles.pressed}
            >
              <RoomCover name={item.name} size={64} />
              <View style={styles.rowInfo}>
                <Text numberOfLines={1} style={styles.name}>
                  {item.name}
                </Text>
                <Text numberOfLines={1} style={styles.meta}>
                  Room • {item.host_username}
                </Text>
              </View>
            </Touchable>
          )
        }
      />

      <CreateRoomModal
        visible={isCreateOpen}
        isCreating={isCreating}
        onCancel={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    shadowColor: colors.black,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: colors.background,
  },
  chips: { flexDirection: "row", gap: 8 },
  list: { paddingHorizontal: 16, paddingBottom: TAB_BAR_SPACE },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  sortLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  sortText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  pressed: { opacity: 0.6 },
  createRow: { marginBottom: 6 },
  createIcon: {
    width: 64,
    height: 64,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.highlight,
  },
  rowInfo: { flex: 1, gap: 4 },
  gridRow: { justifyContent: "space-between" },
  gridItem: { marginBottom: 20 },
  name: { color: colors.text, fontSize: 16, fontWeight: "500", marginTop: 4 },
  meta: { color: colors.textSubdued, fontSize: 13 },
  empty: { alignItems: "center", gap: 8, marginTop: 64 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "700" },
  emptyText: { color: colors.textSubdued, fontSize: 14, marginBottom: 16 },
});
