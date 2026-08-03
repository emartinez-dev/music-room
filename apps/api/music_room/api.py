from ninja import NinjaAPI

from authentication.exceptions import InvalidEmailError

from .routers.auth import auth_router

api = NinjaAPI()


@api.exception_handler(InvalidEmailError)
def on_invalid_email(request, exc):
    return api.create_response(
        request,
        {
            "code": "conflict",
            "message": "Email already exists",
        },
        status=409,
    )


# /routers/auth.py Endpoints
api.add_router("/auth/", auth_router)


@api.get("/health")
def health(request):
    return {"status": "ok"}
