# API Contract

This document defines the conventions the backend must follow so the mobile app
can be built in parallel. Any change to these contracts must be discussed with
the team first.

## Base URL

The backend base URL is configurable in the mobile app (required for peer
evaluation). Default for local development: `http://localhost:8000/api`.

## Request headers

Every request from the mobile app sends these headers:

| Header           | Example value           | Purpose                        |
| ---------------- | ----------------------- | ------------------------------ |
| `Authorization`  | `Bearer <access_token>` | Auth (all protected endpoints) |
| `X-Platform`     | `ios` / `android`       | Logging                        |
| `X-Device-Model` | `iPhone 15`             | Logging                        |
| `X-App-Version`  | `1.0.0`                 | Logging                        |

## Response format

All endpoints return plain JSON objects (no envelope wrapper).

**Success:** HTTP 2xx, body is the resource or a list.

**Error:** HTTP 4xx/5xx, body is always:

```json
{
  "code": "string",
  "message": "string"
}
```

Common error codes:

| Code               | HTTP status | Meaning                                             |
| ------------------ | ----------- | --------------------------------------------------- |
| `unauthorized`     | 401         | Missing or expired token                            |
| `forbidden`        | 403         | Authenticated but not allowed                       |
| `not_found`        | 404         | Resource does not exist                             |
| `conflict`         | 409         | Concurrency conflict (playlist reorder)             |
| `rate_limited`     | 429         | Too many requests, includes `Retry-After` header    |
| `validation_error` | 400         | Invalid request body, `message` describes the field |

## Authentication

### Register

```
POST /auth/register
Body: { username, email, password }
Response 201: { id, email }
Response 409: email already registered
Response 400: password fails validation
```

### Login

```
POST /auth/login
Body: { email, password }
Response 200: { access, refresh }
Response 401: invalid credentials
```

### Refresh token

```
POST /auth/refresh
Body: { refresh }
Response 200: { access }
Response 401: invalid, blacklisted, or stale refresh token
```

### Logout

```
POST /auth/logout
Body: { refresh }
Response 204
```

### Google OAuth

[Docs](https://developers.google.com/identity/protocols/oauth2?hl=es-419)

```
POST /auth/google
Body: { id_token }   ← token from Google Sign-In on the mobile app
Response 200: { access, refresh, user: { id, email } }
Response 401: invalid Google token
```

### Get current user

```
GET /auth/me
Headers: Authorization: Bearer <access_token>
Response 200: { id, email, username, spotify_linked }
```

### Verify email

```
POST /auth/verify-email/
Body: { token }
Response 200: { access, refresh }
```

### Resend verification email

```
POST /auth/resend-verification/
Body: { email }
Response 200: { message }
```

### Request password reset

```
POST /auth/request-password-reset/
Body: { email }
Response 200: { message }
```

### Reset password

```
POST /auth/reset-password/
Body: { email, token, new_password }
Response 200: { id, email }
```

### Link Spotify account

[Docs](https://developer.spotify.com/documentation/web-api/concepts/authorization)

```
POST /auth/spotify
Headers: Authorization: Bearer <access_token>
Body: { code }   ← OAuth code from Spotify (the state round-trip is
                    already verified client-side by expo-auth-session
                    before this call is made, so the backend doesn't
                    need its own copy)
Response 204
Response 400: invalid or expired Spotify authorization code
```

## Tracks

Any endpoint that calls the Spotify Web API on the user's behalf requires
their account to be linked (`POST /auth/spotify`) and returns
`403 { code: "forbidden", message: "Link your Spotify account to use this feature" }`
otherwise. This is a permission issue, not a session issue — the mobile app's
token-refresh interceptor only reacts to 401, so it will not retry or log the
user out on this response.

### Search tracks

Searches Spotify's catalog and caches matches in the `Track` table.

```
GET /tracks/search?q=<query>
Response 200: [ { spotify_uri, name, artist, album, duration_ms, image_url }, ... ]
Response 403: Spotify account not linked
```

## Rooms

### Create room

```
POST /rooms
Body: { name }
Response 200: { id, name, host_username }
```

### List rooms

```
GET /rooms
Response 200: [ { id, name, host_username }, ... ]
```

### Get room detail

Also registers the requesting user as a room member.

```
GET /rooms/{room_id}
Response 200: { id, name, host_username, tracks: [ { spotify_uri, name, artist, image_url }, ... ] }
Response 404: room does not exist
```

### Delete room

Only the host can delete a room.

```
DELETE /rooms/{room_id}
Response 204
Response 403: not the host
Response 404: room does not exist
```

### Add track to room

```
POST /rooms/{room_id}/tracks
Body: { spotify_uri }
Response 200: same shape as "Get room detail"
Response 404: room or track does not exist
```
