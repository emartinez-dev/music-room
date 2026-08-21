import datetime
from unittest.mock import patch

import pytest
from django.contrib.auth.models import User
from django.core import mail
from django.utils import timezone

from authentication.email import send_password_reset_email
from authentication.exceptions import UserConflictError
from authentication.models import BlacklistedRefreshToken, EmailVerificationToken, PasswordChangeLog
from authentication.services import (
    blacklist_refresh_token,
    create_user,
    login_user,
    login_with_google,
    refresh_access_token,
    resend_verification_email,
    reset_password,
    verify_email_user,
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

    with pytest.raises(UserConflictError):
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

    with pytest.raises(UserConflictError):
        create_user(
            username="marc",
            email="marc2@test.com",
            password="password456",
        )


def test_create_user_returns_existing_user_if_unverified():
    existing = create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )
    assert existing.is_active is False

    result = create_user(
        username="ignored-username",
        email="marc@test.com",
        password="ignored-password",
    )

    assert result.id == existing.id
    assert result.username == "marc"
    assert User.objects.count() == 1


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


def test_refresh_access_token_rejects_token_issued_before_password_change():
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")
    refresh_token = create_refresh_token(user.id)

    PasswordChangeLog.objects.create(
        user=user,
        changed_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(seconds=5),
    )

    assert refresh_access_token(refresh_token) is None


def test_refresh_access_token_allows_token_issued_after_password_change():
    user = User.objects.create_user(username="marc", email="marc@test.com", password="password123")

    PasswordChangeLog.objects.create(
        user=user,
        changed_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(seconds=5),
    )

    refresh_token = create_refresh_token(user.id)
    result = refresh_access_token(refresh_token)

    assert result is not None
    assert "access" in result


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


# verify_email_user tests


def test_verify_email_user_activates_user_and_returns_tokens():
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

    result = verify_email_user(token_obj.token)

    assert result is not None
    assert "access" in result
    assert "refresh" in result
    assert result["email"] == "marc@test.com"

    user.refresh_from_db()
    assert user.is_active is True

    token_obj.refresh_from_db()
    assert token_obj.used is True


def test_verify_email_user_returns_none_if_token_does_not_exist():
    assert verify_email_user("000000") is None


def test_verify_email_user_returns_none_if_token_already_used():
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

    assert verify_email_user(token_obj.token) is None


def test_verify_email_user_returns_none_if_token_is_expired():
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

    assert verify_email_user(token_obj.token) is None
    user.refresh_from_db()
    assert user.is_active is False


# reset_password tests


def test_reset_password_sets_new_password_and_marks_token_used():
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="old-password",
    )

    token_obj = EmailVerificationToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )

    result = reset_password(token_obj.token, user.email, "new-password")

    assert result is True

    token_obj.refresh_from_db()
    assert token_obj.used is True

    user.refresh_from_db()
    user.check_password("new-password")
    assert user.check_password("new-password") is True
    assert user.check_password("old-password") is False


def test_reset_password_returns_false_if_token_does_not_exist():
    assert reset_password("000000", "marc@test.com", "new-password") is False


def test_reset_password_returns_false_if_token_already_used():
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="old-password",
    )

    token_obj = EmailVerificationToken.objects.create(
        user=user,
        used=True,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )

    assert reset_password(token_obj.token, user.email, "new-password") is False


def test_reset_password_returns_false_if_token_is_expired():
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="old-password",
    )

    token_obj = EmailVerificationToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=1),
    )

    assert reset_password(token_obj.token, user.email, "new-password") is False


def test_reset_password_returns_false_if_email_does_not_match_token_owner():
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="old-password",
    )

    token_obj = EmailVerificationToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )

    assert reset_password(token_obj.token, "someone-else@test.com", "new-password") is False

    user.refresh_from_db()
    assert user.check_password("old-password") is True

    token_obj.refresh_from_db()
    assert token_obj.used is False


def test_reset_password_creates_password_change_log():
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="old-password",
    )

    token_obj = EmailVerificationToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )

    before = timezone.now()
    reset_password(token_obj.token, user.email, "new-password")

    log = PasswordChangeLog.objects.get(user=user)
    assert log.changed_at >= before


# send_password_reset_email tests


def test_send_password_reset_email_creates_token_and_sends_email():
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    token_obj = send_password_reset_email(user)

    assert token_obj.user == user
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == ["marc@test.com"]


# resend_verification_email tests


def test_resend_verification_email_sends_new_token_for_unverified_user():
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
        is_active=False,
    )

    result = resend_verification_email("marc@test.com")

    assert result == user
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == ["marc@test.com"]
    assert EmailVerificationToken.objects.filter(user=user, used=False).count() == 1


def test_resend_verification_email_returns_none_if_user_does_not_exist():
    assert resend_verification_email("missing@test.com") is None
    assert len(mail.outbox) == 0


def test_resend_verification_email_returns_none_if_already_verified():
    User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
        is_active=True,
    )

    assert resend_verification_email("marc@test.com") is None
    assert len(mail.outbox) == 0


def test_resend_verification_email_invalidates_previous_unused_token():
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
        is_active=False,
    )

    old_token = EmailVerificationToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )

    resend_verification_email("marc@test.com")

    assert not EmailVerificationToken.objects.filter(id=old_token.id).exists()
