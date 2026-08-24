import { AxiosError } from "axios";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Share, View } from "react-native";
import { IconButton, Menu, Text } from "react-native-paper";

import { TrackSearch } from "@/components/TrackSearch";
import { useSnackbar } from "@/context/SnackbarContext";
import { addTrackToRoomApi, deleteRoomApi, getRoomApi } from "@/services/rooms";

type RoomTrackItem = { spotify_uri: string; name: string; artist: string; image_url: string };
type RoomDetail = { id: number; name: string; host_username: string; tracks: RoomTrackItem[] };

export default function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const { showSnackbar } = useSnackbar();

  useFocusEffect(
    useCallback(() => {
      getRoomApi(Number(roomId))
        .then(setRoom)
        .catch((error) => {
          if (error instanceof AxiosError) {
            showSnackbar(error.response?.data?.message ?? "Failed to load room");
          } else {
            showSnackbar("Failed to load room");
          }
        });
    }, [roomId, showSnackbar]),
  );

  const handleSelectTrack = async (spotifyUri: string) => {
    try {
      const data = await addTrackToRoomApi(Number(roomId), spotifyUri);
      setRoom(data);
    } catch (error) {
      if (error instanceof AxiosError) {
        showSnackbar(error.response?.data?.message ?? "Failed to add track");
      } else {
        showSnackbar("Failed to add track");
      }
    }
  };

  const handleDelete = async () => {
    setMenuVisible(false);
    try {
      await deleteRoomApi(Number(roomId));
      router.back();
    } catch (error) {
      if (error instanceof AxiosError) {
        showSnackbar(error.response?.data?.message ?? "Failed to delete room");
      } else {
        showSnackbar("Failed to delete room");
      }
    }
  };

  const handleInvite = async () => {
    setMenuVisible(false);
    await Share.share({ message: `Join my room on Music Room: mobile://rooms/${roomId}` });
  };

  return (
    <View className="flex-1 p-4 gap-4">
      <Stack.Screen
        options={{
          title: room?.name ?? "Room",
          headerRight: () => (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
            >
              <Menu.Item onPress={handleInvite} title="Invite to room" leadingIcon="account-plus" />
              <Menu.Item onPress={handleDelete} title="Delete room" leadingIcon="delete" />
            </Menu>
          ),
        }}
      />
      <TrackSearch onSelectTrack={handleSelectTrack} />
      {room?.tracks.map((track) => (
        <Text key={track.spotify_uri}>
          {track.name} — {track.artist}
        </Text>
      ))}
    </View>
  );
}
