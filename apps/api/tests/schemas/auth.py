import pytest
from pydantic import ValidationError

from music_room.schemas.auth import (
    ErrorSchema,
    LoginResponse,
    LoginSchema,
    LogoutSchema,
    RegisterResponse,
    RegisterSchema,
)


def test_register_schema():
    schema = RegisterSchema(
        username="marc",
        email="marc@test.com",
        password="1234",
    )

    assert schema.username == "marc"
    assert schema.email == "marc@test.com"
    assert schema.password == "1234"


def test_register_schema_requires_username():
    with pytest.raises(ValidationError):
        RegisterSchema(
            email="marc@test.com",
            password="1234",
        )


def test_login_schema():
    schema = LoginSchema(
        email="marc@test.com",
        password="1234",
    )

    assert schema.email == "marc@test.com"
    assert schema.password == "1234"


def test_register_response():
    response = RegisterResponse(
        id="1",
        email="marc@test.com",
    )

    assert response.id == "1"
    assert response.email == "marc@test.com"


def test_login_response():
    response = LoginResponse(
        access="access-token",
        refresh="refresh-token",
    )

    assert response.access == "access-token"
    assert response.refresh == "refresh-token"


def test_logout_schema():
    schema = LogoutSchema(
        refresh="refresh-token",
    )

    assert schema.refresh == "refresh-token"


def test_error_schema():
    error = ErrorSchema(
        code="conflict",
        message="Email already exists",
    )

    assert error.code == "conflict"
    assert error.message == "Email already exists"
