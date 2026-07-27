import pytest
from django.contrib.auth.models import User

from music_room.exceptions import InvalidEmailError
from music_room.services.auth import create_user, login_user

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
