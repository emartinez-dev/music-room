import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Share, StyleSheet, Text, View } from "react-native";

import { type PlayerTrack, usePlayer } from "@/context/PlayerContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { addTrackToRoomApi, listRoomsApi, type RoomListItem } from "@/services/rooms";
import { colors } from "@/theme/colors";
import { errorMessage } from "@/utils/format";

import { RoomCover } from "./RoomCover";
import { BottomSheet, SheetItem } from "./ui/BottomSheet";
import { Touchable } from "./ui/Touchable";

type TrackActionsSheetProps = {
  track: PlayerTrack | null;
  onClose: () => void;
};

// The "⋮" menu of a song: queue it, add it to a room or share it
export function TrackActionsSheet({ track, onClose }: TrackActionsSheetProps) {
  const [mode, setMode] = useState<"actions" | "rooms">("actions");
  const [rooms, setRooms] = useState<RoomListItem[] | null>(null);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const { showSnackbar } = useSnackbar();
  const { addToQueue } = usePlayer();

  useEffect(() => {
    if (track) setMode("actions");
  }, [track]);

  useEffect(() => {
    if (!track || mode !== "rooms") return;
    setRooms(null);
    listRoomsApi()
      .then(setRooms)
      .catch((error) => {
        setRooms([]);
        showSnackbar(errorMessage(error, "Failed to load rooms"));
      });
  }, [track, mode, showSnackbar]);

  const handleQueue = () => {
    if (!track) return;
    addToQueue(track);
    showSnackbar("Added to queue");
    onClose();
  };

  const handleShare = () => {
    if (!track) return;
    onClose();
    void Share.share({ message: `${track.name} by ${track.artist} — on Music Room` });
  };

  const handleAdd = async (room: RoomListItem) => {
    if (!track) return;
    setAddingTo(room.id);
    try {
      await addTrackToRoomApi(room.id, track.spotify_uri);
      showSnackbar(`Added to ${room.name}`);
      onClose();
    } catch (error) {
      showSnackbar(errorMessage(error, "Failed to add track"));
    } finally {
      setAddingTo(null);
    }
  };

  return (
    <BottomSheet
      visible={!!track}
      onClose={onClose}
      header={
        track && (
          <View style={styles.header}>
            <Image source={{ uri: track.image_url }} style={styles.image} />
            <View style={styles.headerInfo}>
              <Text numberOfLines={1} style={styles.name}>
                {track.name}
              </Text>
              <Text numberOfLines={1} style={styles.artist}>
                {track.artist}
              </Text>
            </View>
          </View>
        )
      }
    >
      {mode === "actions" ? (
        <>
          <SheetItem icon="list" label="Add to queue" onPress={handleQueue} />
          <SheetItem
            icon="add-circle-outline"
            label="Add to room"
            onPress={() => setMode("rooms")}
          />
          <SheetItem icon="share-outline" label="Share" onPress={handleShare} />
        </>
      ) : (
        <>
          <SheetItem icon="chevron-back" label="Add to room" onPress={() => setMode("actions")} />
          {rooms === null ? (
            <ActivityIndicator color={colors.green} style={styles.loading} />
          ) : rooms.length === 0 ? (
            <Text style={styles.empty}>You have no rooms yet. Create one from Your Library.</Text>
          ) : (
            <ScrollView>
              {rooms.map((room) => (
                <Touchable
                  key={room.id}
                  onPress={() => handleAdd(room)}
                  disabled={addingTo !== null}
                  accessibilityRole="button"
                  style={styles.room}
                  pressedStyle={styles.pressed}
                >
                  <RoomCover name={room.name} size={48} />
                  <View style={styles.headerInfo}>
                    <Text numberOfLines={1} style={styles.name}>
                      {room.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.artist}>
                      Room • {room.host_username}
                    </Text>
                  </View>
                  {addingTo === room.id && <ActivityIndicator color={colors.green} />}
                </Touchable>
              ))}
            </ScrollView>
          )}
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  image: { width: 48, height: 48, borderRadius: 2 },
  headerInfo: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: "600" },
  artist: { color: colors.textSubdued, fontSize: 13 },
  loading: { marginVertical: 24 },
  empty: { color: colors.textSubdued, paddingHorizontal: 16, paddingVertical: 16 },
  room: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, height: 64 },
  pressed: { backgroundColor: colors.highlight },
});
