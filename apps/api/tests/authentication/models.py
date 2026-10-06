import datetime

import pytest
from django.contrib.auth.models import User

from authentication.models import (
    BlacklistedRefreshToken,
    EmailVerificationToken,
    PasswordChangeLog,
    PasswordResetToken,
    generate_verification_token,
)

pytestmark = pytest.mark.django_db


def test_generate_verification_token_is_unique_and_fits_the_column():
    tokens = {generate_verification_token() for _ in range(100)}

    assert len(tokens) == 100
    assert all(len(token) <= 64 for token in tokens)


def test_tokens_get_a_generated_value_by_default():
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    expires_at = datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1)
    verification = EmailVerificationToken.objects.create(user=user, expires_at=expires_at)
    reset = PasswordResetToken.objects.create(user=user, expires_at=expires_at)

    assert verification.token
    assert reset.token
    assert verification.token != reset.token

    assert verification.used is False
    assert reset.used is False


def test_deleting_a_user_deletes_their_tokens():
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    expires_at = datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1)
    EmailVerificationToken.objects.create(user=user, expires_at=expires_at)
    PasswordResetToken.objects.create(user=user, expires_at=expires_at)
    PasswordChangeLog.objects.create(user=user)

    user.delete()

    assert EmailVerificationToken.objects.count() == 0
    assert PasswordResetToken.objects.count() == 0
    assert PasswordChangeLog.objects.count() == 0


def test_blacklisted_refresh_token_str_is_truncated():
    token = BlacklistedRefreshToken.objects.create(
        refresh_token="a" * 50,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7),
    )

    assert str(token) == "a" * 20


def test_email_verification_token_str_reports_usage():
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    token = EmailVerificationToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )

    assert str(token) == "Verification for marc@test.com (unused)"

    token.used = True
    token.save()

    assert str(token) == "Verification for marc@test.com (used)"


def test_password_reset_token_str_reports_usage():
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    token = PasswordResetToken.objects.create(
        user=user,
        expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1),
    )

    assert str(token) == "Password reset for marc@test.com (unused)"

    token.used = True
    token.save()

    assert str(token) == "Password reset for marc@test.com (used)"


def test_password_change_log_str_mentions_the_user():
    user = User.objects.create_user(
        username="marc",
        email="marc@test.com",
        password="password123",
    )

    log = PasswordChangeLog.objects.create(user=user)

    assert str(log).startswith("Password change for marc@test.com at ")
