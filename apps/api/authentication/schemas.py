from ninja import Schema


class ErrorSchema(Schema):
    code: str
    message: str


# --- /auth/register/ ---


class RegisterSchema(Schema):
    username: str
    email: str
    password: str


class RegisterResponse(Schema):
    id: str
    email: str


# --- /auth/login/ ---


class LoginSchema(Schema):
    email: str
    password: str


class LoginResponse(Schema):
    access: str
    refresh: str


# --- /auth/logout/ ---


class LogoutSchema(Schema):
    refresh: str


# --- /auth/refresh/ ---


class RefreshSchema(Schema):
    refresh: str


class RefreshResponse(Schema):
    access: str


# --- /auth/google/ ---


class GoogleLoginSchema(Schema):
    id_token: str


class GoogleLoginResponse(Schema):
    access: str
    refresh: str
    user: GoogleUserResponse


class GoogleUserResponse(Schema):
    id: str
    email: str


# --- /auth/me/ ---


class MeResponse(Schema):
    id: str
    email: str
    username: str


# --- /auth/verify-email/ ---


class VerifyEmailSchema(Schema):
    token: str


class VerifyEmailResponse(Schema):
    access: str
    refresh: str


# --- /auth/request-password-reset/ ---


class RequestPasswordResetSchema(Schema):
    email: str


class RequestPasswordResetResponse(Schema):
    id: str
    email: str


# --- /auth/reset-password/ ---


class PasswordResetSchema(Schema):
    email: str
    token: str
    new_password: str


class PasswordResetResponse(Schema):
    id: str
    email: str


# --- /auth/resend-verification/ ---


class ResendVerificationSchema(Schema):
    email: str


class ResendVerificationResponse(Schema):
    id: str
    email: str
