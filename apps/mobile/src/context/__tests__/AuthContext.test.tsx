import { act, renderHook, waitFor } from "@testing-library/react-native";
import { AxiosError } from "axios";
import { router } from "expo-router";
import React from "react";
import { loginApi, logoutApi, meApi, registerApi } from "@/services/auth";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/services/secureStore";
import { setSessionExpiredHandler } from "@/services/sessionManager";
import { AuthProvider, useAuth } from "../AuthContext";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

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

const mockShowSnackbar = jest.fn();

jest.mock("@/context/SnackbarContext", () => ({
  useSnackbar: () => ({ showSnackbar: mockShowSnackbar }),
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

// Builds the AxiosError shape the context reads its snackbar message from.
function axiosErrorWithMessage(message: string) {
  return new AxiosError("request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    data: { message },
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: {},
  } as never);
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

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
      mockedMeApi.mockResolvedValue({
        id: "123",
        email: "user@example.com",
        username: "user",
        spotify_linked: false,
      });

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {});

      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should set isCheckingAuth to false once the initial check resolves", async () => {
      const { result } = await renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isCheckingAuth).toBe(false);
      });
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

    it("should not toggle isCheckingAuth while logging in, even when login fails", async () => {
      mockedLoginApi.mockRejectedValue(new Error("network error"));

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isCheckingAuth).toBe(false);
      });

      await act(async () => {
        await result.current.login("user@example.com", "wrong");
      });

      expect(result.current.isCheckingAuth).toBe(false);
    });

    it("should show the message returned by the API when login fails", async () => {
      mockedLoginApi.mockRejectedValue(axiosErrorWithMessage("Invalid credentials"));

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login("user@example.com", "wrong");
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith("Invalid credentials");
    });

    it("should show a generic message when login fails without an API message", async () => {
      mockedLoginApi.mockRejectedValue(new Error("network error"));

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login("user@example.com", "wrong");
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith("Login failed");
    });

    it("should not fetch the profile when login fails", async () => {
      mockedLoginApi.mockRejectedValue(new Error("network error"));

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login("user@example.com", "wrong");
      });

      expect(mockedMeApi).not.toHaveBeenCalled();
    });
  });

  describe("loginWithGoogle", () => {
    it("should save tokens and set the user on success", async () => {
      mockedMeApi.mockResolvedValue({
        id: "google-1",
        email: "google@example.com",
        username: "google-1",
        spotify_linked: true,
      });

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
        username: "google-1",
        spotify_linked: true,
      });
      expect(result.current.spotifyLinked).toBe(true);
    });

    it("should not authenticate when the tokens cannot be stored", async () => {
      mockedSaveTokens.mockRejectedValue(new Error("keychain unavailable"));

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.loginWithGoogle({
          access: "google-access",
          refresh: "google-refresh",
          user: { id: "google-1", email: "google@example.com" },
        });
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockShowSnackbar).toHaveBeenCalledWith("Google login failed");
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("register", () => {
    it("should not log the user in after registering", async () => {
      mockedRegisterApi.mockResolvedValue({
        id: "abc-123",
        email: "user@example.com",
      });

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register("username", "user@example.com", "secret");
      });

      expect(mockedRegisterApi).toHaveBeenCalledWith("username", "user@example.com", "secret");
      expect(mockedLoginApi).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
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

    // The register screen navigates to verify-email only on a truthy result,
    // so the returned boolean is part of the contract.
    it("should return true and point the user at their inbox on success", async () => {
      mockedRegisterApi.mockResolvedValue({ id: "abc-123", email: "user@example.com" });

      const { result } = await renderHook(() => useAuth(), { wrapper });

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.register("username", "user@example.com", "secret");
      });

      expect(returned).toBe(true);
      expect(mockShowSnackbar).toHaveBeenCalledWith(
        "Check user@example.com to verify your account",
      );
    });

    it("should return false and show the API message when register fails", async () => {
      mockedRegisterApi.mockRejectedValue(axiosErrorWithMessage("Email already taken"));

      const { result } = await renderHook(() => useAuth(), { wrapper });

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.register("username", "user@example.com", "secret");
      });

      expect(returned).toBe(false);
      expect(mockShowSnackbar).toHaveBeenCalledWith("Email already taken");
    });

    it("should show a generic message when register fails without an API message", async () => {
      mockedRegisterApi.mockRejectedValue(new Error("network error"));

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register("username", "user@example.com", "secret");
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith("Register failed");
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

    it("should show the API message when the server rejects the logout", async () => {
      mockedGetRefreshToken.mockResolvedValue("refresh-token");
      mockedLogoutApi.mockRejectedValue(axiosErrorWithMessage("Token already blacklisted"));

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith("Token already blacklisted");
      // The local session is dropped regardless of what the server says.
      expect(mockedClearTokens).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should show a generic message when the logout fails without an API message", async () => {
      mockedGetRefreshToken.mockResolvedValue("refresh-token");
      mockedLogoutApi.mockRejectedValue(new Error("network error"));

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith("Logout failed");
    });

    it("should navigate to the login screen", async () => {
      mockedGetRefreshToken.mockResolvedValue(null);

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(router.replace).toHaveBeenCalledWith("/(auth)/login");
    });
  });

  describe("checkAuth", () => {
    it("should mark the user as authenticated when a token is stored", async () => {
      const { result } = await renderHook(() => useAuth(), { wrapper });

      mockedGetAccessToken.mockResolvedValue("access-token");

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should mark the user as unauthenticated when the token is gone", async () => {
      mockedGetAccessToken.mockResolvedValue("access-token");

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      mockedGetAccessToken.mockResolvedValue(null);

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("refreshProfile", () => {
    it("should load the profile and expose the user and spotifyLinked flag", async () => {
      mockedMeApi.mockResolvedValue({
        id: "123",
        email: "user@example.com",
        spotify_linked: true,
      });

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refreshProfile();
      });

      expect(result.current.user).toEqual({
        id: "123",
        email: "user@example.com",
        spotify_linked: true,
      });
      expect(result.current.spotifyLinked).toBe(true);
    });
  });

  describe("session expiry", () => {
    // The API layer calls sessionExpired() when a token refresh fails. That has
    // to end in a real logout, otherwise the user is stuck on a screen whose
    // every request 401s.
    it("should log the user out when the registered handler fires", async () => {
      mockedGetAccessToken.mockResolvedValue("access-token");
      mockedGetRefreshToken.mockResolvedValue("refresh-token");

      const { result } = await renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      const handler = mockedSetSessionExpiredHandler.mock.calls.at(-1)?.[0];
      expect(handler).toEqual(expect.any(Function));

      await act(async () => {
        handler();
      });

      await waitFor(() => {
        expect(mockedClearTokens).toHaveBeenCalled();
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(router.replace).toHaveBeenCalledWith("/(auth)/login");
    });
  });
});
