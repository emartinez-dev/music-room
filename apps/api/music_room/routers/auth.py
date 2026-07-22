# Django database models
from django.contrib.auth.models import User
from django.db import IntegrityError

# Router, Schemas
from ninja import Router

from ..schemas.auth import (
    ErrorSchema,
    LoginResponse,
    LoginSchema,
    LogoutSchema,
    RegisterResponse,
    RegisterSchema,
)
from ..services.auth import create_user, login_user

auth_router = Router()


# /auth/register
@auth_router.post("/register", response={201: RegisterResponse, 409: ErrorSchema})
def register(request, data: RegisterSchema):

    if User.objects.filter(email=data.email).exists():
        return 409, {"code": "conflict", "message": "Email already exists"}

    # create user
    try:
        user = create_user(
            username=data.username,
            email=data.email,
            password=data.password,
        )
    except IntegrityError:
        return 409, {"code": "conflict", "message": "Email already exists"}

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


# /auth/logout
@auth_router.post("/logout", response={204: None})
def logout(request, data: LogoutSchema):

    # TODO: Invalidate refresh tokens on logout before production deployment.
    return 204, None
