import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { AuthProvider, useAuth } from "../AuthContext";
import { loginApi, logoutApi, meApi, registerApi } from "@/services/auth";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/services/secureStore";
import { setSessionExpiredHandler } from "@/services/sessionManager";

jest.mock("@/services/auth", () => ({
  loginApi: jest.fn(),
  logoutApi: jest.fn(),
  registerApi: jest.fn(),
  meApi: jest.fn(),
}));

jest.mock("@/services/secureStore", () => ({
  saveTokens: jest.fn(),
  clearTokens: jest.fn(),
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
}));

jest.mock("@/services/sessionManager", () => ({
  setSessionExpiredHandler: jest.fn(),
}));

jest.mock("@/context/SnackbarContext", () => ({
  useSnackbar: () => ({ showSnackbar: jest.fn() }),
}));

const mockedLoginApi = loginApi as jest.Mock;
const mockedLogoutApi = logoutApi as jest.Mock;
const mockedRegisterApi = registerApi as jest.Mock;
const mockedMeApi = meApi as jest.Mock;
const mockedSaveTokens = saveTokens as jest.Mock;
const mockedClearTokens = clearTokens as jest.Mock;
const mockedGetAccessToken = getAccessToken as jest.Mock;
const mockedGetRefreshToken = getRefreshToken as jest.Mock;
const mockedSetSessionExpiredHandler = setSessionExpiredHandler as jest.Mock;

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccessToken.mockResolvedValue(null);
    mockedGetRefreshToken.mockResolvedValue(null);
  });

  describe("initial state", () => {
    it("should start unauthenticated with no user", async () => {
      const { result } = await renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it("should register the session expired handler on mount", async () => {
      await renderHook(() => useAuth(), { wrapper });

      expect(mockedSetSessionExpiredHandler).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should set isAuthenticated to true if an access token exists", async () => {
      mockedGetAccessToken.mockResolvedValue("access-token");

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {});

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("login", () => {
    it("should save tokens and set the user on success", async () => {
      mockedLoginApi.mockResolvedValue({
        access: "access-token",
        refresh: "refresh-token",
      });
      mockedMeApi.mockResolvedValue({
        id: "123",
        email: "user@example.com",
      });

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login("user@example.com", "secret");
      });

      expect(mockedLoginApi).toHaveBeenCalledWith("user@example.com", "secret");
      expect(mockedSaveTokens).toHaveBeenCalledWith("access-token", "refresh-token");
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: "123",
        email: "user@example.com",
      });
      expect(result.current.isLoading).toBe(false);
    });

    it("should not authenticate when login fails", async () => {
      mockedLoginApi.mockRejectedValue(new Error("network error"));

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login("user@example.com", "wrong");
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockedSaveTokens).not.toHaveBeenCalled();
    });
  });

  describe("loginWithGoogle", () => {
    it("should save tokens and set the user on success", async () => {
      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.loginWithGoogle({
          access: "google-access",
          refresh: "google-refresh",
          user: { id: "google-1", email: "google@example.com" },
        });
      });

      expect(mockedSaveTokens).toHaveBeenCalledWith("google-access", "google-refresh");
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: "google-1",
        email: "google@example.com",
      });
    });
  });

  describe("register", () => {
    it("should register and then log the user in", async () => {
      mockedRegisterApi.mockResolvedValue({
        id: "abc-123",
        email: "user@example.com",
      });
      mockedLoginApi.mockResolvedValue({
        access: "access-token",
        refresh: "refresh-token",
      });
      mockedMeApi.mockResolvedValue({
        id: "123",
        email: "user@example.com",
      });

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register("username", "user@example.com", "secret");
      });

      expect(mockedRegisterApi).toHaveBeenCalledWith("username", "user@example.com", "secret");
      expect(mockedLoginApi).toHaveBeenCalledWith("user@example.com", "secret");
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should not authenticate when register fails", async () => {
      mockedRegisterApi.mockRejectedValue(new Error("register failed"));

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register("username", "user@example.com", "secret");
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(mockedLoginApi).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should call logoutApi with the refresh token and clear state", async () => {
      mockedGetRefreshToken.mockResolvedValue("refresh-token");
      mockedLogoutApi.mockResolvedValue(null);

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockedLogoutApi).toHaveBeenCalledWith("refresh-token");
      expect(mockedClearTokens).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it("should clear state even if logoutApi fails", async () => {
      mockedGetRefreshToken.mockResolvedValue("refresh-token");
      mockedLogoutApi.mockRejectedValue(new Error("logout failed"));

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockedClearTokens).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it("should not call logoutApi if there is no refresh token", async () => {
      mockedGetRefreshToken.mockResolvedValue(null);

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockedLogoutApi).not.toHaveBeenCalled();
      expect(mockedClearTokens).toHaveBeenCalled();
    });
  });
});
