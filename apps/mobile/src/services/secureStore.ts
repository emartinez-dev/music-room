import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";

export async function saveTokens(access: string, refresh: string) {
  await Promise.all([setItemAsync("access-token", access), setItemAsync("refresh-token", refresh)]);
}

export function setAccessToken(access: string) {
  return setItemAsync("access-token", access);
}

export function setRefreshToken(refresh: string) {
  return setItemAsync("refresh-token", refresh);
}

export function getAccessToken() {
  return getItemAsync("access-token");
}

export function getRefreshToken() {
  return getItemAsync("refresh-token");
}

export async function clearTokens() {
  await Promise.all([deleteItemAsync("access-token"), deleteItemAsync("refresh-token")]);
}
