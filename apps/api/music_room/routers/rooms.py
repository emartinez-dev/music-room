# Router, Schemas
from ninja import Router

from authentication.auth import JWTAuth
from authentication.schemas import ErrorSchema
from rooms.schemas import AddTrackSchema, RoomCreateSchema, RoomDetailResponse, RoomListItem
from rooms.services import add_track_to_room, create_room, delete_room, get_room_detail, list_rooms

rooms_router = Router()
jwt_auth = JWTAuth()


# /rooms
@rooms_router.post("", response=RoomListItem, auth=jwt_auth)
def create(request, data: RoomCreateSchema):
    room = create_room(request.auth, data.name)
    return {"id": room.id, "name": room.name, "host_username": room.host.username}


# /rooms
@rooms_router.get("", response=list[RoomListItem], auth=jwt_auth)
def list_all(request):
    return [
        {"id": room.id, "name": room.name, "host_username": room.host.username}
        for room in list_rooms()
    ]


# /rooms/{room_id}
@rooms_router.get("/{room_id}", response={200: RoomDetailResponse, 404: ErrorSchema}, auth=jwt_auth)
def detail(request, room_id: int):
    room = get_room_detail(request.auth, room_id)
    if not room:
        return 404, {"code": "not_found", "message": "Room does not exist"}
    return room


# /rooms/{room_id}
@rooms_router.delete(
    "/{room_id}",
    response={204: None, 403: ErrorSchema, 404: ErrorSchema},
    auth=jwt_auth,
)
def delete(request, room_id: int):
    result = delete_room(request.auth, room_id)
    if result == "not_found":
        return 404, {"code": "not_found", "message": "Room does not exist"}
    if result == "forbidden":
        return 403, {"code": "forbidden", "message": "Only the host can delete this room"}
    return 204, None


# /rooms/{room_id}/tracks
@rooms_router.post(
    "/{room_id}/tracks",
    response={200: RoomDetailResponse, 404: ErrorSchema},
    auth=jwt_auth,
)
def add_track(request, room_id: int, data: AddTrackSchema):
    added = add_track_to_room(request.auth, room_id, data.spotify_uri)
    if not added:
        return 404, {"code": "not_found", "message": "Room or track does not exist"}
    return get_room_detail(request.auth, room_id)
