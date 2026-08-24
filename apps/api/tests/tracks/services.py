from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth.models import User

from tracks.models import Track
from tracks.services import search_tracks

pytestmark = pytest.mark.django_db

SPOTIFY_SEARCH_RESPONSE = {
    "tracks": {
        "items": [
            {
                "uri": "spotify:track:1",
                "name": "Song",
                "artists": [{"name": "Artist One"}, {"name": "Artist Two"}],
                "album": {"name": "Album", "images": [{"url": "http://img"}]},
                "duration_ms": 200000,
            }
        ]
    }
}


@patch("tracks.services.spotify_request")
def test_search_tracks_caches_results(mock_spotify_request):
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")
    mock_spotify_request.return_value = MagicMock(json=lambda: SPOTIFY_SEARCH_RESPONSE)

    tracks = search_tracks(user, "song")

    assert len(tracks) == 1
    assert tracks[0].name == "Song"
    assert tracks[0].artist == "Artist One, Artist Two"

    cached = Track.objects.get(spotify_uri="spotify:track:1")
    assert cached.image_url == "http://img"


@patch("tracks.services.spotify_request")
def test_search_tracks_handles_missing_album_art(mock_spotify_request):
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")
    response = {
        "tracks": {
            "items": [
                {
                    "uri": "spotify:track:1",
                    "name": "Song",
                    "artists": [{"name": "Artist"}],
                    "album": {"name": "Album", "images": []},
                    "duration_ms": 200000,
                }
            ]
        }
    }
    mock_spotify_request.return_value = MagicMock(json=lambda: response)

    tracks = search_tracks(user, "song")

    assert tracks[0].image_url == ""


@patch("tracks.services.spotify_request")
def test_search_tracks_updates_existing_cached_track(mock_spotify_request):
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")
    Track.objects.create(
        spotify_uri="spotify:track:1",
        name="Old name",
        artist="Old artist",
        album="Old album",
        duration_ms=1,
        image_url="",
    )
    mock_spotify_request.return_value = MagicMock(json=lambda: SPOTIFY_SEARCH_RESPONSE)

    search_tracks(user, "song")

    assert Track.objects.count() == 1
    assert Track.objects.get(spotify_uri="spotify:track:1").name == "Song"
