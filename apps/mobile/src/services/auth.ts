import { Api } from "./api";

type LoginResponse = { access: string; refresh: string };
type RegisterResponse = { id: string; email: string };
type RefreshResponse = { access: string };

export const loginApi = async (email: string, password: string): Promise<LoginResponse> => {
  const { data } = await Api.post("/auth/login", { email, password });
  return data;
};

export async function registerApi(username: string, email: string, password: string) {
  const { data } = await Api.post("/auth/register", { username, email, password });
  return data;
}

export async function refreshApi(refresh: string): Promise<RefreshResponse> {
  const { data } = await Api.post("/auth/refresh", { refresh });
  return data;
}

export async function logoutApi(refresh: string): Promise<null> {
  const { data } = await Api.post("/auth/logout", { refresh });
  return data;
}
