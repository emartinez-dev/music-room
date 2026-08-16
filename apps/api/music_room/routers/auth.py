# Router, Schemas
from django.contrib.auth.models import User
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
    PasswordResetResponse,
    PasswordResetSchema,
    RefreshResponse,
    RefreshSchema,
    RegisterResponse,
    RegisterSchema,
    RequestPasswordResetResponse,
    RequestPasswordResetSchema,
    VerifyEmailResponse,
    VerifyEmailSchema,
)
from authentication.services import (
    blacklist_refresh_token,
    create_user,
    login_user,
    login_with_google,
    refresh_access_token,
    reset_password,
    send_password_reset_email,
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
def verify_email_with_body(request, data: VerifyEmailSchema):
    success = verify_email_user(data.token)

    if not success:
        return 400, {
            "code": "invalid_token",
            "message": "Invalid or expired verification token",
        }

    return 200, {
        "access": success["access"],
        "refresh": success["refresh"],
    }


# /auth/request-password-reset/
@auth_router.post(
    "/request-password-reset/",
    response={
        200: RequestPasswordResetResponse,
        404: ErrorSchema,
    },
)
def request_password_reset(request, data: RequestPasswordResetSchema):
    user = User.objects.filter(email=data.email).first()

    if not user:
        return 404, {
            "code": "not_found",
            "message": "User with this email does not exist",
        }

    send_password_reset_email(user)

    return 200, {"id": str(user.id), "email": user.email}


# /auth/reset-password/
@auth_router.post(
    "/reset-password/",
    response={
        200: PasswordResetResponse,
        400: ErrorSchema,
    },
)
def reset_password_endpoint(request, data: PasswordResetSchema):
    success = reset_password(data.token, data.new_password)

    if not success:
        return 400, {
            "code": "invalid_token",
            "message": "Invalid or expired verification token",
        }

    user = User.objects.get(email=data.email)

    return 200, {"id": str(user.id), "email": user.email}


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
