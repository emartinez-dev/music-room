import axios from "axios";

import { API_URL } from "../../config";
import { getAccessToken, getRefreshToken, saveTokens } from "./auth";

export const Api = axios.create({
  baseURL: API_URL,
  timeout: 5_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// This interceptor will add the Authorization: Bearer header to every request
Api.interceptors.request.use(
  async (config) => {
    const accessToken = await getAccessToken();
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  async (error) => {
    return Promise.reject(error);
  },
);

// This interceptor will automatically refresh the access token when it's not valid anymore
Api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config;

    if (error.response.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          const response = await Api.post("/auth/refresh", { refreshToken });
          const { accessToken } = response.data;
          await saveTokens(accessToken, refreshToken);

          originalConfig.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalConfig);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
