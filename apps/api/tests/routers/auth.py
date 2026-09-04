import datetime
from unittest.mock import patch

import pytest
from django.contrib.auth.models import User
from django.core import mail
from django.test import Client

from authentication.models import (
    BlacklistedRefreshToken,
    EmailVerificationToken,
    PasswordResetToken,
)
from authentication.utils import create_access_token, create_refresh_token, decode_token

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
            "password": "Str0ng-Passw0rd!",
        },
        content_type="application/json",
    )

    assert response.status_code == 201

    body = response.json()

    assert body["email"] == "marc@test.com"
    assert "id" in body


def test_register_weak_password(client):
    response = client.post(
        "/api/auth/register",
        data={
            "username": "marc",
            "email": "marc@test.com",
            "password": "password",
        },
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json()["code"] == "validation_error"
    assert User.objects.count() == 0


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
        "message": "A user with these credentials already exists",
    }


def test_register_existing_unverified_email_returns_the_same_user(client):
    first = client.post(
        "/api/auth/register",
        data={
            "username": "marc",
            "email": "marc@test.com",
            "password": "Str0ng-Passw0rd!",
        },
        content_type="application/json",
    )

    assert first.status_code == 201

    second = client.post(
        "/api/auth/register",
        data={
            "username": "another",
            "email": "marc@test.com",
            "password": "An0ther-Passw0rd!",
        },
        content_type="application/json",
    )

    assert second.status_code == 201
    assert second.json()["id"] == first.json()["id"]
    assert User.objects.count() == 1


def test_register_requires_all_fields(client):
    response = client.post(
        "/api/auth/register",
        data={"email": "marc@test.com"},
        content_type="application/json",
    )

    assert response.status_code == 422
    assert User.objects.count() == 0


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


def test_login_unverified_user_is_rejected(client):
    User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
        is_active=False,
    )

    response = client.post(
        "/api/auth/login",
        data={
            "email": "marc@test.com",
            "password": "password123",
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


def test_logout_is_idempotent(client):
    refresh_token = create_refresh_token(1)

    for _ in range(2):
        response = client.post(
            "/api/auth/logout",
            data={"refresh": refresh_token},
            content_type="application/json",
        )

        assert response.status_code == 204

    assert BlacklistedRefreshToken.objects.count() == 1


def test_logout_then_refresh_is_rejected(client):
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    login_response = client.post(
        "/api/auth/login",
        data={"email": "marc@test.com", "password": "password123"},
        content_type="application/json",
    )
    refresh_token = login_response.json()["refresh"]

    logout_response = client.post(
        "/api/auth/logout",
        data={"refresh": refresh_token},
        content_type="application/json",
    )

    assert logout_response.status_code == 204

    refresh_response = client.post(
        "/api/auth/refresh",
        data={"refresh": refresh_token},
        content_type="application/json",
    )

    assert refresh_response.status_code == 401
    assert User.objects.filter(id=user.id).exists()


def test_refresh_invalid_token(client):
    response = client.post(
        "/api/auth/refresh",
        data={"refresh": "not-a-real-token"},
        content_type="application/json",
    )

    assert response.status_code == 401

    assert response.json() == {
        "code": "unauthorized",
        "message": "Invalid refresh token",
    }


def test_refresh_rejects_an_access_token(client):
    response = client.post(
        "/api/auth/refresh",
        data={"refresh": create_access_token(1)},
        content_type="application/json",
    )

    assert response.status_code == 401


def test_refreshed_access_token_is_accepted_by_me(client):
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    refresh_response = client.post(
        "/api/auth/refresh",
        data={"refresh": create_refresh_token(user.id)},
        content_type="application/json",
    )

    assert refresh_response.status_code == 200

    me_response = client.get(
        "/api/auth/me",
        HTTP_AUTHORIZATION=f"Bearer {refresh_response.json()['access']}",
    )

    assert me_response.status_code == 200
    assert me_response.json()["email"] == "marc@test.com"


@patch("music_room.routers.auth.login_with_google")
def test_google_login_success(mock_login_with_google, client):
    mock_login_with_google.return_value = {
        "access": "access-token",
        "refresh": "refresh-token",
        "user": {
            "id": "1",
            "email": "marc@test.com",
        },
    }

    response = client.post(
        "/api/auth/google",
        data={
            "id_token": "valid-google-id-token",
        },
        content_type="application/json",
    )

    assert response.status_code == 200

    assert response.json() == {
        "access": "access-token",
        "refresh": "refresh-token",
        "user": {
            "id": "1",
            "email": "marc@test.com",
        },
    }

    mock_login_with_google.assert_called_once_with(
        "valid-google-id-token",
    )


@patch("music_room.routers.auth.login_with_google")
def test_google_login_invalid_credentials(mock_login_with_google, client):
    mock_login_with_google.return_value = None

    response = client.post(
        "/api/auth/google",
        data={
            "id_token": "invalid-google-id-token",
        },
        content_type="application/json",
    )

    assert response.status_code == 401

    assert response.json() == {
        "code": "unauthorized",
        "message": "Invalid Google credentials",
    }

    mock_login_with_google.assert_called_once_with(
        "invalid-google-id-token",
    )


def test_google_login_requires_id_token(client):
    response = client.post(
        "/api/auth/google",
        data={},
        content_type="application/json",
    )

    assert response.status_code == 422


def test_token(client):
    register_response = client.post(
        "/api/auth/register",
        data={
            "username": "marc",
            "email": "marc@test.com",
            "password": "Str0ng-Passw0rd!",
        },
        content_type="application/json",
    )

    assert register_response.status_code == 201

    verification_token = EmailVerificationToken.objects.get(user__email="marc@test.com")
    verify_response = client.post(
        "/api/auth/verify-email/",
        data={"token": verification_token.token},
        content_type="application/json",
    )

    assert verify_response.status_code == 200

    login_response = client.post(
        "/api/auth/login",
        data={
            "email": "marc@test.com",
            "password": "Str0ng-Passw0rd!",
        },
        content_type="application/json",
    )

    assert login_response.status_code == 200

    access_token = login_response.json()["access"]

    me_response = client.get(
        "/api/auth/me",
        HTTP_AUTHORIZATION=f"Bearer {access_token}",
    )

    assert me_response.status_code == 200
    assert me_response.json() == {
        "id": register_response.json()["id"],
        "email": "marc@test.com",
        "username": "marc",
    }


# me endpoint tests


def test_me_requires_authentication(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_me_rejects_an_invalid_token(client):
    response = client.get(
        "/api/auth/me",
        HTTP_AUTHORIZATION="Bearer not-a-real-token",
    )

    assert response.status_code == 401


def test_me_rejects_a_refresh_token(client):
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    response = client.get(
        "/api/auth/me",
        HTTP_AUTHORIZATION=f"Bearer {create_refresh_token(user.id)}",
    )

    assert response.status_code == 401


# verify-email endpoint tests


def test_verify_email_success_returns_tokens(client):
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
        is_active=False,
    )

    token_obj = EmailVerificationToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )

    response = client.post(
        "/api/auth/verify-email/",
        data={"token": token_obj.token},
        content_type="application/json",
    )

    assert response.status_code == 200

    body = response.json()
    assert "access" in body
    assert "refresh" in body


def test_verify_email_invalid_token(client):
    response = client.post(
        "/api/auth/verify-email/",
        data={"token": "000000"},
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json() == {
        "code": "invalid_token",
        "message": "Invalid or expired verification token",
    }


def test_verify_email_already_used(client):
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
        is_active=False,
    )

    token_obj = EmailVerificationToken.objects.create(
        user=user,
        used=True,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )

    response = client.post(
        "/api/auth/verify-email/",
        data={"token": token_obj.token},
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json() == {
        "code": "invalid_token",
        "message": "Invalid or expired verification token",
    }


def test_verify_email_expired_token(client):
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
        is_active=False,
    )

    token_obj = EmailVerificationToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=1),
    )

    response = client.post(
        "/api/auth/verify-email/",
        data={"token": token_obj.token},
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json() == {
        "code": "invalid_token",
        "message": "Invalid or expired verification token",
    }


# resend-verification endpoint tests


def test_resend_verification_success(client):
    User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
        is_active=False,
    )

    response = client.post(
        "/api/auth/resend-verification/",
        data={"email": "marc@test.com"},
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "If an account exists for this email, a verification link has been sent."
    }
    assert len(mail.outbox) == 1


def test_resend_verification_nonexistent_email_returns_generic_response(client):
    response = client.post(
        "/api/auth/resend-verification/",
        data={"email": "nonexistent@test.com"},
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "If an account exists for this email, a verification link has been sent."
    }
    assert len(mail.outbox) == 0


def test_resend_verification_already_verified_returns_generic_response(client):
    User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
        is_active=True,
    )

    response = client.post(
        "/api/auth/resend-verification/",
        data={"email": "marc@test.com"},
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "If an account exists for this email, a verification link has been sent."
    }
    assert len(mail.outbox) == 0


# request-password-reset endpoint tests


def test_request_password_reset_success(client):
    User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    response = client.post(
        "/api/auth/request-password-reset/",
        data={"email": "marc@test.com"},
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "If an account exists for this email, a reset link has been sent."
    }
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == ["marc@test.com"]


def test_request_password_reset_nonexistent_email_returns_generic_response(client):
    response = client.post(
        "/api/auth/request-password-reset/",
        data={"email": "nonexistent@test.com"},
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "If an account exists for this email, a reset link has been sent."
    }
    assert len(mail.outbox) == 0


def test_reset_password_success(client):
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="old-password",
    )

    token_obj = PasswordResetToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )

    response = client.post(
        "/api/auth/reset-password/",
        data={
            "email": "marc@test.com",
            "token": token_obj.token,
            "new_password": "new-password",
        },
        content_type="application/json",
    )

    assert response.status_code == 200

    body = response.json()
    assert body["email"] == "marc@test.com"
    assert "id" in body

    user.refresh_from_db()
    assert user.check_password("new-password") is True

    token_obj.refresh_from_db()
    assert token_obj.used is True


def test_reset_password_weak_password(client):
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="old-password",
    )

    token_obj = PasswordResetToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )

    response = client.post(
        "/api/auth/reset-password/",
        data={
            "email": "marc@test.com",
            "token": token_obj.token,
            "new_password": "password",
        },
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json()["code"] == "validation_error"

    user.refresh_from_db()
    assert user.check_password("old-password") is True


def test_reset_password_invalid_token(client):
    User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="old-password",
    )

    response = client.post(
        "/api/auth/reset-password/",
        data={
            "email": "marc@test.com",
            "token": "000000",
            "new_password": "new-password",
        },
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json() == {
        "code": "invalid_token",
        "message": "Invalid or expired verification token",
    }


def test_reset_password_email_does_not_match_token_owner(client):
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="old-password",
    )

    token_obj = PasswordResetToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )

    response = client.post(
        "/api/auth/reset-password/",
        data={
            "email": "someone-else@test.com",
            "token": token_obj.token,
            "new_password": "new-password",
        },
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json() == {
        "code": "invalid_token",
        "message": "Invalid or expired verification token",
    }

    user.refresh_from_db()
    assert user.check_password("old-password") is True


def test_reset_password_invalidates_previously_issued_access_token(client):
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="old-password",
    )

    login_response = client.post(
        "/api/auth/login",
        data={"email": "marc@test.com", "password": "old-password"},
        content_type="application/json",
    )
    access_token = login_response.json()["access"]

    me_response = client.get(
        "/api/auth/me",
        HTTP_AUTHORIZATION=f"Bearer {access_token}",
    )
    assert me_response.status_code == 200

    token_obj = PasswordResetToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )
    reset_response = client.post(
        "/api/auth/reset-password/",
        data={
            "email": "marc@test.com",
            "token": token_obj.token,
            "new_password": "new-password",
        },
        content_type="application/json",
    )
    assert reset_response.status_code == 200

    me_response_after_reset = client.get(
        "/api/auth/me",
        HTTP_AUTHORIZATION=f"Bearer {access_token}",
    )
    assert me_response_after_reset.status_code == 401


def test_reset_password_invalidates_previously_issued_refresh_token(client):
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="old-password",
    )

    login_response = client.post(
        "/api/auth/login",
        data={"email": "marc@test.com", "password": "old-password"},
        content_type="application/json",
    )
    refresh_token = login_response.json()["refresh"]

    token_obj = PasswordResetToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )
    reset_response = client.post(
        "/api/auth/reset-password/",
        data={
            "email": "marc@test.com",
            "token": token_obj.token,
            "new_password": "new-password",
        },
        content_type="application/json",
    )

    assert reset_response.status_code == 200

    refresh_response = client.post(
        "/api/auth/refresh",
        data={"refresh": refresh_token},
        content_type="application/json",
    )

    assert refresh_response.status_code == 401


def test_login_with_new_password_after_reset(client):
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="old-password",
    )

    token_obj = PasswordResetToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )
    client.post(
        "/api/auth/reset-password/",
        data={
            "email": "marc@test.com",
            "token": token_obj.token,
            "new_password": "new-password",
        },
        content_type="application/json",
    )

    old_password_response = client.post(
        "/api/auth/login",
        data={"email": "marc@test.com", "password": "old-password"},
        content_type="application/json",
    )

    assert old_password_response.status_code == 401

    new_password_response = client.post(
        "/api/auth/login",
        data={"email": "marc@test.com", "password": "new-password"},
        content_type="application/json",
    )

    assert new_password_response.status_code == 200
