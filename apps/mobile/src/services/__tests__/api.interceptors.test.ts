import type { InternalAxiosRequestConfig } from "axios";

type CapturedRequest = {
  url?: string;
  method?: string;
  body: Record<string, unknown>;
  authorization?: string;
};

// Every request that reaches the (mocked) network layer, in order.
const mockRequests: CapturedRequest[] = [];
// Swapped per test to decide how the fake network answers.
let mockAdapter: (config: InternalAxiosRequestConfig) => Promise<unknown> = async () => {
  throw new Error("no adapter installed for this test");
};

jest.mock("axios", () => {
  const actualAxios = jest.requireActual("axios");

  return {
    ...actualAxios,
    create: (config: unknown) => {
      const instance = actualAxios.create(config);
      // Both Api and RefreshApi go through the same fake network, which lets a
      // single adapter describe the whole refresh-and-retry round trip.
      instance.defaults.adapter = (requestConfig: InternalAxiosRequestConfig) => {
        const body =
          typeof requestConfig.data === "string"
            ? JSON.parse(requestConfig.data)
            : ((requestConfig.data as Record<string, unknown>) ?? {});

        mockRequests.push({
          url: requestConfig.url,
          method: requestConfig.method,
          body,
          authorization: requestConfig.headers?.Authorization as string | undefined,
        });

        return mockAdapter(requestConfig);
      };
      return instance;
    },
  };
});

jest.mock("../sessionManager", () => ({
  sessionExpired: jest.fn(),
}));

import * as SecureStore from "expo-secure-store";
import { Api } from "../api";
import { sessionExpired } from "../sessionManager";

const mockedSessionExpired = sessionExpired as jest.MockedFunction<typeof sessionExpired>;
const mockedGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockedSetItemAsync = SecureStore.setItemAsync as jest.Mock;

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  return {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
    request: {},
  };
}

function httpError(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  return Object.assign(new Error(`Mock ${status}`), {
    isAxiosError: true,
    config,
    response: respond(config, status, data),
  });
}

const UNAUTHORIZED = { code: "unauthorized", message: "invalid token" };

describe("Api interceptors", () => {
  // A tiny in-memory stand-in for the device keychain. Using a real store
  // instead of fixed return values is what makes the retry assertions
  // meaningful: the retried request can only carry the refreshed access token
  // if the interceptor actually persisted it first.
  let store: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequests.length = 0;
    store = {};

    mockedGetItemAsync.mockImplementation((key: string) => Promise.resolve(store[key] ?? null));
    mockedSetItemAsync.mockImplementation((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    });
  });

  describe("request interceptor", () => {
    it("should attach the stored access token as a Bearer header", async () => {
      store["access-token"] = "stored-access";
      mockAdapter = async (config) => respond(config, 200, { ok: true });

      await Api.get("/protected");

      expect(mockedGetItemAsync).toHaveBeenCalledWith("access-token");
      expect(mockRequests[0].authorization).toBe("Bearer stored-access");
    });

    it("should send no Authorization header when there is no stored token", async () => {
      mockAdapter = async (config) => respond(config, 200, { ok: true });

      await Api.get("/public");

      expect(mockRequests[0].authorization).toBeUndefined();
    });
  });

  describe("refresh-and-retry on 401", () => {
    it("should refresh the access token and replay the original request", async () => {
      store["access-token"] = "expired-access";
      store["refresh-token"] = "valid-refresh";

      let protectedCalls = 0;
      mockAdapter = async (config) => {
        if (config.url === "/auth/refresh") {
          return respond(config, 200, { access: "fresh-access" });
        }
        protectedCalls += 1;
        if (protectedCalls === 1) throw httpError(config, 401, UNAUTHORIZED);
        return respond(config, 200, { secret: "payload" });
      };

      const response = await Api.get("/protected");

      expect(response.data).toEqual({ secret: "payload" });

      const [firstAttempt, refresh, retry] = mockRequests;
      expect(firstAttempt.authorization).toBe("Bearer expired-access");
      expect(refresh.url).toBe("/auth/refresh");
      expect(refresh.body).toEqual({ refresh: "valid-refresh" });
      // The replay must use the new token, not the expired one.
      expect(retry.url).toBe("/protected");
      expect(retry.authorization).toBe("Bearer fresh-access");

      expect(mockedSessionExpired).not.toHaveBeenCalled();
    });

    it("should persist the new access token and keep the existing refresh token", async () => {
      store["access-token"] = "expired-access";
      store["refresh-token"] = "valid-refresh";

      let protectedCalls = 0;
      mockAdapter = async (config) => {
        if (config.url === "/auth/refresh") {
          return respond(config, 200, { access: "fresh-access" });
        }
        protectedCalls += 1;
        if (protectedCalls === 1) throw httpError(config, 401, UNAUTHORIZED);
        return respond(config, 200, {});
      };

      await Api.get("/protected");

      expect(store["access-token"]).toBe("fresh-access");
      expect(store["refresh-token"]).toBe("valid-refresh");
    });

    it("should retry only once when the refreshed token is also rejected", async () => {
      store["refresh-token"] = "valid-refresh";

      mockAdapter = async (config) => {
        if (config.url === "/auth/refresh") {
          return respond(config, 200, { access: "fresh-access" });
        }
        throw httpError(config, 401, UNAUTHORIZED);
      };

      await expect(Api.get("/protected")).rejects.toThrow();

      // First attempt, one refresh, one replay: the _retry flag stops the loop.
      expect(mockRequests.map((request) => request.url)).toEqual([
        "/protected",
        "/auth/refresh",
        "/protected",
      ]);
    });

    it("should expire the session and reject when the refresh call fails", async () => {
      store["refresh-token"] = "expired-refresh";

      mockAdapter = async (config) => {
        if (config.url === "/auth/refresh") {
          throw httpError(config, 401, { code: "unauthorized", message: "cannot refresh token" });
        }
        throw httpError(config, 401, UNAUTHORIZED);
      };

      await expect(Api.get("/protected")).rejects.toThrow();

      expect(mockRequests[1].body).toEqual({ refresh: "expired-refresh" });
      expect(mockedSessionExpired).toHaveBeenCalledTimes(1);
    });

    // A user who was never logged in has no refresh token. Logging them out
    // again would be noise, so the original 401 is surfaced untouched.
    it("should reject with the original error and not expire the session when there is no refresh token", async () => {
      mockAdapter = async (config) => {
        throw httpError(config, 401, UNAUTHORIZED);
      };

      await expect(Api.get("/protected")).rejects.toMatchObject({
        response: { status: 401 },
      });

      expect(mockRequests).toHaveLength(1);
      expect(mockedSessionExpired).not.toHaveBeenCalled();
    });

    it("should not attempt a refresh on non-401 errors", async () => {
      store["refresh-token"] = "valid-refresh";

      mockAdapter = async (config) => {
        throw httpError(config, 500, { message: "server error" });
      };

      await expect(Api.get("/protected")).rejects.toThrow();

      expect(mockRequests).toHaveLength(1);
      expect(mockedSessionExpired).not.toHaveBeenCalled();
    });
  });

  // These endpoints answer 401 as a normal outcome (bad credentials, expired
  // link, already-invalidated refresh token). Refreshing there would either
  // loop or hide the real error from the screen showing it.
  describe.each([
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/verify-email",
    "/auth/resend-verification",
    "/auth/google",
    "/auth/logout",
  ])("excluded from the refresh-retry flow: %s", (url) => {
    it("should surface the 401 without refreshing or expiring the session", async () => {
      store["refresh-token"] = "valid-refresh";

      mockAdapter = async (config) => {
        throw httpError(config, 401, UNAUTHORIZED);
      };

      await expect(Api.post(url, {})).rejects.toThrow();

      expect(mockRequests.map((request) => request.url)).toEqual([url]);
      expect(mockedSessionExpired).not.toHaveBeenCalled();
    });
  });
});
