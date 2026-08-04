import jwt
from ninja.security import HttpBearer

from authentication.utils import decode_token


class JWTAuth(HttpBearer):
    def authenticate(self, request, token):
        try:
            return decode_token(token)
        except jwt.InvalidTokenError:
            return None
