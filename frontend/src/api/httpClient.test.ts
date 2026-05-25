import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "./httpClient";

describe("httpClient", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("uses the versioned API base URL by default", () => {
    expect(httpClient.defaults.baseURL).toBe("/api/v1");
    expect(httpClient.defaults.withCredentials).toBe(true);
  });

  it("refreshes an expired session and retries the original request once", async () => {
    localStorage.setItem("accessToken", "old-access-token");
    const refreshRequest = vi
      .spyOn(axios, "post")
      .mockResolvedValue({ data: { accessToken: "new-access-token" } });
    const adapter = vi.fn((config: InternalAxiosRequestConfig) => {
      if (config.headers.Authorization === "Bearer new-access-token") {
        return Promise.resolve({
          config,
          data: { ok: true },
          headers: {},
          status: 200,
          statusText: "OK",
        });
      }

      return Promise.reject(
        new AxiosError(
          "Unauthorized",
          "ERR_BAD_REQUEST",
          config,
          undefined,
          {
            config,
            data: {},
            headers: {},
            status: 401,
            statusText: "Unauthorized",
          },
        ),
      );
    });

    const response = await httpClient.request({
      adapter,
      url: "/users/me/profile",
    });

    expect(response.data).toEqual({ ok: true });
    expect(refreshRequest).toHaveBeenCalledWith("/api/v1/auth/refresh", undefined, {
      withCredentials: true,
    });
    expect(localStorage.getItem("accessToken")).toBe("new-access-token");
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it("does not force JSON content type for FormData uploads", async () => {
    const formData = new FormData();
    formData.append("file", new File(["avatar"], "avatar.png", { type: "image/png" }));
    const adapter = vi.fn((config: InternalAxiosRequestConfig) =>
      Promise.resolve({
        config,
        data: {
          contentType: config.headers.get("Content-Type"),
        },
        headers: {},
        status: 200,
        statusText: "OK",
      }),
    );

    const response = await httpClient.request({
      adapter,
      data: formData,
      method: "post",
      url: "/files/upload?category=AVATAR",
    });

    expect(response.data.contentType).not.toBe("application/json");
  });

  it("clears the local session when refresh fails after an unauthorized API response", async () => {
    const sessionChanged = vi.fn();
    vi.spyOn(axios, "post").mockRejectedValue(
      new AxiosError("Refresh failed", "ERR_BAD_REQUEST"),
    );
    localStorage.setItem("accessToken", "old-access-token");
    localStorage.setItem("fullName", "Nguyen Van A");
    localStorage.setItem("email", "member@example.com");
    window.addEventListener("auth-session-changed", sessionChanged);

    await expect(
      httpClient.request({
        adapter: () =>
          Promise.reject(
            new AxiosError(
                "Unauthorized",
                "ERR_BAD_REQUEST",
                {} as InternalAxiosRequestConfig,
                undefined,
                {
                  config: {} as InternalAxiosRequestConfig,
                  data: {},
                  headers: {},
                  status: 401,
                  statusText: "Unauthorized",
                },
              ),
          ),
        url: "/users/me/profile",
      }),
    ).rejects.toThrow("Refresh failed");

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("fullName")).toBeNull();
    expect(localStorage.getItem("email")).toBeNull();
    expect(sessionChanged).toHaveBeenCalledTimes(1);
    window.removeEventListener("auth-session-changed", sessionChanged);
  });
});
