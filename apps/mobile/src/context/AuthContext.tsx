import { AxiosError } from "axios";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { loginApi, logoutApi, registerApi } from "@/services/auth";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/services/secureStore";
import { setSessionExpiredHandler } from "@/services/sessionManager";

import { useSnackbar } from "./SnackbarContext";

type User = { id: string; email: string };
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const { showSnackbar } = useSnackbar();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { access, refresh } = await loginApi(email, password);
      saveTokens(access, refresh);
      const user: User = { id: "123", email: email };
      setUser(user);
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

  const logout = useCallback(async () => {
    try {
      const refresh = getRefreshToken();

      if (refresh) {
        await logoutApi(refresh);
      }
    } finally {
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);

    try {
      const { email: registeredEmail } = await registerApi(username, email, password);

      await login(registeredEmail, password);
    } catch (error) {
      if (error instanceof AxiosError) {
        showSnackbar(error.response?.data?.message ?? "Register failed");
      } else {
        showSnackbar("Register failed");
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    const access = getAccessToken();

    if (access) {
      setIsAuthenticated(true);
    }

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
        logout,
        register,
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
