from unittest.mock import patch

import pytest
from django.contrib.auth.models import User

from authentication.exceptions import InvalidEmailError
from authentication.models import BlacklistedRefreshToken
from authentication.services import (
    blacklist_refresh_token,
    create_user,
    login_user,
    login_with_google,
)
from authentication.utils import create_refresh_token

pytestmark = pytest.mark.django_db


def test_create_user():
    user = create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    assert user.username == "marc"
    assert user.email == "marc@test.com"

    assert User.objects.count() == 1


def test_create_user_existing_email_raises():
    User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    with pytest.raises(InvalidEmailError):
        create_user(
            username="another",
            email="marc@test.com",
            password="password456",
        )


def test_create_user_existing_username_raises():
    User.objects.create_user(
        username="marc",
        email="marc1@test.com",
        password="password123",
    )

    with pytest.raises(InvalidEmailError):
        create_user(
            username="marc",
            email="marc2@test.com",
            password="password456",
        )


def test_login_user_returns_none_if_email_does_not_exist():
    assert (
        login_user(
            email="missing@test.com",
            password="password123",
        )
        is None
    )


def test_login_user_returns_none_if_password_is_invalid():
    User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="correct-password",
    )

    assert (
        login_user(
            email="marc@test.com",
            password="wrong-password",
        )
        is None
    )


def test_login_user_returns_tokens():
    User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    tokens = login_user(
        email="marc@test.com",
        password="password123",
    )

    assert tokens is not None
    assert "access" in tokens
    assert "refresh" in tokens

    assert isinstance(tokens["access"], str)
    assert isinstance(tokens["refresh"], str)


def test_blacklist_refresh_token():
    refresh_token = create_refresh_token(1)

    blacklist_refresh_token(refresh_token)

    assert BlacklistedRefreshToken.objects.count() == 1

    blacklisted = BlacklistedRefreshToken.objects.first()

    assert blacklisted is not None
    assert blacklisted.refresh_token == refresh_token


# Google OAuth2 login tests with @patch mocks


@patch("authentication.services.id_token.verify_oauth2_token")
def test_login_with_google_existing_user(mock_verify):
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    mock_verify.return_value = {
        "sub": "google-sub-123",
        "email": "marc@test.com",
        "email_verified": True,
    }

    tokens = login_with_google("valid-google-token")

    assert tokens is not None
    assert "access" in tokens
    assert "refresh" in tokens

    assert tokens["user"]["id"] == str(user.id)
    assert tokens["user"]["email"] == "marc@test.com"

    assert User.objects.count() == 1


@patch("authentication.services.id_token.verify_oauth2_token")
def test_login_with_google_creates_user_if_not_exists(mock_verify):
    mock_verify.return_value = {
        "sub": "google-sub-123",
        "email": "new@test.com",
        "email_verified": True,
    }

    tokens = login_with_google("valid-google-token")

    assert tokens is not None

    user = User.objects.get(email="new@test.com")

    assert user.email == "new@test.com"
    assert user.username == "new@test.com"

    assert tokens["user"]["id"] == str(user.id)
    assert tokens["user"]["email"] == "new@test.com"


@patch("authentication.services.id_token.verify_oauth2_token")
def test_login_with_google_returns_none_for_invalid_token(mock_verify):
    mock_verify.side_effect = ValueError

    assert login_with_google("invalid-google-token") is None


@patch("authentication.services.id_token.verify_oauth2_token")
def test_login_with_google_returns_none_without_sub(mock_verify):
    mock_verify.return_value = {
        "email": "marc@test.com",
        "email_verified": True,
    }

    assert login_with_google("google-token") is None


@patch("authentication.services.id_token.verify_oauth2_token")
def test_login_with_google_returns_none_without_email(mock_verify):
    mock_verify.return_value = {
        "sub": "google-sub-123",
        "email_verified": True,
    }

    assert login_with_google("google-token") is None


@patch("authentication.services.id_token.verify_oauth2_token")
def test_login_with_google_returns_none_if_email_is_not_verified(mock_verify):
    mock_verify.return_value = {
        "sub": "google-sub-123",
        "email": "marc@test.com",
        "email_verified": False,
    }

    assert login_with_google("google-token") is None


@patch("authentication.services.id_token.verify_oauth2_token")
def test_login_with_google_returns_none_if_email_verified_is_missing(mock_verify):
    mock_verify.return_value = {
        "sub": "google-sub-123",
        "email": "marc@test.com",
    }

    assert login_with_google("google-token") is None
