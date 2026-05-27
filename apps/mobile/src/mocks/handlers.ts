import { HttpResponse, http } from "msw";

const BASE_URL = "http://localhost:8000/api";

const db = {};

export const handlers = [
  //#region Authentication

  // Register endpoint
  http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body = (await request.clone().json()) as {
      email: string;
      password: string;
    };
    if (body.password === "invalid") {
      return HttpResponse.json(
        { code: "unauthorized", message: "cannot register" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ id: "abc-123", email: body.email }, { status: 200 });
  }),

  // Login endpoint
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = (await request.clone().json()) as {
      email: string;
      password: string;
    };
    if (body.password === "invalid") {
      return HttpResponse.json({ code: "unauthorized", message: "cannot login" }, { status: 401 });
    }
    return HttpResponse.json({ access: "access-token", refresh: "refresh-token" }, { status: 200 });
  }),

  // Refresh token endpoint
  http.post(`${BASE_URL}/auth/refresh`, async ({ request }) => {
    const body = (await request.clone().json()) as {
      refresh: string;
    };
    if (body.refresh === "invalid-token") {
      return HttpResponse.json(
        { code: "unauthorized", message: "cannot refresh token" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ access: "access-token" }, { status: 200 });
  }),

  // Logout endpoint
  http.post(`${BASE_URL}/auth/logout`, async () => {
    return HttpResponse.json({ access: "access-token" }, { status: 200 });
  }),

  // Google OAuth endpoint
  http.post(`${BASE_URL}/auth/google`, async ({ request }) => {
    const body = (await request.clone().json()) as {
      id_token: string;
    };
    if (body.id_token === "invalid-token") {
      return HttpResponse.json(
        { code: "unauthorized", message: "cannot login with Google" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ access: "access-token", refresh: "refresh-token" }, { status: 200 });
  }),

  // Spotify OAuth endpoint
  http.post(`${BASE_URL}/auth/spotify`, async ({ request }) => {
    const body = (await request.clone().json()) as {
      code: string;
      state: string;
    };
    if (body.code === "invalid-code") {
      return HttpResponse.json(
        { code: "unauthorized", message: "cannot link your Spotify account" },
        { status: 401 },
      );
    }
    return HttpResponse.json(null, { status: 204 });
  }),

  //#endregion
];
