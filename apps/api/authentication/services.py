import datetime

import jwt
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone
from google.auth.transport import requests
from google.oauth2 import id_token

from authentication.email import send_verification_email
from authentication.exceptions import UserConflictError, WeakPasswordError
from authentication.models import (
    BlacklistedRefreshToken,
    EmailVerificationToken,
    PasswordChangeLog,
    PasswordResetToken,
)
from authentication.utils import create_access_token, create_refresh_token, decode_token


def verify_email_user(token_uuid: str) -> dict | None:
    """Uses the token to verify an email and activates the user if it's valid"""

    try:
        token_obj = EmailVerificationToken.objects.select_related("user").get(token=token_uuid)
    except EmailVerificationToken.DoesNotExist:
        return None

    if token_obj.used or token_obj.expires_at < timezone.now():
        return None

    user = token_obj.user
    user.is_active = True
    user.save()

    token_obj.used = True
    token_obj.save()

    return {
        "access": create_access_token(user.id),
        "refresh": create_refresh_token(user.id),
        "email": user.email,
    }


def create_user(username: str, email: str, password: str):
    """Creates a new user account with email verification or raises an error."""
    existing_user = User.objects.filter(email=email).first()
    if existing_user:
        if not existing_user.is_active:
            return existing_user
        raise UserConflictError()

    try:
        validate_password(password, user=User(username=username, email=email))
    except DjangoValidationError as exc:
        raise WeakPasswordError(exc.messages[0]) from exc

    with transaction.atomic():
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_active=False,
            )
        except IntegrityError as exc:
            raise UserConflictError() from exc

        send_verification_email(user)

    return user


def login_user(email: str, password: str):
    """Authenticates a user or returns None if the email or password is invalid."""

    user_by_email = User.objects.filter(email=email).first()

    if not user_by_email:
        return None

    user = authenticate(
        username=user_by_email.username,
        password=password,
    )

    if not user:
        return None

    if not user.is_active:
        return None

    return {
        "access": create_access_token(user.id),
        "refresh": create_refresh_token(user.id),
    }


def blacklist_refresh_token(refresh_token: str):
    """Blacklists a refresh token or returns None if the token is invalid."""

    try:
        payload = decode_token(refresh_token)
    except jwt.InvalidTokenError:
        return None

    expires_at = datetime.datetime.fromtimestamp(
        payload["exp"],
        tz=datetime.UTC,
    )

    try:
        BlacklistedRefreshToken.objects.create(
            refresh_token=refresh_token,
            expires_at=expires_at,
        )
    except IntegrityError:
        pass


def refresh_access_token(refresh_token: str):
    """Creates a new access token or returns None if the refresh token is invalid, blacklisted, stale, or not a refresh token."""

    try:
        payload = decode_token(refresh_token)
    except jwt.InvalidTokenError:
        return None

    if payload.get("type") != "refresh":
        return None

    if BlacklistedRefreshToken.objects.filter(
        refresh_token=refresh_token,
    ).exists():
        return None

    try:
        changed_at = PasswordChangeLog.objects.get(user_id=payload["user_id"]).changed_at
        issued_at = datetime.datetime.fromtimestamp(payload["iat"], tz=datetime.UTC)
        if issued_at < changed_at:
            return None
    except PasswordChangeLog.DoesNotExist:
        pass

    return {
        "access": create_access_token(payload["user_id"]),
    }


def login_with_google(id_token_string: str):
    """Authenticates a user with Google or returns None if the token or required user information is invalid."""

    try:
        payload = id_token.verify_oauth2_token(
            id_token_string,
            requests.Request(),
            settings.GOOGLE_WEB_CLIENT_ID,
        )
    except ValueError:
        return None

    google_sub = payload.get("sub")
    email = payload.get("email")
    email_verified = payload.get("email_verified", False)

    if not google_sub or not email or not email_verified:
        return None

    user = User.objects.filter(email=email).first()

    if user and not user.is_active:
        return None

    if not user:
        user = User.objects.create_user(
            username=email,
            email=email,
        )

    return {
        "access": create_access_token(user.id),
        "refresh": create_refresh_token(user.id),
        "user": {
            "id": str(user.id),
            "email": user.email,
        },
    }


def resend_verification_email(email: str):
    """Resends the email verification token, or returns None if not eligible."""
    # TODO: rate-limit with Redis
    user = User.objects.filter(email=email).first()

    if not user or user.is_active:
        return None

    send_verification_email(user)
    return user


def reset_password(token_uuid: str, email: str, new_password: str) -> bool:
    """Uses the token to reset the user's password if it's valid"""

    try:
        token_obj = PasswordResetToken.objects.select_related("user").get(token=token_uuid)
    except PasswordResetToken.DoesNotExist:
        return False

    if token_obj.used or token_obj.expires_at < timezone.now():
        return False

    if token_obj.user.email != email:
        return False

    user = token_obj.user

    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as exc:
        raise WeakPasswordError(exc.messages[0]) from exc

    user.set_password(new_password)
    user.save()

    PasswordChangeLog.objects.update_or_create(user=user, defaults={"changed_at": timezone.now()})

    token_obj.used = True
    token_obj.save()

    return True
