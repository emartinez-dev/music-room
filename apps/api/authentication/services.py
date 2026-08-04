import datetime

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import IntegrityError

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
