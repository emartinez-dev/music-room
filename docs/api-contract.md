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
| `validation_error` | 422         | Invalid request body, `message` describes the field |

## Authentication

### Register

```
POST /auth/register
Body: { email, password }
Response 201: { id, email }
```

### Login

```
POST /auth/login
Body: { email, password }
Response 200: { access, refresh }
```

### Refresh token

```
POST /auth/refresh
Body: { refresh }
Response 200: { access }
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
Response 200: { access, refresh }
```

### Link Spotify account

[Docs](https://developer.spotify.com/documentation/web-api/concepts/authorization)

```
POST /auth/spotify
Body: { code, state }   ← OAuth code from Spotify
Response 204
```
