# Router, Schemas
from ninja import Router

from authentication.auth import JWTAuth
from tracks.schemas import TrackSearchResult
from tracks.services import search_tracks

tracks_router = Router()
jwt_auth = JWTAuth()


# /tracks/search
@tracks_router.get("/search", response=list[TrackSearchResult], auth=jwt_auth)
def search(request, q: str):
    return search_tracks(request.auth, q)
