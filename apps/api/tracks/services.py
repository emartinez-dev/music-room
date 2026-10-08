from django.contrib.auth.models import User

from authentication.spotify_client import spotify_request
from tracks.models import Track


def search_tracks(user: User, query: str) -> list[Track]:
    """Searches Spotify's catalog for tracks matching the query and caches them in the Track table."""

    response = spotify_request(
        user,
        "GET",
        "/search",
        params={"q": query, "type": "track", "limit": 10},
    )

    tracks = []
    for item in response.json()["tracks"]["items"]:
        track, _ = Track.objects.update_or_create(
            spotify_uri=item["uri"],
            defaults={
                "name": item["name"],
                "artist": ", ".join(artist["name"] for artist in item["artists"]),
                "album": item["album"]["name"],
                "duration_ms": item["duration_ms"],
                "image_url": item["album"]["images"][0]["url"] if item["album"]["images"] else "",
            },
        )
        tracks.append(track)

    return tracks
