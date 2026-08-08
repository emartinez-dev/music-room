# Router, Schemas
from ninja import Router

from authentication.auth import JWTAuth
from authentication.schemas import (
    ErrorSchema,
    GoogleLoginSchema,
    LoginResponse,
    LoginSchema,
    LogoutSchema,
    RefreshResponse,
    RefreshSchema,
    RegisterResponse,
    RegisterSchema,
)
from authentication.services import (
    blacklist_refresh_token,
    create_user,
    login_user,
    login_with_google,
    refresh_access_token,
)

auth_router = Router()


# /auth/register
@auth_router.post("/register", response={201: RegisterResponse, 409: ErrorSchema})
def register(request, data: RegisterSchema):

    user = create_user(
        username=data.username,
        email=data.email,
        password=data.password,
    )

    return 201, {"id": str(user.id), "email": user.email}


# /auth/login
@auth_router.post(
    "/login",
    response={
        200: LoginResponse,
        401: ErrorSchema,
    },
)
def login(request, data: LoginSchema):
    tokens = login_user(
        email=data.email,
        password=data.password,
    )

    if not tokens:
        return 401, {"code": "unauthorized", "message": "Invalid credentials"}

    return tokens

# /auth/google
@auth_router.post(
    "/google",
    response={
        200: LoginResponse,
        401: ErrorSchema,
    },
)
def google_login(request, data: GoogleLoginSchema):
    tokens = login_with_google(data.id_token)

    if not tokens:
        return 401, {
            "code": "unauthorized",
            "message": "Invalid Google credentials",
        }

    return tokens


# /auth/logout
@auth_router.post("/logout", response={204: None})
def logout(request, data: LogoutSchema):

    blacklist_refresh_token(data.refresh)
    return 204, None


# /auth/refresh
@auth_router.post(
    "/refresh",
    response={
        200: RefreshResponse,
        401: ErrorSchema,
    },
)
def refresh(request, data: RefreshSchema):
    access = refresh_access_token(data.refresh)

    if not access:
        return 401, {
            "code": "unauthorized",
            "message": "Invalid refresh token",
        }

    return access


# /auth/me (temporary endpoint for authentication testing)
@auth_router.get("/me", auth=JWTAuth())
def me(request):
    return {
        "message": "Authenticated",
    }
