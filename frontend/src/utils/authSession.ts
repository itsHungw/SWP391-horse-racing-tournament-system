export const AUTH_SESSION_CHANGED_EVENT = "auth-session-changed";

type AccessTokenPayload = {
  exp?: unknown;
  roles?: unknown;
};

export function decodeAccessTokenPayload(accessToken: string | null): AccessTokenPayload | null {
  if (!accessToken) {
    return null;
  }

  const [, payload] = accessToken.split(".");
  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload.replaceAll("-", "+").replaceAll("_", "/");
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "=",
    );

    return JSON.parse(window.atob(paddedPayload)) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(accessToken: string | null, nowSeconds = Math.floor(Date.now() / 1000)) {
  const payload = decodeAccessTokenPayload(accessToken);

  if (typeof payload?.exp !== "number") {
    return true;
  }

  return payload.exp <= nowSeconds;
}

export function clearClientSession({ notify = true } = {}) {
  const hadSession = Boolean(
    localStorage.getItem("accessToken") ||
      localStorage.getItem("fullName") ||
      localStorage.getItem("email"),
  );

  localStorage.removeItem("accessToken");
  localStorage.removeItem("fullName");
  localStorage.removeItem("email");

  if (notify && hadSession) {
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
  }
}
