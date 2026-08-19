import { Api } from "./api";

type LoginResponse = { access: string; refresh: string };
type MeResponse = { id: string; email: string; username: string };
type GoogleLoginResponse = { access: string; refresh: string; user: { id: string; email: string } };
type RegisterResponse = { id: string; email: string };
type RefreshResponse = { access: string };
type ResendVerificationResponse = { id: string; email: string };

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const { data } = await Api.post("/auth/login", { email, password });
  return data;
}

export async function googleLoginApi(idToken: string): Promise<GoogleLoginResponse> {
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

export async function meApi(): Promise<MeResponse> {
  const { data } = await Api.get("/auth/me");
  return data;
}

export async function resendVerificationApi(email: string): Promise<ResendVerificationResponse> {
  const { data } = await Api.post("/auth/resend-verification/", { email });
  return data;
}

