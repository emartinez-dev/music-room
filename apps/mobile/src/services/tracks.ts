import { Api } from "./api";

type TrackSearchResult = {
  spotify_uri: string;
  name: string;
  artist: string;
  album: string;
  duration_ms: number;
  image_url: string;
};

export async function searchTracksApi(query: string): Promise<TrackSearchResult[]> {
  const { data } = await Api.get("/tracks/search", { params: { q: query } });
  return data;
}
