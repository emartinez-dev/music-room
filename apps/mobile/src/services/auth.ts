import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";

export async function saveTokens(access: string, refresh: string) {
  await setItemAsync("access-token", access);
  await setItemAsync("refresh-token", refresh);
}

export async function getAccessToken() {
  return getItemAsync("access-token");
}

export async function getRefreshToken() {
  return getItemAsync("refresh-token");
}

export async function clearTokens() {
  await deleteItemAsync("access-token")
  await deleteItemAsync("refresh-token")
}
