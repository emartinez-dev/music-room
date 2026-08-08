import {
  deleteItemAsync,
  getItemAsync,
  setItemAsync,
} from "expo-secure-store";

export async function saveTokens(access: string, refresh: string) {
  await Promise.all([
    setItemAsync("access-token", access),
    setItemAsync("refresh-token", refresh),
  ]);
}

export async function setAccessToken(access: string) {
  await setItemAsync("access-token", access);
}

export async function setRefreshToken(refresh: string) {
  await setItemAsync("refresh-token", refresh);
}

export async function getAccessToken() {
  return getItemAsync("access-token");
}

export async function getRefreshToken() {
  return getItemAsync("refresh-token");
}

export async function clearTokens() {
  await Promise.all([
    deleteItemAsync("access-token"),
    deleteItemAsync("refresh-token"),
  ]);
}
