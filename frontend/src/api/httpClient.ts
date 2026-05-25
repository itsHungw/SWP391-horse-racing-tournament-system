import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import type { AuthResponse } from "../types/auth";
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearClientSession,
  isAccessTokenExpired,
} from "../utils/authSession";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

function buildApiUrl(path: string) {
  return `${apiBaseUrl.replace(/\/$/, "")}${path}`;
}

function isAuthRefreshRequest(url?: string) {
  return Boolean(url?.includes("/auth/refresh"));
}

function shouldSkipRefresh(url?: string) {
  return Boolean(
    url?.includes("/auth/login") ||
      url?.includes("/auth/register") ||
      url?.includes("/auth/resend-verification-email") ||
      url?.includes("/auth/verify-email") ||
      url?.includes("/auth/logout") ||
      isAuthRefreshRequest(url),
  );
}

httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token && !isAccessTokenExpired(token)) {
      const headers = AxiosHeaders.from(config.headers);
      headers.set("Authorization", `Bearer ${token}`);
      config.headers = headers;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || originalRequest._retry || shouldSkipRefresh(originalRequest.url)) {
      clearClientSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await axios.post<AuthResponse>(
        buildApiUrl("/auth/refresh"),
        undefined,
        { withCredentials: true },
      );
      const nextAccessToken = refreshResponse.data.accessToken;
      localStorage.setItem("accessToken", nextAccessToken);
      window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));

      const headers = AxiosHeaders.from(originalRequest.headers);
      headers.set("Authorization", `Bearer ${nextAccessToken}`);
      originalRequest.headers = headers;

      return httpClient(originalRequest);
    } catch (refreshError) {
      clearClientSession();
      return Promise.reject(refreshError);
    }
  },
);
