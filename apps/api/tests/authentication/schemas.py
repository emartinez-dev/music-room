import pytest
from pydantic import ValidationError

from authentication.schemas import (
    ErrorSchema,
    GoogleLoginResponse,
    GoogleLoginSchema,
    GoogleUserResponse,
    LoginResponse,
    LoginSchema,
    LogoutSchema,
    PasswordResetResponse,
    PasswordResetSchema,
    RegisterResponse,
    RegisterSchema,
    RequestPasswordResetResponse,
    RequestPasswordResetSchema,
    ResendVerificationResponse,
    ResendVerificationSchema,
    VerifyEmailResponse,
    VerifyEmailSchema,
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


def test_google_login_schema():
    schema = GoogleLoginSchema(
        id_token="google-id-token",
    )

    assert schema.id_token == "google-id-token"


def test_google_login_schema_requires_id_token():
    with pytest.raises(ValidationError):
        GoogleLoginSchema()


def test_google_user_response():
    response = GoogleUserResponse(
        id="1",
        email="marc@test.com",
    )

    assert response.id == "1"
    assert response.email == "marc@test.com"


def test_google_login_response():
    response = GoogleLoginResponse(
        access="access-token",
        refresh="refresh-token",
        user={
            "id": "1",
            "email": "marc@test.com",
        },
    )

    assert response.access == "access-token"
    assert response.refresh == "refresh-token"
    assert response.user.id == "1"
    assert response.user.email == "marc@test.com"


def test_verify_email_schema():
    schema = VerifyEmailSchema(token="the-token")

    assert schema.token == "the-token"


def test_verify_email_response():
    response = VerifyEmailResponse(access="access-token", refresh="refresh-token")

    assert response.access == "access-token"
    assert response.refresh == "refresh-token"


def test_request_password_reset_schema():
    schema = RequestPasswordResetSchema(email="marc@test.com")

    assert schema.email == "marc@test.com"


def test_request_password_reset_response():
    response = RequestPasswordResetResponse(message="If an account exists...")

    assert response.message == "If an account exists..."


def test_password_reset_schema():
    schema = PasswordResetSchema(
        email="marc@test.com",
        token="the-token",
        new_password="new-password",
    )

    assert schema.email == "marc@test.com"
    assert schema.token == "the-token"
    assert schema.new_password == "new-password"


def test_password_reset_schema_requires_all_fields():
    with pytest.raises(ValidationError):
        PasswordResetSchema(email="marc@test.com", token="the-token")


def test_password_reset_response():
    response = PasswordResetResponse(id="1", email="marc@test.com")

    assert response.id == "1"
    assert response.email == "marc@test.com"


def test_resend_verification_schema():
    schema = ResendVerificationSchema(email="marc@test.com")

    assert schema.email == "marc@test.com"


def test_resend_verification_response():
    response = ResendVerificationResponse(message="If an account exists...")

    assert response.message == "If an account exists..."
