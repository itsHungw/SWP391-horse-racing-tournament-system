import { useEffect, useState } from "react";
import { getClientSession } from "../../../utils/authSession";

/**
 * Controls the "How predictions work" guide shared by the bet slips.
 *
 * The guide opens by itself the first time a spectator lands on the cockpit and
 * then never again: the flag is persisted, so it survives both a reload and a
 * remount. The remount case matters — switching bet mode unmounts one slip and
 * mounts the other, so a mount-scoped flag would re-open the guide every time
 * the spectator toggled between Exact Position and Winning Streak.
 *
 * The flag is keyed per account, not per browser. `clearClientSession()` wipes
 * only the auth keys, so an unscoped flag would survive logout and the next
 * spectator to log in on that machine — a genuinely new user — would never be
 * shown the guide.
 *
 * Bump the key's version prefix to show the guide once more to everyone after
 * the rules themselves change.
 */
const SEEN_KEY_PREFIX = "hrts.predictions.rules.seen.v1";

function seenKey(): string | null {
  const { email } = getClientSession();
  // No identity to remember against. Fail closed rather than fall back to a
  // shared key, which is exactly the cross-account leak this avoids.
  return email ? `${SEEN_KEY_PREFIX}:${email}` : null;
}

function hasSeenRules(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    // Storage blocked (private mode, cookies disabled). Treat it as "seen" so a
    // failing write can never degrade into a modal on every single mount.
    return true;
  }
}

function markRulesSeen(key: string): void {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Nothing to do; hasSeenRules() already fails closed.
  }
}

export function useRulesFirstRun() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = seenKey();
    if (!key || hasSeenRules(key)) return;
    // Marked on open rather than on close, so an interrupted session (reload
    // while the guide is up) still counts as shown.
    markRulesSeen(key);
    setOpen(true);
  }, []);

  return {
    rulesOpen: open,
    openRules: () => setOpen(true),
    closeRules: () => setOpen(false),
  };
}
