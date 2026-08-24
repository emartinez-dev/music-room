from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth.models import User
from django.test import Client

from authentication.utils import create_access_token

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return Client()


@patch("tracks.services.spotify_request")
def test_search_tracks_success(mock_spotify_request, client):
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")
    token = create_access_token(user.id)

    mock_spotify_request.return_value = MagicMock(
        json=lambda: {
            "tracks": {
                "items": [
                    {
                        "uri": "spotify:track:1",
                        "name": "Song",
                        "artists": [{"name": "Artist"}],
                        "album": {"name": "Album", "images": [{"url": "http://img"}]},
                        "duration_ms": 200000,
                    }
                ]
            }
        }
    )

    response = client.get(
        "/api/tracks/search",
        {"q": "song"},
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    assert response.status_code == 200
    assert response.json() == [
        {
            "spotify_uri": "spotify:track:1",
            "name": "Song",
            "artist": "Artist",
            "album": "Album",
            "duration_ms": 200000,
            "image_url": "http://img",
        }
    ]


def test_search_tracks_requires_auth(client):
    response = client.get("/api/tracks/search", {"q": "song"})

    assert response.status_code == 401


def test_search_tracks_forbidden_when_spotify_not_linked(client):
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")
    token = create_access_token(user.id)

    response = client.get(
        "/api/tracks/search",
        {"q": "song"},
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )

    assert response.status_code == 403
    assert response.json() == {
        "code": "forbidden",
        "message": "Link your Spotify account to use this feature",
    }
