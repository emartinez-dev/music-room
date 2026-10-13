from django.contrib.auth.models import User

from rooms.models import Room, RoomMember, RoomTrack
from tracks.models import Track


def create_room(user: User, name: str) -> Room:
    """Creates a room with the given user as host and first member."""
    room = Room.objects.create(name=name, host=user)
    RoomMember.objects.create(room=room, user=user)
    return room


def list_rooms() -> list[Room]:
    """Returns all rooms, most recently created first."""
    return list(Room.objects.select_related("host").order_by("-created_at"))


def get_room_detail(user: User, room_id: int) -> dict | None:
    """Returns a room's details and tracks, registering the user as a member, or None if the room doesn't exist."""
    room = Room.objects.select_related("host").filter(id=room_id).first()
    if not room:
        return None

    RoomMember.objects.get_or_create(room=room, user=user)

    room_tracks = RoomTrack.objects.filter(room=room).select_related("track").order_by("added_at")

    return {
        "id": room.id,
        "name": room.name,
        "host_username": room.host.username,
        "tracks": [
            {
                "spotify_uri": room_track.track.spotify_uri,
                "name": room_track.track.name,
                "artist": room_track.track.artist,
                "image_url": room_track.track.image_url,
            }
            for room_track in room_tracks
        ],
    }


def delete_room(user: User, room_id: int) -> str:
    """Deletes the room if the user is its host. Returns 'deleted', 'not_found' or 'forbidden'."""
    room = Room.objects.filter(id=room_id).first()
    if not room:
        return "not_found"
    if room.host_id != user.id:
        return "forbidden"
    room.delete()
    return "deleted"


def add_track_to_room(user: User, room_id: int, spotify_uri: str) -> bool:
    """Adds a cached track to a room's list. Returns False if the room or track doesn't exist."""
    room = Room.objects.filter(id=room_id).first()
    track = Track.objects.filter(spotify_uri=spotify_uri).first()
    if not room or not track:
        return False
    RoomTrack.objects.get_or_create(room=room, track=track, defaults={"added_by": user})
    return True
