from ninja import NinjaAPI

from authentication.exceptions import UserConflictError, WeakPasswordError

from .routers.auth import auth_router

api = NinjaAPI()


@api.exception_handler(UserConflictError)
def on_invalid_email(request, exc):
    return api.create_response(
        request,
        {
            "code": "conflict",
            "message": "A user with these credentials already exists",
        },
        status=409,
    )


@api.exception_handler(WeakPasswordError)
def on_weak_password(request, exc):
    return api.create_response(
        request,
        {
            "code": "validation_error",
            "message": exc.message,
        },
        status=400,
    )


# /routers/auth.py Endpoints
api.add_router("/auth/", auth_router)


@api.get("/health")
def health(request):
    return {"status": "ok"}
