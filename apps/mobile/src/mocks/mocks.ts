import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { Api } from "../services/api";

type MockResponse = { status: number; data: unknown };
type MockHandler = (body: Record<string, string>) => MockResponse;

const routes: Array<{ method: string; path: string; handler: MockHandler }> = [
  {
    method: "post",
    path: "/auth/register",
    handler: ({ password, email }) => {
      if (password === "invalid")
        return { status: 401, data: { code: "unauthorized", message: "cannot register" } };
      return { status: 200, data: { id: "abc-123", email } };
    },
  },
  {
    method: "post",
    path: "/auth/login",
    handler: ({ password }) => {
      if (password === "invalid")
        return { status: 401, data: { code: "unauthorized", message: "cannot login" } };
      return { status: 200, data: { access: "access-token", refresh: "refresh-token" } };
    },
  },
  {
    method: "post",
    path: "/auth/refresh",
    handler: ({ refresh }) => {
      if (refresh === "invalid-token")
        return { status: 401, data: { code: "unauthorized", message: "cannot refresh token" } };
      return { status: 200, data: { access: "access-token" } };
    },
  },
  {
    method: "post",
    path: "/auth/logout",
    handler: () => ({ status: 200, data: { access: "access-token" } }),
  },
  {
    method: "post",
    path: "/auth/google",
    handler: ({ id_token }) => {
      if (id_token === "invalid-token")
        return { status: 401, data: { code: "unauthorized", message: "cannot login with Google" } };
      return { status: 200, data: { access: "access-token", refresh: "refresh-token" } };
    },
  },
  {
    method: "post",
    path: "/auth/spotify",
    handler: ({ code }) => {
      if (code === "invalid-code")
        return {
          status: 401,
          data: { code: "unauthorized", message: "cannot link your Spotify account" },
        };
      return { status: 204, data: null };
    },
  },
];

function makeAxiosResponse(
  config: InternalAxiosRequestConfig,
  mock: MockResponse,
): AxiosResponse {
  return {
    data: mock.data,
    status: mock.status,
    statusText: String(mock.status),
    headers: { "content-type": "application/json" },
    config,
    request: {},
  };
}

export function setupMocks() {
  Api.interceptors.request.use(async (config) => {
    const method = (config.method ?? "get").toLowerCase();
    const url = config.url ?? "";

    const route = routes.find((r) => r.method === method && url.endsWith(r.path));
    if (!route) return config;

    const body: Record<string, string> =
      typeof config.data === "string" ? JSON.parse(config.data) : (config.data ?? {});

    const mock = route.handler(body);

    // Throw a "settled" response so axios response interceptors still run
    const response = makeAxiosResponse(config, mock);
    if (mock.status >= 400) {
      const error = Object.assign(new Error(`Mock error ${mock.status}`), { response, config });
      return Promise.reject(error);
    }

    // Swap the adapter so the request never hits the network
    config.adapter = () => Promise.resolve(response);
    return config;
  });
}
