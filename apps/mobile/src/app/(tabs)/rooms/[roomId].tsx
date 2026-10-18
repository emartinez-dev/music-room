import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_LINKS_URL } from "@/../config";
import { RoomCover } from "@/components/RoomCover";
import { SwipeToQueue } from "@/components/SwipeToQueue";
import { TrackActionsSheet } from "@/components/TrackActionsSheet";
import { TrackRow } from "@/components/TrackRow";
import { TrackSearch } from "@/components/TrackSearch";
import { Avatar } from "@/components/ui/Avatar";
import { BottomSheet, SheetItem } from "@/components/ui/BottomSheet";
import { FadeGradient } from "@/components/ui/FadeGradient";
import { PillButton } from "@/components/ui/PillButton";
import { Touchable } from "@/components/ui/Touchable";
import { usePlayer } from "@/context/PlayerContext";
import { useSnackbar } from "@/context/SnackbarContext";
import {
  addTrackToRoomApi,
  deleteRoomApi,
  getRoomApi,
  type RoomDetail,
  type RoomTrackItem,
} from "@/services/rooms";
import { colors, TAB_BAR_SPACE } from "@/theme/colors";
import { coverColor, errorMessage } from "@/utils/format";

const TOP_BAR_HEIGHT = 56;

export default function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { showSnackbar } = useSnackbar();
  const { current, isPlaying, source, shuffle, play, toggle, toggleShuffle, addToQueue, stop } =
    usePlayer();
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [sheetTrack, setSheetTrack] = useState<RoomTrackItem | null>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      getRoomApi(Number(roomId))
        .then(setRoom)
        .catch((error) => showSnackbar(errorMessage(error, "Failed to load room")));
    }, [roomId, showSnackbar]),
  );

  const handleSelectTrack = async (spotifyUri: string) => {
    try {
      const data = await addTrackToRoomApi(Number(roomId), spotifyUri);
      setRoom(data);
    } catch (error) {
      showSnackbar(errorMessage(error, "Failed to add track"));
    }
  };

  const handleDelete = async () => {
    closeOptions();
    try {
      await deleteRoomApi(Number(roomId));
      // The room is gone, so don't leave its tracks playing
      if (source?.id === `room:${roomId}`) stop();
      router.back();
    } catch (error) {
      showSnackbar(errorMessage(error, "Failed to delete room"));
    }
  };

  const handleInvite = async () => {
    closeOptions();
    await Share.share({ message: `Join my room on Music Room: ${APP_LINKS_URL}/rooms/${roomId}` });
  };

  const closeOptions = () => {
    setIsOptionsOpen(false);
    setIsConfirmingDelete(false);
  };

  const tracks = room?.tracks ?? [];
  const accent = coverColor(room?.name ?? String(roomId));
  const coverSize = Math.min(width * 0.62, 260);
  const roomSource = room ? { id: `room:${room.id}`, name: room.name } : null;
  const isRoomLoaded = !!roomSource && source?.id === roomSource.id && !!current;
  const isPlayingRoom = isRoomLoaded && isPlaying;

  // Like Spotify's playlist play button: resumes this room, or starts it (randomly when shuffling)
  const handlePlay = () => {
    if (!roomSource || tracks.length === 0) return;
    if (isRoomLoaded) return toggle();
    const first = shuffle ? tracks[Math.floor(Math.random() * tracks.length)] : tracks[0];
    play(first, tracks, roomSource);
  };

  const queue = (track: RoomTrackItem) => {
    addToQueue(track);
    showSnackbar("Added to queue");
  };

  // The compact top bar fades in once the title scrolls under it
  const titleThreshold = coverSize + 40;
  const barOpacity = scrollY.interpolate({
    inputRange: [titleThreshold - 60, titleThreshold],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.screen}>
      <Animated.View
        style={[
          styles.topBar,
          { paddingTop: insets.top, height: insets.top + TOP_BAR_HEIGHT, opacity: barOpacity },
        ]}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: accent }]} />
        <View style={[StyleSheet.absoluteFill, styles.topBarShade]} />
        <Text numberOfLines={1} style={styles.topBarTitle}>
          {room?.name}
        </Text>
      </Animated.View>
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={[styles.backButton, { top: insets.top + 10 }]}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>

      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
      >
        <View style={[styles.hero, { paddingTop: insets.top + TOP_BAR_HEIGHT }]}>
          <FadeGradient color={accent} intensity={0.9} />
          <View style={styles.coverShadow}>
            <RoomCover
              name={room?.name ?? ""}
              size={coverSize}
              images={tracks.map((track) => track.image_url)}
            />
          </View>
        </View>

        <View style={styles.body}>
          {room ? (
            <>
              <Text style={styles.title}>{room.name}</Text>
              <View style={styles.hostRow}>
                <Avatar name={room.host_username} size={24} />
                <Text style={styles.host}>{room.host_username}</Text>
              </View>
              <Text style={styles.meta}>
                Room • {tracks.length} {tracks.length === 1 ? "song" : "songs"}
              </Text>

              <View style={styles.actions}>
                <Pressable
                  onPress={handleInvite}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Invite to room"
                >
                  <Ionicons name="person-add-outline" size={24} color={colors.textSubdued} />
                </Pressable>
                <Pressable
                  onPress={() => setIsAddOpen(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Add songs"
                >
                  <Ionicons name="add-circle-outline" size={28} color={colors.textSubdued} />
                </Pressable>
                <Pressable
                  onPress={() => setIsOptionsOpen(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Room options"
                >
                  <Ionicons name="ellipsis-vertical" size={22} color={colors.textSubdued} />
                </Pressable>
                <View style={styles.spacer} />
                <Pressable
                  onPress={toggleShuffle}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={shuffle ? "Disable shuffle" : "Enable shuffle"}
                  accessibilityState={{ selected: shuffle }}
                  style={styles.shuffleButton}
                >
                  <Ionicons
                    name="shuffle"
                    size={28}
                    color={shuffle ? colors.green : colors.textSubdued}
                  />
                  <View style={[styles.shuffleDot, shuffle && styles.shuffleDotActive]} />
                </Pressable>
                <Touchable
                  onPress={handlePlay}
                  disabled={tracks.length === 0}
                  accessibilityRole="button"
                  accessibilityLabel={isPlayingRoom ? "Pause" : "Play"}
                  style={[styles.playButton, tracks.length === 0 && styles.disabled]}
                  pressedStyle={styles.pressedPlay}
                >
                  <Ionicons
                    name={isPlayingRoom ? "pause" : "play"}
                    size={26}
                    color={colors.black}
                    style={isPlayingRoom ? undefined : styles.playIcon}
                  />
                </Touchable>
              </View>

              {tracks.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>Let's start building your room</Text>
                  <PillButton
                    label="Add to this room"
                    variant="secondary"
                    onPress={() => setIsAddOpen(true)}
                  />
                </View>
              ) : (
                <>
                  <Pressable
                    onPress={() => setIsAddOpen(true)}
                    accessibilityRole="button"
                    style={styles.addRow}
                  >
                    <View style={styles.addIcon}>
                      <Ionicons name="add" size={28} color={colors.textSubdued} />
                    </View>
                    <Text style={styles.addLabel}>Add to this room</Text>
                  </Pressable>
                  {tracks.map((track) => (
                    <SwipeToQueue key={track.spotify_uri} onQueue={() => queue(track)}>
                      <TrackRow
                        track={track}
                        onPress={() => roomSource && play(track, tracks, roomSource)}
                        onMore={() => setSheetTrack(track)}
                      />
                    </SwipeToQueue>
                  ))}
                </>
              )}
            </>
          ) : (
            <ActivityIndicator color={colors.green} style={styles.loading} />
          )}
        </View>
      </Animated.ScrollView>

      <BottomSheet
        visible={isOptionsOpen}
        onClose={closeOptions}
        header={
          room && (
            <View style={styles.sheetHeader}>
              <RoomCover
                name={room.name}
                size={48}
                images={tracks.map((track) => track.image_url)}
              />
              <View>
                <Text style={styles.sheetTitle}>{room.name}</Text>
                <Text style={styles.meta}>by {room.host_username}</Text>
              </View>
            </View>
          )
        }
      >
        {isConfirmingDelete ? (
          <View style={styles.confirm}>
            <Text style={styles.confirmTitle}>Delete room?</Text>
            <Text style={styles.confirmText}>
              This will delete "{room?.name}" for everyone. This can't be undone.
            </Text>
            <View style={styles.confirmActions}>
              <PillButton
                label="Cancel"
                variant="outline"
                onPress={() => setIsConfirmingDelete(false)}
              />
              <PillButton label="Delete" variant="secondary" onPress={handleDelete} />
            </View>
          </View>
        ) : (
          <>
            <SheetItem icon="person-add-outline" label="Invite to room" onPress={handleInvite} />
            <SheetItem
              icon="add-circle-outline"
              label="Add to this room"
              onPress={() => {
                closeOptions();
                setIsAddOpen(true);
              }}
            />
            <SheetItem
              icon="trash-outline"
              label="Delete room"
              destructive
              onPress={() => setIsConfirmingDelete(true)}
            />
          </>
        )}
      </BottomSheet>

      <TrackActionsSheet track={sheetTrack} onClose={() => setSheetTrack(null)} />

      <Modal
        visible={isAddOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddOpen(false)}
      >
        <View style={[styles.addSheet, { paddingTop: insets.top + 8 }]}>
          <View style={styles.addHeader}>
            <Pressable
              onPress={() => setIsAddOpen(false)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
            <Text style={styles.addTitle}>Add to this room</Text>
            <View style={styles.addHeaderSpacer} />
          </View>
          <TrackSearch
            onSelectTrack={handleSelectTrack}
            addedUris={tracks.map((track) => track.spotify_uri)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    justifyContent: "center",
    paddingHorizontal: 56,
    pointerEvents: "none",
  },
  topBarShade: { backgroundColor: "rgba(0,0,0,0.35)" },
  topBarTitle: { color: colors.text, fontSize: 16, fontWeight: "700", textAlign: "center" },
  backButton: {
    position: "absolute",
    left: 12,
    zIndex: 3,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  hero: { alignItems: "center", paddingBottom: 20 },
  coverShadow: {
    shadowColor: colors.black,
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  body: { paddingHorizontal: 16 },
  title: { color: colors.text, fontSize: 26, fontWeight: "800" },
  hostRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  host: { color: colors.text, fontSize: 13, fontWeight: "700" },
  meta: { color: colors.textSubdued, fontSize: 13, marginTop: 6 },
  actions: { flexDirection: "row", alignItems: "center", gap: 22, marginVertical: 12 },
  spacer: { flex: 1 },
  shuffleButton: { alignItems: "center", gap: 2 },
  shuffleDot: { width: 4, height: 4, borderRadius: 2 },
  shuffleDotActive: { backgroundColor: colors.green },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  pressedPlay: { transform: [{ scale: 0.95 }] },
  disabled: { opacity: 0.4 },
  playIcon: { marginLeft: 3 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 2,
    backgroundColor: colors.highlight,
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: { color: colors.text, fontSize: 16 },
  empty: { alignItems: "center", gap: 20, marginTop: 40 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "700", textAlign: "center" },
  loading: { marginTop: 40 },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  sheetTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  confirm: { padding: 16, gap: 12 },
  confirmTitle: { color: colors.text, fontSize: 20, fontWeight: "700", textAlign: "center" },
  confirmText: { color: colors.textSubdued, fontSize: 14, textAlign: "center" },
  confirmActions: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 8 },
  addSheet: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  addHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  addTitle: { flex: 1, color: colors.text, fontSize: 16, fontWeight: "700", textAlign: "center" },
  addHeaderSpacer: { width: 28 },
});
