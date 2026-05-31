import { getItem, setItem } from "expo-secure-store";
import { Api } from "./api";

export function saveTokens(access: string, refresh: string) {
  setItem("access-token", access);
  setItem("refresh-token", refresh);
}

export function getAccessToken() {
  return getItem("access-token");
}

export function getRefreshToken() {
  return getItem("refresh-token");
}

export function clearTokens() {
  setItem("access-token", "");
  setItem("refresh-token", "");
}
