import pytest
from django.contrib.auth.models import User
from django.test import Client

from authentication.utils import create_access_token
from rooms.models import Room
from tracks.models import Track

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return Client()


def _make_authenticated_user(username="marc"):
    user = User.objects.create_user(
        username=username, email=f"{username}@test.com", password="password123"
    )
    token = create_access_token(user.id)
    return user, {"HTTP_AUTHORIZATION": f"Bearer {token}"}


def test_create_room(client):
    user, headers = _make_authenticated_user()

    response = client.post(
        "/api/rooms",
        data={"name": "Friday night"},
        content_type="application/json",
        **headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Friday night"
    assert body["host_username"] == user.username


def test_create_room_requires_auth(client):
    response = client.post(
        "/api/rooms",
        data={"name": "Friday night"},
        content_type="application/json",
    )

    assert response.status_code == 401


def test_list_rooms(client):
    user, headers = _make_authenticated_user()
    Room.objects.create(name="Room A", host=user)
    Room.objects.create(name="Room B", host=user)

    response = client.get("/api/rooms", **headers)

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_room_detail(client):
    user, headers = _make_authenticated_user()
    room = Room.objects.create(name="Friday night", host=user)

    response = client.get(f"/api/rooms/{room.id}", **headers)

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == room.id
    assert body["tracks"] == []


def test_get_room_detail_not_found(client):
    _, headers = _make_authenticated_user()

    response = client.get("/api/rooms/999999", **headers)

    assert response.status_code == 404
    assert response.json()["code"] == "not_found"


def test_delete_room_as_host(client):
    user, headers = _make_authenticated_user()
    room = Room.objects.create(name="Friday night", host=user)

    response = client.delete(f"/api/rooms/{room.id}", **headers)

    assert response.status_code == 204
    assert not Room.objects.filter(id=room.id).exists()


def test_delete_room_as_non_host_is_forbidden(client):
    host = User.objects.create_user(username="host", email="host@test.com", password="password123")
    room = Room.objects.create(name="Friday night", host=host)

    _, headers = _make_authenticated_user("other")

    response = client.delete(f"/api/rooms/{room.id}", **headers)

    assert response.status_code == 403
    assert response.json()["code"] == "forbidden"
    assert Room.objects.filter(id=room.id).exists()


def test_delete_room_not_found(client):
    _, headers = _make_authenticated_user()

    response = client.delete("/api/rooms/999999", **headers)

    assert response.status_code == 404


def test_add_track_to_room(client):
    user, headers = _make_authenticated_user()
    room = Room.objects.create(name="Friday night", host=user)
    track = Track.objects.create(
        spotify_uri="spotify:track:1",
        name="Song",
        artist="Artist",
        album="Album",
        duration_ms=200000,
        image_url="",
    )

    response = client.post(
        f"/api/rooms/{room.id}/tracks",
        data={"spotify_uri": track.spotify_uri},
        content_type="application/json",
        **headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["tracks"] == [
        {
            "spotify_uri": track.spotify_uri,
            "name": track.name,
            "artist": track.artist,
            "image_url": track.image_url,
        }
    ]


def test_add_track_to_room_not_found(client):
    user, headers = _make_authenticated_user()
    room = Room.objects.create(name="Friday night", host=user)

    response = client.post(
        f"/api/rooms/{room.id}/tracks",
        data={"spotify_uri": "spotify:track:missing"},
        content_type="application/json",
        **headers,
    )

    assert response.status_code == 404
