from ninja import Schema

# --- /rooms ---


class RoomCreateSchema(Schema):
    name: str


class RoomListItem(Schema):
    id: int
    name: str
    host_username: str


# --- /rooms/{room_id} ---


class RoomTrackItem(Schema):
    spotify_uri: str
    name: str
    artist: str
    image_url: str


class RoomDetailResponse(Schema):
    id: int
    name: str
    host_username: str
    tracks: list[RoomTrackItem]


# --- /rooms/{room_id}/tracks ---


class AddTrackSchema(Schema):
    spotify_uri: str
