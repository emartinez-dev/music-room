import datetime

import jwt
from django.conf import settings

from music_room.utils.jwt import (
    create_access_token,
    create_refresh_token,
)


def test_create_access_token():
    token = create_access_token(1)

    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=["HS256"],
    )

    assert isinstance(token, str)
    assert payload["user_id"] == 1
    assert "iat" in payload
    assert "exp" in payload


def test_create_refresh_token():
    token = create_refresh_token(1)

    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=["HS256"],
    )

    assert isinstance(token, str)
    assert payload["user_id"] == 1
    assert "iat" in payload
    assert "exp" in payload


def test_access_token_expires_in_about_30_minutes():
    token = create_access_token(1)

    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=["HS256"],
    )

    issued = datetime.datetime.fromtimestamp(
        payload["iat"],
        tz=datetime.UTC,
    )
    expires = datetime.datetime.fromtimestamp(
        payload["exp"],
        tz=datetime.UTC,
    )

    assert expires - issued == datetime.timedelta(minutes=30)


def test_refresh_token_expires_in_about_7_days():
    token = create_refresh_token(1)

    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=["HS256"],
    )

    issued = datetime.datetime.fromtimestamp(
        payload["iat"],
        tz=datetime.UTC,
    )
    expires = datetime.datetime.fromtimestamp(
        payload["exp"],
        tz=datetime.UTC,
    )

    assert expires - issued == datetime.timedelta(days=7)
