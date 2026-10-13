import { AxiosError } from "axios";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

import { useSnackbar } from "@/context/SnackbarContext";
import { createRoomApi, listRoomsApi } from "@/services/rooms";

type RoomListItem = { id: number; name: string; host_username: string };

export default function RoomsScreen() {
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { showSnackbar } = useSnackbar();

  useFocusEffect(
    useCallback(() => {
      listRoomsApi()
        .then(setRooms)
        .catch((error) => {
          if (error instanceof AxiosError) {
            showSnackbar(error.response?.data?.message ?? "Failed to load rooms");
          } else {
            showSnackbar("Failed to load rooms");
          }
        });
    }, [showSnackbar]),
  );

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const room = await createRoomApi(name);
      setRooms((current) => [room, ...current]);
      setName("");
    } catch (error) {
      if (error instanceof AxiosError) {
        showSnackbar(error.response?.data?.message ?? "Failed to create room");
      } else {
        showSnackbar("Failed to create room");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View className="flex-1 p-4 gap-2">
      <TextInput label="New room name" value={name} onChangeText={setName} mode="outlined" />
      <Button mode="contained" onPress={handleCreate} loading={isCreating} disabled={isCreating}>
        Create Room
      </Button>
      {rooms.map((room) => (
        <Pressable
          key={room.id}
          onPress={() => router.push(`/rooms/${room.id}`)}
          className="p-3 border border-gray-300 rounded mt-2"
        >
          <Text>{room.name}</Text>
          <Text variant="bodySmall">Host: {room.host_username}</Text>
        </Pressable>
      ))}
    </View>
  );
}
