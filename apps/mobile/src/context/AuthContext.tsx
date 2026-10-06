import { AxiosError } from "axios";
import { router } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { loginApi, logoutApi, meApi, registerApi } from "@/services/auth";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/services/secureStore";
import { setSessionExpiredHandler } from "@/services/sessionManager";
import { handleSpotifyLink } from "@/services/spotifyAuth";

import { useSnackbar } from "./SnackbarContext";

type User = { id: string; email: string };
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isCheckingAuth: boolean;
  isAuthenticated: boolean;
  spotifyLinked: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (tokens: { access: string; refresh: string; user: User }) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  linkSpotify: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [spotifyLinked, setSpotifyLinked] = useState<boolean>(false);

  const { showSnackbar } = useSnackbar();

  const checkAuth = async () => {
    const access = await getAccessToken();
    setIsAuthenticated(!!access);
  };

  const refreshProfile = async () => {
    const meData = await meApi();
    setUser(meData);
    setSpotifyLinked(meData.spotify_linked);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { access, refresh } = await loginApi(email, password);
      await saveTokens(access, refresh);
      await checkAuth();
      const me = await meApi();

      setUser(me);
      setSpotifyLinked(me.spotify_linked);
      setIsAuthenticated(true);
    } catch (error) {
      if (error instanceof AxiosError) {
        showSnackbar(error.response?.data?.message ?? "Login failed");
      } else {
        showSnackbar("Login failed");
      }
    }
    setIsLoading(false);
  };

  const loginWithGoogle = async (tokens: { access: string; refresh: string; user: User }) => {
    setIsLoading(true);

    try {
      await saveTokens(tokens.access, tokens.refresh);

      const me = await meApi();
      setUser(me);
      setSpotifyLinked(me.spotify_linked);
      setIsAuthenticated(true);
    } catch (error) {
      if (error instanceof AxiosError) {
        showSnackbar(error.response?.data?.message ?? "Google login failed");
      } else {
        showSnackbar("Google login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      const refresh = await getRefreshToken();

      if (refresh) {
        await logoutApi(refresh);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error("Logout error:", JSON.stringify(error.response?.data, null, 2));

        showSnackbar(error.response?.data?.message ?? "Logout failed");
      } else {
        console.error("Logout error:", error);
        showSnackbar("Logout failed");
      }
    } finally {
      await clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      router.replace("/(auth)/login");
    }
  }, [showSnackbar]);

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);

    try {
      const { email: registeredEmail } = await registerApi(username, email, password);

      showSnackbar(`Check ${registeredEmail} to verify your account`);
      return true;
    } catch (error) {
      if (error instanceof AxiosError) {
        showSnackbar(error.response?.data?.message ?? "Register failed");
      } else {
        showSnackbar("Register failed");
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const linkSpotify = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      await handleSpotifyLink();
      setSpotifyLinked(true);
      return true;
    } catch (error) {
      if (error instanceof AxiosError) {
        showSnackbar(error.response?.data?.message ?? "Failed to link Spotify account");
      } else {
        showSnackbar("Failed to link Spotify account");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAccessToken = async () => {
      try {
        const access = await getAccessToken();

        if (access) {
          setIsAuthenticated(true);
          const meData = await meApi();
          setUser(meData);
          setSpotifyLinked(meData.spotify_linked);
        }
      } catch {
        // sessionExpired() (triggered by the Api interceptor) already logs the user out
      } finally {
        setIsCheckingAuth(false);
      }
    };

    void checkAccessToken();

    setSessionExpiredHandler(() => {
      void logout();
    });
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isCheckingAuth,
        isAuthenticated,
        spotifyLinked,
        login,
        loginWithGoogle,
        logout,
        register,
        checkAuth,
        refreshProfile,
        linkSpotify,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
