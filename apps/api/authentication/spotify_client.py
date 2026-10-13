import requests as http_requests

from authentication.exceptions import SpotifyAuthError
from authentication.services import refresh_spotify_token

SPOTIFY_API_BASE = "https://api.spotify.com/v1"


def spotify_request(user, method: str, path: str, **kwargs):
    """Makes any authenticated request to the Spotify Web API on behalf of a user. If the user's token has expired, it refreshes it"""

    if not hasattr(user, "spotify_credential"):
        raise SpotifyAuthError()

    credential = user.spotify_credential

    response = http_requests.request(
        method,
        f"{SPOTIFY_API_BASE}{path}",
        headers={"Authorization": f"Bearer {credential.access_token}"},
        **kwargs,
    )

    if response.status_code != 401:
        return response

    credential = refresh_spotify_token(credential)

    response = http_requests.request(
        method,
        f"{SPOTIFY_API_BASE}{path}",
        headers={"Authorization": f"Bearer {credential.access_token}"},
        **kwargs,
    )

    if response.status_code == 401:
        raise SpotifyAuthError()

    return response
