import * as AuthSession from "expo-auth-session";

import { SPOTIFY_CLIENT_ID } from "@/../config";

import { spotifyLinkApi } from "./auth";

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

const SPOTIFY_SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
];

export async function handleSpotifyLink() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "mobile", path: "spotify-callback" });

  const request = new AuthSession.AuthRequest({
    clientId: SPOTIFY_CLIENT_ID,
    scopes: SPOTIFY_SCOPES,
    redirectUri,
    usePKCE: false,
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== "success" || !result.params.code) {
    throw new Error("Spotify authorization was not completed");
  }

  return spotifyLinkApi(result.params.code, result.params.state ?? "");
}
