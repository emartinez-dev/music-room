import datetime
from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth.models import User
from django.utils import timezone

from authentication.exceptions import SpotifyAuthError
from authentication.models import SpotifyCredential
from authentication.spotify_client import spotify_request

pytestmark = pytest.mark.django_db


def _make_user_with_credential(access_token="valid-token"):
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")
    SpotifyCredential.objects.create(
        user=user,
        access_token=access_token,
        refresh_token="refresh-token",
        scope="user-read-private",
        expires_at=timezone.now() + datetime.timedelta(hours=1),
    )
    return user


def test_spotify_request_raises_if_user_has_no_credential():
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")

    with pytest.raises(SpotifyAuthError):
        spotify_request(user, "GET", "/search")


@patch("authentication.spotify_client.http_requests.request")
def test_spotify_request_returns_response_on_success(mock_request):
    user = _make_user_with_credential()
    mock_request.return_value = MagicMock(status_code=200)

    response = spotify_request(user, "GET", "/search")

    assert response.status_code == 200
    mock_request.assert_called_once_with(
        "GET",
        "https://api.spotify.com/v1/search",
        headers={"Authorization": "Bearer valid-token"},
    )


@patch("authentication.spotify_client.refresh_spotify_token")
@patch("authentication.spotify_client.http_requests.request")
def test_spotify_request_refreshes_and_retries_on_401(mock_request, mock_refresh):
    user = _make_user_with_credential(access_token="expired-token")
    credential = user.spotify_credential

    mock_refresh.return_value = MagicMock(access_token="fresh-token")
    mock_request.side_effect = [
        MagicMock(status_code=401),
        MagicMock(status_code=200),
    ]

    response = spotify_request(user, "GET", "/search")

    assert response.status_code == 200
    mock_refresh.assert_called_once_with(credential)
    assert mock_request.call_count == 2
    assert mock_request.call_args_list[1].kwargs["headers"] == {
        "Authorization": "Bearer fresh-token"
    }


@patch("authentication.spotify_client.refresh_spotify_token")
@patch("authentication.spotify_client.http_requests.request")
def test_spotify_request_raises_if_retry_still_401(mock_request, mock_refresh):
    user = _make_user_with_credential(access_token="expired-token")
    mock_refresh.return_value = MagicMock(access_token="fresh-token")
    mock_request.return_value = MagicMock(status_code=401)

    with pytest.raises(SpotifyAuthError):
        spotify_request(user, "GET", "/search")

    assert mock_request.call_count == 2
