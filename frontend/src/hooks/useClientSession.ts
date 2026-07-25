import { useCallback, useEffect, useState } from "react";
import { logoutRemote } from "../api/authApi";
import { AUTH_SESSION_CHANGED_EVENT, clearClientSession, getClientSession, setClientSession } from "../utils/authSession";
import { getRolesFromAccessToken } from "../utils/authRoles";
import axios from "axios";
import type { AccountStatus } from "../types/auth";

type ClientSession = {
  accessToken: string;
  email: string | null;
  fullName: string | null;
  roles: string[];
  accountStatus?: AccountStatus;
};

function readClientSession(): ClientSession | null {
  const session = getClientSession();
  const accessToken = session.accessToken;

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    email: session.email,
    fullName: session.fullName,
    roles: getRolesFromAccessToken(accessToken),
    accountStatus: session.accountStatus ?? "ACTIVE",
  };
}

export function useClientSession() {
  const [session, setSession] = useState<ClientSession | null>(() => readClientSession());
  const [isInitializing, setIsInitializing] = useState(() => !readClientSession() && import.meta.env.MODE !== "test");

  useEffect(() => {
    let mounted = true;

    if (!session && isInitializing) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
      axios
        .post(
          `${apiBaseUrl.replace(/\/$/, "")}/auth/refresh`,
          undefined,
          { withCredentials: true }
        )
        .then((res) => {
          if (!mounted) return;
          setClientSession(
            res.data.accessToken,
            res.data.fullName || localStorage.getItem("fullName"),
            res.data.email || localStorage.getItem("email"),
            res.data.accountStatus
          );
          setSession(readClientSession());
          setIsInitializing(false);
        })
        .catch(() => {
          if (!mounted) return;
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }

    return () => {
      mounted = false;
    };
  }, [session, isInitializing]);

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
    isInitializing,
  };
}
