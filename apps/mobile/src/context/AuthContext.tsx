import { AxiosError } from "axios";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

import { loginApi, logoutApi, meApi, registerApi } from "@/services/auth";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/services/secureStore";
import { setSessionExpiredHandler } from "@/services/sessionManager";

import { useSnackbar } from "./SnackbarContext";

type User = { id: string; email: string };
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (tokens: { access: string; refresh: string; user: User }) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  me: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const { showSnackbar } = useSnackbar();

  const checkAuth = async () => {
    const access = await getAccessToken();
    setIsAuthenticated(!!access);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { access, refresh } = await loginApi(email, password);
      await saveTokens(access, refresh);
      await checkAuth();
      const me = await meApi();

      setUser(me);
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
      saveTokens(tokens.access, tokens.refresh);

      setUser(tokens.user);
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
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [showSnackbar]);

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);

    try {
      const { email: registeredEmail } = await registerApi(username, email, password);

      showSnackbar(`Please check ${registeredEmail} for your verification code`);
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

  const me = async () => {
    setIsLoading(true);
    try {
      const meData = await meApi();
      setUser(meData);
      Alert.alert("auth/me", JSON.stringify(meData, null, 2));
    } catch (error) {
      if (error instanceof AxiosError) {
        showSnackbar(error.response?.data?.message ?? "Failed to load profile");
      } else {
        showSnackbar("Failed to load profile");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAccessToken = async () => {
      const access = await getAccessToken();

      if (access) {
        setIsAuthenticated(true);
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
        isAuthenticated,
        login,
        loginWithGoogle,
        logout,
        register,
        me,
        checkAuth,
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
