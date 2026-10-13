import { Api } from "./api";

type RoomListItem = { id: number; name: string; host_username: string };
type RoomTrackItem = { spotify_uri: string; name: string; artist: string; image_url: string };
type RoomDetail = RoomListItem & { tracks: RoomTrackItem[] };

export async function createRoomApi(name: string): Promise<RoomListItem> {
  const { data } = await Api.post("/rooms", { name });
  return data;
}

export async function listRoomsApi(): Promise<RoomListItem[]> {
  const { data } = await Api.get("/rooms");
  return data;
}

export async function getRoomApi(roomId: number): Promise<RoomDetail> {
  const { data } = await Api.get(`/rooms/${roomId}`);
  return data;
}

export async function deleteRoomApi(roomId: number): Promise<null> {
  const { data } = await Api.delete(`/rooms/${roomId}`);
  return data;
}

export async function addTrackToRoomApi(roomId: number, spotifyUri: string): Promise<RoomDetail> {
  const { data } = await Api.post(`/rooms/${roomId}/tracks`, { spotify_uri: spotifyUri });
  return data;
}
