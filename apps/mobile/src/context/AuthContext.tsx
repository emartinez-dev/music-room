import { createContext, useContext, useEffect, useState } from "react";

import { loginApi, logoutApi, registerApi } from "@/services/auth";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/services/secureStore";
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

  useEffect(() => {
    const access = getAccessToken();
    if (access) setIsAuthenticated(true);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { access, refresh } = await loginApi(email, password);
      saveTokens(access, refresh);
      const user: User = { id: "123", email: email };
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      showSnackbar(String(error));
    }
    setIsLoading(false);
  };

  const register = async (username: string, email: string, password: string) => {
    const { email: registeredEmail, id } = await registerApi(username, email, password);
    await login(registeredEmail, password);
  };

  const logout = async () => {
    const refresh = getRefreshToken();
    if (refresh) await logoutApi(refresh);
    clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  };

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
