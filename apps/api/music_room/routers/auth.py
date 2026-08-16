# Router, Schemas
from ninja import Router

from authentication.auth import JWTAuth
from authentication.schemas import (
    ErrorSchema,
    GoogleLoginResponse,
    GoogleLoginSchema,
    LoginResponse,
    LoginSchema,
    LogoutSchema,
    MeResponse,
    RefreshResponse,
    RefreshSchema,
    RegisterResponse,
    RegisterSchema,
    VerifyEmailResponse,
    VerifyEmailSchema,
)
from authentication.services import (
    blacklist_refresh_token,
    create_user,
    login_user,
    login_with_google,
    refresh_access_token,
    verify_email_user,
)

auth_router = Router()
jwt_auth = JWTAuth()


# /auth/register
@auth_router.post("/register", response={201: RegisterResponse, 409: ErrorSchema})
def register(request, data: RegisterSchema):

    user = create_user(
        username=data.username,
        email=data.email,
        password=data.password,
    )

    return 201, {"id": str(user.id), "email": user.email}


# /auth/verify-email/
@auth_router.post(
    "/verify-email/",
    response={
        200: VerifyEmailResponse,
        400: ErrorSchema,
    },
)
def verify_email(request, data: VerifyEmailSchema):
    success = verify_email_user(data.token)

    if not success:
        return 400, {
            "code": "invalid_token",
            "message": "Invalid or expired verification token",
        }

    return 200, {
        "code": "verified",
        "message": "Email verified successfully",
        "access": success["access"],
        "refresh": success["refresh"],
    }


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
        200: GoogleLoginResponse,
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


# /auth/me
@auth_router.get("/me", response=MeResponse, auth=jwt_auth)
def me(request):
    user = request.auth

    if user is None:
        return 404, {
            "code": "not found",
            "message": "Resource does not exist",
        }

    return {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
    }
