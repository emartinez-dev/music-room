from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from ..utils.jwt import create_access_token, create_refresh_token


def create_user(username: str, email: str, password: str):
    return User.objects.create_user(
        username=username,
        email=email,
        password=password,
    )


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

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return {
        "access": access_token,
        "refresh": refresh_token,
    }
