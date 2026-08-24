type QueueEntry = { status: number; data?: unknown };

let mockResponses: Record<string, QueueEntry[]>;

jest.mock("axios", () => {
  const actualAxios = jest.requireActual("axios");

  const createInstance = (originalCreate: any) => (config: any) => {
    const instance = originalCreate(config);

    instance.defaults.adapter = async (config: any) => {
      const url = config.url as string;
      const queue = mockResponses[url];
      const entry = queue && queue.length > 0 ? queue.shift()! : { status: 401 };

      if (entry.status >= 400) {
        const err = new Error(`Mock ${entry.status}`) as any;
        err.response = {
          status: entry.status,
          data: entry.data ?? { code: "unauthorized", message: "invalid token" },
        };
        err.config = config;
        throw err;
      }

      return {
        data: entry.data ?? {},
        status: entry.status,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    return instance;
  };

  return {
    ...actualAxios,
    create: createInstance(actualAxios.create),
  };
});

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("../sessionManager", () => ({
  sessionExpired: jest.fn(),
}));

import * as SecureStore from "expo-secure-store";
import { Api } from "../api";
import { sessionExpired } from "../sessionManager";

const mockedSessionExpired = sessionExpired as jest.MockedFunction<typeof sessionExpired>;
const mockedGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockedSetItemAsync = SecureStore.setItemAsync as jest.Mock;

describe("Api refresh-retry interceptor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResponses = {};
    mockedGetItemAsync.mockImplementation((key: string) => {
      if (key === "access-token") return Promise.resolve("expired-access-token");
      if (key === "refresh-token") return Promise.resolve("valid-refresh-token");
      return Promise.resolve(null);
    });
  });

  it("retries the original request with the refreshed token and succeeds", async () => {
    mockResponses["/protected"] = [{ status: 401 }, { status: 200, data: { ok: true } }];
    mockResponses["/auth/refresh"] = [{ status: 200, data: { access: "fresh-access-token" } }];

    const response = await Api.get("/protected");

    expect(response.data).toEqual({ ok: true });
    expect(mockedSetItemAsync).toHaveBeenCalledWith("access-token", "fresh-access-token");
    expect(mockedSessionExpired).not.toHaveBeenCalled();
  });

  it("logs the user out if the retried request still fails after a successful refresh", async () => {
    mockResponses["/protected"] = [{ status: 401 }, { status: 401 }];
    mockResponses["/auth/refresh"] = [{ status: 200, data: { access: "fresh-access-token" } }];

    await expect(Api.get("/protected")).rejects.toThrow();

    expect(mockedSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("logs the user out immediately if there is no refresh token", async () => {
    mockedGetItemAsync.mockImplementation((key: string) => {
      if (key === "access-token") return Promise.resolve("expired-access-token");
      if (key === "refresh-token") return Promise.resolve(null);
      return Promise.resolve(null);
    });
    mockResponses["/protected"] = [{ status: 401 }];

    await expect(Api.get("/protected")).rejects.toThrow();

    expect(mockedSessionExpired).toHaveBeenCalledTimes(1);
  });
});
