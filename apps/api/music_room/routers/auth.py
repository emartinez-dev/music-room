# Django database models
from django.contrib.auth.models import User
from django.db import IntegrityError

# JWT token utilities
from django.contrib.auth import authenticate
from ..utils.jwt import create_access_token, create_refresh_token

# Router, Schemas
from ninja import Router
from ..schemas.auth import (
    RegisterSchema,
    RegisterResponse,
    LoginSchema,
    LoginResponse,
    LogoutSchema,
    ErrorSchema
)

auth_router = Router()

# /auth/register
@auth_router.post("/register", 
response={
    201: RegisterResponse,
    409: ErrorSchema
    }
)
def register(request, data: RegisterSchema):

    if User.objects.filter(email=data.email).exists():
        return 409, {"code": "conflict", "message": "Email already exists"}

    # 🔥 LOG para ver qué llega
    print(f"📝 Email: {data.email}")
    print(f"🔑 Password length: {len(data.password)}")
    print(f"🔑 Password chars: {[ord(c) for c in data.password]}")

    
    # create user
    try:
        user = User.objects.create_user(
            username=data.email,  # django requires username
            email=data.email,
            password=data.password
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
    }
)
def login(request, data: LoginSchema):
    user = authenticate(username=data.email, password=data.password)
    
    if not user:
        return 401, {"code": "unauthorized", "message": "Invalid credentials"}
    
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    return {"access": access_token, "refresh": refresh_token}


# /auth/logout
@auth_router.post("/logout", response={204: None})
def logout(request, data: LogoutSchema):
    
    return 204, None