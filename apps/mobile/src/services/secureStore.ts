import { deleteItemAsync, getItem, setItem } from 'expo-secure-store';

export function saveTokens(access: string, refresh: string) {
  setItem("access-token", access);
  setItem("refresh-token", refresh);
}

export function setAccessToken(access: string) {
  setItem("access-token", access);
}

export function setRefreshToken(refresh: string) {
  setItem("refresh-token", refresh);
}

export function getAccessToken() {
  return getItem("access-token");
}

export function getRefreshToken() {
  return getItem("refresh-token");
}

export function clearTokens() {
  deleteItemAsync("access-token").then(() => {});
  deleteItemAsync("refresh-token").then(() => {});
}
