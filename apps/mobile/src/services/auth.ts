import { Api } from "./api";

type LoginResponse = { access: string; refresh: string };
type GoogleLoginResponse = { access: string; refresh: string; user: { id: string; email: string } };
type RegisterResponse = { id: string; email: string };
type RefreshResponse = { access: string };

export const loginApi = async (email: string, password: string): Promise<LoginResponse> => {
  const { data } = await Api.post("/auth/login", { email, password });
  return data;
};

export async function googleLoginApi(
  idToken: string,
): Promise<GoogleLoginResponse> {
  const { data } = await Api.post("/auth/google", { id_token: idToken });
  return data;
}

export async function registerApi(
  username: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
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
