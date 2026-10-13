import pytest
from django.contrib.auth.models import User

from rooms.models import Room, RoomMember, RoomTrack
from rooms.services import add_track_to_room, create_room, delete_room, get_room_detail, list_rooms
from tracks.models import Track

pytestmark = pytest.mark.django_db


def _make_user(username="marc"):
    return User.objects.create_user(
        username=username, email=f"{username}@test.com", password="password123"
    )


def _make_track(spotify_uri="spotify:track:1"):
    return Track.objects.create(
        spotify_uri=spotify_uri,
        name="Song",
        artist="Artist",
        album="Album",
        duration_ms=200000,
        image_url="",
    )


def test_create_room_sets_host_and_membership():
    user = _make_user()

    room = create_room(user, "Friday night")

    assert room.name == "Friday night"
    assert room.host == user
    assert RoomMember.objects.filter(room=room, user=user).exists()


def test_list_rooms_orders_most_recent_first():
    user = _make_user()
    first = create_room(user, "First")
    second = create_room(user, "Second")

    assert list_rooms() == [second, first]


def test_get_room_detail_registers_visitor_as_member():
    host = _make_user("host")
    visitor = _make_user("visitor")
    room = create_room(host, "Friday night")

    detail = get_room_detail(visitor, room.id)

    assert detail["id"] == room.id
    assert detail["tracks"] == []
    assert RoomMember.objects.filter(room=room, user=visitor).exists()


def test_get_room_detail_returns_none_for_missing_room():
    user = _make_user()

    assert get_room_detail(user, 999999) is None


def test_delete_room_by_host_succeeds():
    host = _make_user("host")
    room = create_room(host, "Friday night")

    assert delete_room(host, room.id) == "deleted"
    assert not Room.objects.filter(id=room.id).exists()


def test_delete_room_by_non_host_is_forbidden():
    host = _make_user("host")
    other = _make_user("other")
    room = create_room(host, "Friday night")

    assert delete_room(other, room.id) == "forbidden"
    assert Room.objects.filter(id=room.id).exists()


def test_delete_room_returns_not_found_for_missing_room():
    user = _make_user()

    assert delete_room(user, 999999) == "not_found"


def test_add_track_to_room_caches_track_reference():
    user = _make_user()
    room = create_room(user, "Friday night")
    track = _make_track()

    assert add_track_to_room(user, room.id, track.spotify_uri) is True
    assert RoomTrack.objects.filter(room=room, track=track, added_by=user).exists()


def test_add_track_to_room_is_idempotent():
    user = _make_user()
    room = create_room(user, "Friday night")
    track = _make_track()

    add_track_to_room(user, room.id, track.spotify_uri)
    add_track_to_room(user, room.id, track.spotify_uri)

    assert RoomTrack.objects.filter(room=room, track=track).count() == 1


def test_add_track_to_room_returns_false_for_missing_track():
    user = _make_user()
    room = create_room(user, "Friday night")

    assert add_track_to_room(user, room.id, "spotify:track:missing") is False


def test_add_track_to_room_returns_false_for_missing_room():
    user = _make_user()
    track = _make_track()

    assert add_track_to_room(user, 999999, track.spotify_uri) is False
