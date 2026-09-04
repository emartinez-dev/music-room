jest.mock("../sessionManager", () => ({
  sessionExpired: jest.fn(),
}));

import { Platform } from "react-native";
import { API_URL } from "../../../config";
import { Api } from "../api";

// The Authorization header and the refresh-and-retry flow are covered in
// api.interceptors.test.ts. This file pins down the client's static
// configuration, which the backend relies on to identify the caller.
describe("Api client configuration", () => {
  it("should point at the configured API base URL", () => {
    expect(Api.defaults.baseURL).toBe(API_URL);
  });

  it("should time out slow requests instead of hanging the screen", () => {
    expect(Api.defaults.timeout).toBe(5_000);
  });

  it("should send JSON headers", () => {
    expect(Api.defaults.headers.Accept).toBe("application/json");
    expect(Api.defaults.headers["Content-Type"]).toBe("application/json");
  });

  it("should identify the device on every request", () => {
    expect(Api.defaults.headers["X-Platform"]).toBe(Platform.OS);
    expect(Api.defaults.headers["X-App-Version"]).toBe(Platform.Version);
    // Comes from the expo-device mock in jest.setup.js
    expect(Api.defaults.headers["X-Device-Model"]).toBe("Test Device");
  });
});
