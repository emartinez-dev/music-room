import datetime

import jwt
from django.contrib.auth import get_user_model
from ninja.security import HttpBearer

from authentication.models import PasswordChangeLog
from authentication.utils import decode_token

User = get_user_model()


class JWTAuth(HttpBearer):
    def authenticate(self, request, token):
        try:
            payload = decode_token(token)
            user = User.objects.get(id=payload["user_id"])
        except jwt.InvalidTokenError:
            return None
        except User.DoesNotExist:
            return None

        if payload.get("type") != "access":
            return None

        try:
            changed_at = user.password_change_log.changed_at
        except PasswordChangeLog.DoesNotExist:
            return user

        issued_at = datetime.datetime.fromtimestamp(payload["iat"], tz=datetime.UTC)
        if issued_at < changed_at:
            return None

        return user
