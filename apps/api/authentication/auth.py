import jwt
from django.contrib.auth import get_user_model
from ninja.security import HttpBearer

from authentication.utils import decode_token

User = get_user_model()


class JWTAuth(HttpBearer):
    def authenticate(self, request, token):
        try:
            payload = decode_token(token)
            return User.objects.get(id=payload["user_id"])
        except jwt.InvalidTokenError:
            return None
        except User.DoesNotExist:
            return None
