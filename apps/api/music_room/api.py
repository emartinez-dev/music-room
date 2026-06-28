from ninja import NinjaAPI
from .routers.auth import auth_router

api = NinjaAPI()

# /routers/auth.py Endpoints
api.add_router("/auth/", auth_router)


@api.get("/health")
def health(request):
    return {"status": "ok"}
