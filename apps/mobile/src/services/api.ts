import axios from "axios";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { API_URL } from "../../config";
import { getAccessToken, getRefreshToken, saveTokens } from "./secureStore";
import { sessionExpired } from "./sessionManager";

// Main API client used for all authenticated requests
export const Api = axios.create({
  baseURL: API_URL,
  timeout: 5_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Platform": Platform.OS,
    "X-App-Version": Platform.Version,
    "X-Device-Model": Device.modelName,
  },
});

// Dedicated client used only to refresh access tokens
const RefreshApi = axios.create({
  baseURL: API_URL,
  timeout: 5_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Platform": Platform.OS,
    "X-App-Version": Platform.Version,
    "X-Device-Model": Device.modelName,
  },
});

// This interceptor will add the Authorization: Bearer header to every request
Api.interceptors.request.use(
  async (config) => {
    const accessToken = await getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// This interceptor will automatically refresh the access token when it's not valid anymore
Api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config;

    if (
      error.response?.status === 401 &&
      !originalConfig?._retry &&
      !originalConfig?.url?.includes("/auth/login") &&
      !originalConfig?.url?.includes("/auth/register") &&
      !originalConfig?.url?.includes("/auth/refresh") &&
      !originalConfig?.url?.includes("/auth/verify-email")
    ) {
      originalConfig._retry = true;

      try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          return Promise.reject(error);
        }

        const response = await RefreshApi.post("/auth/refresh", {
          refresh: refreshToken,
        });

        const { access } = response.data;

        await saveTokens(access, refreshToken);

        originalConfig.headers.Authorization = `Bearer ${access}`;

        return Api(originalConfig);
      } catch (refreshError) {
        sessionExpired();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
