import { useCallback, useEffect, useState } from "react";
import { logoutRemote } from "../api/authApi";
import { AUTH_SESSION_CHANGED_EVENT, clearClientSession } from "../utils/authSession";
import { getRolesFromAccessToken } from "../utils/authRoles";

type ClientSession = {
  accessToken: string;
  email: string | null;
  fullName: string | null;
  roles: string[];
};

function readClientSession(): ClientSession | null {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    email: localStorage.getItem("email"),
    fullName: localStorage.getItem("fullName"),
    roles: getRolesFromAccessToken(accessToken),
  };
}

export function useClientSession() {
  const [session, setSession] = useState<ClientSession | null>(() => readClientSession());

  useEffect(() => {
    const syncSession = () => {
      setSession(readClientSession());
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
    };
  }, []);

  const logout = useCallback(() => {
    void logoutRemote().catch(() => undefined);
    clearClientSession();
    setSession(null);
  }, []);

  return {
    isAuthenticated: Boolean(session?.accessToken),
    logout,
    session,
  };
}
