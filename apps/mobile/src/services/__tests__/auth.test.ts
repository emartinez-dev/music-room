import { Api } from "../api";
import {
  googleLoginApi,
  loginApi,
  logoutApi,
  refreshApi,
  registerApi,
} from "../auth";

jest.mock("../api", () => ({
  Api: {
    post: jest.fn(),
  },
}));

const mockedPost = Api.post as jest.Mock;

describe("auth service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loginApi", () => {
    it("should POST to /auth/login with email and password", async () => {
      const response = { data: { access: "access", refresh: "refresh" } };
      mockedPost.mockResolvedValue(response);

      const result = await loginApi("user@example.com", "secret");

      expect(mockedPost).toHaveBeenCalledWith("/auth/login", {
        email: "user@example.com",
        password: "secret",
      });
      expect(result).toEqual({ access: "access", refresh: "refresh" });
    });

    it("should propagate API errors", async () => {
      mockedPost.mockRejectedValue(new Error("network error"));

      await expect(loginApi("user@example.com", "secret")).rejects.toThrow(
        "network error",
      );
    });
  });

  describe("googleLoginApi", () => {
    it("should POST to /auth/google with id_token", async () => {
      const response = { data: { access: "access", refresh: "refresh" } };
      mockedPost.mockResolvedValue(response);

      const result = await googleLoginApi("google-id-token");

      expect(mockedPost).toHaveBeenCalledWith("/auth/google", {
        id_token: "google-id-token",
      });
      expect(result).toEqual({ access: "access", refresh: "refresh" });
    });
  });

  describe("registerApi", () => {
    it("should POST to /auth/register with username, email and password", async () => {
      const response = { data: { id: "abc-123", email: "user@example.com" } };
      mockedPost.mockResolvedValue(response);

      const result = await registerApi(
        "username",
        "user@example.com",
        "secret",
      );

      expect(mockedPost).toHaveBeenCalledWith("/auth/register", {
        username: "username",
        email: "user@example.com",
        password: "secret",
      });
      expect(result).toEqual({ id: "abc-123", email: "user@example.com" });
    });
  });

  describe("refreshApi", () => {
    it("should POST to /auth/refresh with refresh token", async () => {
      const response = { data: { access: "new-access" } };
      mockedPost.mockResolvedValue(response);

      const result = await refreshApi("refresh-token");

      expect(mockedPost).toHaveBeenCalledWith("/auth/refresh", {
        refresh: "refresh-token",
      });
      expect(result).toEqual({ access: "new-access" });
    });
  });

  describe("logoutApi", () => {
    it("should POST to /auth/logout with refresh token", async () => {
      mockedPost.mockResolvedValue({ data: null });

      const result = await logoutApi("refresh-token");

      expect(mockedPost).toHaveBeenCalledWith("/auth/logout", {
        refresh: "refresh-token",
      });
      expect(result).toBeNull();
    });
  });
});