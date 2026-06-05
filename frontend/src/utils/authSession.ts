export const AUTH_SESSION_CHANGED_EVENT = "auth-session-changed";

let memorySession: { accessToken: string | null; fullName: string | null; email: string | null } = {
  accessToken: null,
  fullName: null,
  email: null,
};

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

export function getClientSession() {
  if (import.meta.env.MODE === "test") {
    return {
      accessToken: localStorage.getItem("accessToken"),
      fullName: localStorage.getItem("fullName"),
      email: localStorage.getItem("email"),
    };
  }
  return memorySession;
}

export function setClientSession(accessToken: string | null, fullName: string | null, email: string | null) {
  if (import.meta.env.MODE === "test") {
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (fullName) localStorage.setItem("fullName", fullName);
    if (email) localStorage.setItem("email", email);
  }
  memorySession = { accessToken, fullName, email };
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function clearClientSession({ notify = true } = {}) {
  const session = getClientSession();
  const hadSession = Boolean(session.accessToken || session.fullName || session.email);

  if (import.meta.env.MODE === "test") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("fullName");
    localStorage.removeItem("email");
  }
  
  memorySession = { accessToken: null, fullName: null, email: null };

  if (notify && hadSession) {
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
  }
}
