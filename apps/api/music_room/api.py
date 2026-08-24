from ninja import NinjaAPI

from authentication.exceptions import SpotifyAuthError, UserConflictError, WeakPasswordError

from .routers.auth import auth_router
from .routers.rooms import rooms_router
from .routers.tracks import tracks_router

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


@api.exception_handler(SpotifyAuthError)
def on_spotify_auth_error(request, exc):
    return api.create_response(
        request,
        {
            "code": "forbidden",
            "message": "Link your Spotify account to use this feature",
        },
        status=403,
    )


# /routers/auth.py Endpoints
api.add_router("/auth/", auth_router)

# /routers/tracks.py Endpoints
api.add_router("/tracks/", tracks_router)

# /routers/rooms.py Endpoints
api.add_router("/rooms", rooms_router)


@api.get("/health")
def health(request):
    return {"status": "ok"}
