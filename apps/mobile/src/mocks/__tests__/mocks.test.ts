jest.mock("../../services/sessionManager", () => ({
  sessionExpired: jest.fn(),
}));

import { Api } from "../../services/api";
import { setupMocks } from "../mocks";

// setupMocks installs an interceptor on the shared Api client that answers
// requests locally, so the app can run with `make mobile MOCKS=1` without a
// backend. It is registered once here, as it is in the app.
// Axios runs request interceptors in reverse registration order, so this guard
// is registered *before* setupMocks in order to run *after* it and observe
// whether the mock swapped in its own adapter. Unmatched requests would
// otherwise reach the real network, so they are stopped here instead.
const NOT_MOCKED = "request was not intercepted by the mock layer";

Api.interceptors.request.use((config) => {
  if (typeof config.adapter !== "function") throw new Error(NOT_MOCKED);
  return config;
});

setupMocks();

const mockedGetItemAsync = require("expo-secure-store").getItemAsync as jest.Mock;

describe("mock API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetItemAsync.mockResolvedValue(null);
  });

  it("should answer a valid login with a token pair", async () => {
    const { data, status } = await Api.post("/auth/login", {
      email: "user@example.com",
      password: "secret",
    });

    expect(status).toBe(200);
    expect(data).toEqual({ access: "access-token", refresh: "refresh-token" });
  });

  it("should reject the reserved invalid password with a 401", async () => {
    await expect(
      Api.post("/auth/login", { email: "user@example.com", password: "invalid" }),
    ).rejects.toMatchObject({
      response: { status: 401, data: { code: "unauthorized", message: "cannot login" } },
    });
  });

  it("should echo the registered email back", async () => {
    const { data } = await Api.post("/auth/register", {
      username: "username",
      email: "new@example.com",
      password: "secret",
    });

    expect(data).toEqual({ id: "abc-123", email: "new@example.com" });
  });

  it("should reject a registration using the reserved invalid password", async () => {
    await expect(
      Api.post("/auth/register", {
        username: "username",
        email: "new@example.com",
        password: "invalid",
      }),
    ).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("should refresh a valid token and reject the reserved invalid one", async () => {
    const { data } = await Api.post("/auth/refresh", { refresh: "refresh-token" });
    expect(data).toEqual({ access: "access-token" });

    await expect(Api.post("/auth/refresh", { refresh: "invalid-token" })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("should accept a Google login and reject the reserved invalid id_token", async () => {
    const { data } = await Api.post("/auth/google", { id_token: "google-id-token" });
    expect(data).toEqual({ access: "access-token", refresh: "refresh-token" });

    await expect(Api.post("/auth/google", { id_token: "invalid-token" })).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("should answer a Spotify link with 204 and no body", async () => {
    const { status, data } = await Api.post("/auth/spotify", { code: "the-code" });

    expect(status).toBe(204);
    expect(data).toBeNull();
  });

  it("should accept a logout", async () => {
    const { status } = await Api.post("/auth/logout", { refresh: "refresh-token" });

    expect(status).toBe(200);
  });

  // Only the declared routes are intercepted; anything else has to fall
  // through so an unmocked endpoint fails loudly instead of silently passing.
  it("should let an unknown route through to the network", async () => {
    await expect(Api.get("/auth/me")).rejects.toThrow(NOT_MOCKED);
  });

  it("should match on method as well as path", async () => {
    await expect(Api.get("/auth/login")).rejects.toThrow(NOT_MOCKED);
  });
});
