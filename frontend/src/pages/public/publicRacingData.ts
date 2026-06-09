import type { Tournament } from "../../types/racing";

/* Shared formatting + status helpers for the public Championships / Races pages.
   All driven by the real getPublicTournaments() payload — no fabricated data. */

export type StatusTone = "open" | "live" | "done" | "soon" | "neutral";

export function championshipStatus(status: string | undefined): { label: string; tone: StatusTone } {
  const s = (status ?? "").toUpperCase();
  if (["REGISTRATION_OPEN", "OPEN", "REGISTERING"].some((k) => s.includes(k))) {
    return { label: "Registration Open", tone: "open" };
  }
  if (["ONGOING", "ACTIVE", "RUNNING", "LIVE", "IN_PROGRESS"].some((k) => s.includes(k))) {
    return { label: "Running", tone: "live" };
  }
  if (["FINISHED", "COMPLETED", "CLOSED", "ENDED"].some((k) => s.includes(k))) {
    return { label: "Concluded", tone: "done" };
  }
  if (["UPCOMING", "SCHEDULED", "DRAFT", "PENDING", "PUBLISHED"].some((k) => s.includes(k))) {
    return { label: "Upcoming", tone: "soon" };
  }
  return { label: status ? toTitle(s) : "Scheduled", tone: "neutral" };
}

export const toneClasses: Record<StatusTone, { dot: string; text: string; ring: string }> = {
  open: { dot: "bg-emerald-soft", text: "text-emerald-soft", ring: "border-emerald-glow/40" },
  live: { dot: "bg-gold-400", text: "text-gold-300", ring: "border-gold-400/45" },
  done: { dot: "bg-ivory-faint", text: "text-ivory-faint", ring: "border-white/15" },
  soon: { dot: "bg-gold-300", text: "text-gold-300", ring: "border-gold-400/30" },
  neutral: { dot: "bg-ivory-dim", text: "text-ivory-dim", ring: "border-white/15" },
};

function toTitle(s: string) {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatLongDate(value?: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export function formatDateRange(start?: string, end?: string): string {
  const a = formatLongDate(start);
  const b = formatLongDate(end);
  if (a && b) return `${a} — ${b}`;
  if (a) return `From ${a}`;
  if (b) return `Until ${b}`;
  return "Dates to be announced";
}

export function isRegistrationOpen(t: Tournament): boolean {
  const now = Date.now();
  const start = t.registrationStartAt ? new Date(t.registrationStartAt).getTime() : null;
  const end = t.registrationEndAt ? new Date(t.registrationEndAt).getTime() : null;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return Boolean(start || end);
}

/** Sort: open/live first, then upcoming, then concluded; by start date within group. */
export function sortChampionships(list: Tournament[]): Tournament[] {
  const rank: Record<StatusTone, number> = { live: 0, open: 1, soon: 2, neutral: 3, done: 4 };
  return [...list].sort((a, b) => {
    const ra = rank[championshipStatus(a.status).tone];
    const rb = rank[championshipStatus(b.status).tone];
    if (ra !== rb) return ra - rb;
    const da = a.startDate ? new Date(a.startDate).getTime() : Infinity;
    const db = b.startDate ? new Date(b.startDate).getTime() : Infinity;
    return da - db;
  });
}
