import datetime

import pytest
from django.contrib.auth.models import User
from django.test import Client

from authentication.models import BlacklistedRefreshToken
from authentication.utils import create_refresh_token, decode_token

pytestmark = pytest.mark.django_db


@pytest.fixture
def client():
    return Client()


def test_register_success(client):
    response = client.post(
        "/api/auth/register",
        data={
            "username": "marc",
            "email": "marc@test.com",
            "password": "password123",
        },
        content_type="application/json",
    )

    assert response.status_code == 201

    body = response.json()

    assert body["email"] == "marc@test.com"
    assert "id" in body


def test_register_existing_email(client):
    User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    response = client.post(
        "/api/auth/register",
        data={
            "username": "another",
            "email": "marc@test.com",
            "password": "password456",
        },
        content_type="application/json",
    )

    assert response.status_code == 409

    assert response.json() == {
        "code": "conflict",
        "message": "Email already exists",
    }


def test_login_success(client):
    User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    response = client.post(
        "/api/auth/login",
        data={
            "email": "marc@test.com",
            "password": "password123",
        },
        content_type="application/json",
    )

    assert response.status_code == 200

    body = response.json()

    assert "access" in body
    assert "refresh" in body


def test_login_invalid_email(client):
    response = client.post(
        "/api/auth/login",
        data={
            "email": "missing@test.com",
            "password": "password123",
        },
        content_type="application/json",
    )

    assert response.status_code == 401

    assert response.json() == {
        "code": "unauthorized",
        "message": "Invalid credentials",
    }


def test_login_invalid_password(client):
    User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    response = client.post(
        "/api/auth/login",
        data={
            "email": "marc@test.com",
            "password": "wrong-password",
        },
        content_type="application/json",
    )

    assert response.status_code == 401

    assert response.json() == {
        "code": "unauthorized",
        "message": "Invalid credentials",
    }


def test_logout(client):
    refresh_token = create_refresh_token(1)

    response = client.post(
        "/api/auth/logout",
        data={
            "refresh": refresh_token,
        },
        content_type="application/json",
    )

    assert response.status_code == 204

    assert BlacklistedRefreshToken.objects.count() == 1

    blacklisted = BlacklistedRefreshToken.objects.first()

    assert blacklisted is not None
    assert blacklisted.refresh_token == refresh_token


def test_refresh_success(client):
    refresh_token = create_refresh_token(1)

    response = client.post(
        "/api/auth/refresh",
        data={
            "refresh": refresh_token,
        },
        content_type="application/json",
    )

    assert response.status_code == 200

    body = response.json()

    assert "access" in body


def test_refresh_blacklisted_token(client):
    refresh_token = create_refresh_token(1)

    BlacklistedRefreshToken.objects.create(
        refresh_token=refresh_token,
        expires_at=datetime.datetime.fromtimestamp(
            decode_token(refresh_token)["exp"],
            tz=datetime.UTC,
        ),
    )

    response = client.post(
        "/api/auth/refresh",
        data={
            "refresh": refresh_token,
        },
        content_type="application/json",
    )

    assert response.status_code == 401

    assert response.json() == {
        "code": "unauthorized",
        "message": "Invalid refresh token",
    }
