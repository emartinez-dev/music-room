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
