import { useEffect, useState } from "react";

const KEY = "organizer.selectedTournamentId";

/**
 * Remembers the organizer's chosen tournament across the Operations pages
 * (Registrations / Schedule / Officials / Results) via localStorage, so switching
 * tournament on one page carries to the others instead of resetting each time.
 */
export function useSelectedTournamentId() {
  const [id, setId] = useState<number | null>(() => {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(KEY);
    const parsed = raw == null ? NaN : Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (id == null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, String(id));
  }, [id]);

  return [id, setId] as const;
}
