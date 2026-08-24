from ninja import Schema

# --- /tracks/search ---


class TrackSearchResult(Schema):
    spotify_uri: str
    name: str
    artist: str
    album: str
    duration_ms: int
    image_url: str
