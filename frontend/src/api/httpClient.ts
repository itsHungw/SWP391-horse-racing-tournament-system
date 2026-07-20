import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import type { AuthResponse } from "../types/auth";
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearClientSession,
  isAccessTokenExpired,
  getClientSession,
  setClientSession,
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
      url?.includes("/auth/forgot-password") ||
      url?.includes("/auth/verify-reset-code") ||
      url?.includes("/auth/reset-password") ||
      url?.includes("/auth/logout") ||
      isAuthRefreshRequest(url),
  );
}

function isFormDataBody(data: unknown) {
  return typeof FormData !== "undefined" && data instanceof FormData;
}

httpClient.interceptors.request.use(
  (config) => {
    const session = getClientSession();
    const token = session.accessToken;
    const headers = AxiosHeaders.from(config.headers);

    if (isFormDataBody(config.data)) {
      headers.delete("Content-Type");
    }

    if (token && !isAccessTokenExpired(token)) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    config.headers = headers;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const code = (error.response.data as { code?: string } | undefined)?.code;
      if (code === "ACCOUNT_SUSPENDED" || code === "ACCOUNT_BANNED") {
        const current = getClientSession();
        const nextStatus = code === "ACCOUNT_SUSPENDED" ? "SUSPENDED" : "BANNED";
        if (current.accessToken && current.accountStatus !== nextStatus) {
          setClientSession(current.accessToken, current.fullName, current.email, nextStatus);
        }
      }
      return Promise.reject(error);
    }

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
      setClientSession(
        nextAccessToken,
        refreshResponse.data.fullName,
        refreshResponse.data.email,
        refreshResponse.data.accountStatus
      );

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
