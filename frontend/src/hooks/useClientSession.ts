import { useCallback, useEffect, useState } from "react";

type ClientSession = {
  accessToken: string;
  email: string | null;
  fullName: string | null;
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
  };
}

export function useClientSession() {
  const [session, setSession] = useState<ClientSession | null>(() => readClientSession());

  useEffect(() => {
    const syncSession = () => {
      setSession(readClientSession());
    };

    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("fullName");
    localStorage.removeItem("email");
    setSession(null);
  }, []);

  return {
    isAuthenticated: Boolean(session?.accessToken),
    logout,
    session,
  };
}
