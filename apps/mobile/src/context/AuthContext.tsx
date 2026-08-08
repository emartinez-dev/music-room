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
  loginWithGoogle: (tokens: {
    access: string;
    refresh: string;
    user: User;
  }) => Promise<void>;
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

  

  const loginWithGoogle = async (tokens: {
    access: string;
    refresh: string;
    user: User;
    }) => {
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
        console.error(
          "Logout error:",
          JSON.stringify(error.response?.data, null, 2)
        );

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
