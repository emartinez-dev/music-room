import datetime

import jwt
import pytest
from django.conf import settings
from django.contrib.auth.models import User

from authentication.auth import JWTAuth
from authentication.models import PasswordChangeLog
from authentication.utils import create_access_token, create_refresh_token

pytestmark = pytest.mark.django_db


def test_authenticate_returns_user_for_valid_token():
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")
    token = create_access_token(user.id)

    assert JWTAuth().authenticate(None, token) == user


def test_authenticate_returns_none_for_invalid_token():
    assert JWTAuth().authenticate(None, "not-a-real-token") is None


def test_authenticate_returns_none_if_user_does_not_exist():
    token = create_access_token(999999)

    assert JWTAuth().authenticate(None, token) is None


def test_authenticate_rejects_a_refresh_token():
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")
    refresh_token = create_refresh_token(user.id)

    assert JWTAuth().authenticate(None, refresh_token) is None


def test_authenticate_allows_token_when_no_password_change_log_exists():
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")
    token = create_access_token(user.id)

    assert JWTAuth().authenticate(None, token) == user


def test_authenticate_rejects_token_issued_before_password_change():
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")
    token = create_access_token(user.id)

    PasswordChangeLog.objects.create(
        user=user,
        changed_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(seconds=5),
    )

    assert JWTAuth().authenticate(None, token) is None


def test_authenticate_allows_token_issued_after_password_change():
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")

    PasswordChangeLog.objects.create(
        user=user,
        changed_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(seconds=5),
    )

    token = create_access_token(user.id)

    assert JWTAuth().authenticate(None, token) == user


def test_authenticate_rejects_an_expired_token():
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")

    issued_at = datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=1)
    expired_token = jwt.encode(
        {
            "user_id": user.id,
            "type": "access",
            "iat": issued_at,
            "exp": issued_at + datetime.timedelta(minutes=30),
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    assert JWTAuth().authenticate(None, expired_token) is None


def test_authenticate_rejects_a_token_signed_with_another_secret():
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")

    forged_token = jwt.encode(
        {
            "user_id": user.id,
            "type": "access",
            "iat": datetime.datetime.now(datetime.UTC),
            "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=30),
        },
        "not-the-real-secret-key",
        algorithm="HS256",
    )

    assert JWTAuth().authenticate(None, forged_token) is None


def test_authenticate_rejects_a_token_without_a_type():
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")

    untyped_token = jwt.encode(
        {
            "user_id": user.id,
            "iat": datetime.datetime.now(datetime.UTC),
            "exp": datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=30),
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    assert JWTAuth().authenticate(None, untyped_token) is None
