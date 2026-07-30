import pytest
from django.contrib.auth.models import User
from django.test import Client

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
    response = client.post(
        "/api/auth/logout",
        data={
            "refresh": "dummy-token",
        },
        content_type="application/json",
    )

    assert response.status_code == 204
