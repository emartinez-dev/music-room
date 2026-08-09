import datetime

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import IntegrityError
from google.auth.transport import requests
from google.oauth2 import id_token

from authentication.exceptions import InvalidEmailError
from authentication.models import BlacklistedRefreshToken
from authentication.utils import create_access_token, create_refresh_token, decode_token


def create_user(username: str, email: str, password: str):
    if User.objects.filter(email=email).exists():
        raise InvalidEmailError()
    try:
        return User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
    except IntegrityError as exc:
        raise InvalidEmailError() from exc


def login_user(email: str, password: str):
    user_by_email = User.objects.filter(email=email).first()

    if not user_by_email:
        return None

    user = authenticate(
        username=user_by_email.username,
        password=password,
    )

    if not user:
        return None

    return {
        "access": create_access_token(user.id),
        "refresh": create_refresh_token(user.id),
    }


def blacklist_refresh_token(refresh_token: str):
    payload = decode_token(refresh_token)

    expires_at = datetime.datetime.fromtimestamp(
        payload["exp"],
        tz=datetime.UTC,
    )

    BlacklistedRefreshToken.objects.create(
        refresh_token=refresh_token,
        expires_at=expires_at,
    )


def refresh_access_token(refresh_token: str):
    payload = decode_token(refresh_token)

    if BlacklistedRefreshToken.objects.filter(
        refresh_token=refresh_token,
    ).exists():
        return None

    return {
        "access": create_access_token(payload["user_id"]),
    }


def login_with_google(id_token_string: str):
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
