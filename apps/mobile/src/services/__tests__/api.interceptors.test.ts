const postSpies: jest.Mock[] = [];
let refreshRequestBody: Record<string, any> | null = null;

jest.mock("axios", () => {
  const actualAxios = jest.requireActual("axios");

  const createInstance = (originalCreate: any) => (config: any) => {
    const instance = originalCreate(config);

    const originalPost = instance.post.bind(instance);
    const mockPost = jest.fn((...args: any[]) => originalPost(...args));
    instance.post = mockPost;
    postSpies.push(mockPost);

    instance.defaults.adapter = async (config: any) => {
      const url = config.url;
      const method = (config.method ?? "get").toLowerCase();

      if (url === "/auth/refresh") {
        refreshRequestBody = { ...(config.data as Record<string, any>) };
        const err = new Error("Mock 401") as any;
        err.response = { status: 401, data: { code: "unauthorized", message: "invalid token" } };
        err.config = config;
        throw err;
      }

      const err = new Error("Mock 401") as any;
      err.response = { status: 401, data: { code: "unauthorized", message: "invalid token" } };
      err.config = config;
      throw err;
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

describe("Api refresh token interceptor", () => {
  beforeEach(() => {
    refreshRequestBody = null;
    jest.clearAllMocks();
  });

  it("should send a valid refresh token string when retrying after 401", async () => {
    mockedGetItemAsync.mockImplementation((key: string) => {
      if (key === "access-token") return Promise.resolve(null);
      if (key === "refresh-token") return Promise.resolve("valid-refresh-token");
      return Promise.resolve(null);
    });

    try {
      await Api.get("/protected");
    } catch (error) {
      // expected
    }

    const refreshApiPost = postSpies[1];
    expect(refreshApiPost).toHaveBeenCalledWith("/auth/refresh", {
      refresh: "valid-refresh-token",
    });

    expect(mockedSessionExpired).toHaveBeenCalled();
  });

  describe.each([
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/verify-email",
    "/auth/resend-verification",
  ])("excluded from the refresh-retry flow: %s", (url) => {
    it("should not attempt a token refresh on 401", async () => {
      mockedGetItemAsync.mockResolvedValue(null);

      await expect(Api.post(url, {})).rejects.toThrow();

      const refreshApiPost = postSpies[1];
      expect(refreshApiPost).not.toHaveBeenCalled();
      expect(mockedSessionExpired).not.toHaveBeenCalled();
    });
  });
});
