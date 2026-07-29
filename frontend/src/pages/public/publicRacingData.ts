import type { Tournament } from "../../types/racing";

/* Shared formatting + status helpers for the public Championships / Races pages.
   All driven by the real getPublicTournaments() payload — no fabricated data. */

export type StatusTone = "open" | "live" | "closed" | "soon" | "done" | "neutral";

/**
 * Trạng thái giải → nhãn + tông màu.
 *
 * Dùng switch trên đúng giá trị enum TournamentStatus của backend, KHÔNG so khớp
 * chuỗi con. Cách cũ (`s.includes(...)`) khiến CLOSED_REGISTRATION dính nhánh
 * "CLOSED" và hiện thành "Concluded" — một giải sắp chạy trông như đã kết thúc.
 */
export function championshipStatus(status: string | undefined): { label: string; tone: StatusTone } {
  const s = (status ?? "").toUpperCase();
  switch (s) {
    case "OPEN_REGISTRATION":
      return { label: "Registration Open", tone: "open" };
    case "CLOSED_REGISTRATION":
      return { label: "Registration Closed", tone: "closed" };
    case "PARTICIPANTS_LOCKED":
      return { label: "Field Locked", tone: "closed" };
    case "SCHEDULE_PUBLISHED":
      return { label: "Schedule Published", tone: "soon" };
    case "ONGOING":
      return { label: "Running Now", tone: "live" };
    case "COMPLETED":
      return { label: "Concluded", tone: "done" };
    case "POSTPONED":
      return { label: "Postponed", tone: "neutral" };
    // Ba trạng thái dưới không lọt ra API công khai (xem PUBLIC_TOURNAMENT_STATUSES
    // ở RaceService), nhưng vẫn map để trang nội bộ dùng chung được ngôn ngữ này.
    case "DRAFT":
      return { label: "Draft", tone: "neutral" };
    case "PENDING_APPROVAL":
      return { label: "Awaiting Approval", tone: "neutral" };
    case "APPROVED":
      return { label: "Approved", tone: "soon" };
    default:
      return { label: s ? toTitle(s) : "Scheduled", tone: "neutral" };
  }
}

/**
 * Hai trạng thái hành động được (`live`, `open`) tô nền đặc, các trạng thái còn lại
 * chỉ viền. Khác nhau về CẤU TRÚC chứ không chỉ sắc độ — trước đây "Running" và
 * "Upcoming" đều là chữ gold-300 viền vàng nên nhìn lướt không tách được.
 */
export const toneClasses: Record<StatusTone, { dot: string; text: string; ring: string; solid: boolean }> = {
  live: { dot: "bg-turf-950", text: "text-turf-950", ring: "border-gold-400 bg-gold-400", solid: true },
  open: { dot: "bg-turf-950", text: "text-turf-950", ring: "border-emerald-soft bg-emerald-soft", solid: true },
  soon: { dot: "bg-ivory", text: "text-ivory", ring: "border-white/35", solid: false },
  closed: { dot: "bg-gold-600", text: "text-gold-400", ring: "border-gold-600/60", solid: false },
  done: { dot: "bg-ivory-faint", text: "text-ivory-faint", ring: "border-white/12", solid: false },
  neutral: { dot: "bg-ivory-dim", text: "text-ivory-dim", ring: "border-white/15", solid: false },
};

function toTitle(s: string) {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Race lifecycle → shared tone/label, same visual language as championships. */
export function raceStatus(status: string | undefined): { label: string; tone: StatusTone } {
  const s = (status ?? "").toUpperCase();
  switch (s) {
    case "SCHEDULED":
      return { label: "Scheduled", tone: "soon" };
    case "CHECKING":
      return { label: "Paddock Check", tone: "live" };
    case "READY":
      return { label: "At the Gate", tone: "live" };
    case "ONGOING":
      return { label: "Running", tone: "live" };
    case "FINISHED":
    case "RESULT_SUBMITTED":
    case "RESULT_CONFIRMED":
      return { label: "Finished", tone: "done" };
    case "PUBLISHED":
      return { label: "Results In", tone: "done" };
    case "CANCELLED":
      return { label: "Cancelled", tone: "neutral" };
    default:
      return { label: s ? toTitle(s) : "Scheduled", tone: "neutral" };
  }
}

/** True once a race has run (results exist or are being processed). */
export function isRaceConcluded(status: string | undefined): boolean {
  return raceStatus(status).tone === "done";
}

export function formatDateInput(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Thời gian về đích theo cách giới đua ghi: dưới một phút thì đọc thẳng bằng giây
 * (`58.412s`), từ một phút trở lên đổi sang `m:ss.SSS` — không ai đọc "117.340s".
 *
 * Chặn luôn giá trị vô lý: cự ly ngắn nhất trên hệ thống cũng mất vài giây, nên
 * một con số dưới `MIN_PLAUSIBLE_FINISH_SECONDS` là dữ liệu rác (seed/nhập nhầm)
 * chứ không phải kỷ lục — thà trả "TBA" còn hơn in "1.000s" lên trang chủ.
 */
const MIN_PLAUSIBLE_FINISH_SECONDS = 5;

export function formatResultTime(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < MIN_PLAUSIBLE_FINISH_SECONDS) return "TBA";
  if (seconds < 60) return `${seconds.toFixed(3)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return `${minutes}:${remainder.toFixed(3).padStart(6, "0")}`;
}

export function formatPostTime(value?: string): string {
  if (!value) return "Post time TBA";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Post time TBA";
  const time = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(d);
  const day = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(d);
  return `${time} · ${day}`;
}

export function formatDistance(meters?: number): string | null {
  if (!meters || meters <= 0) return null;
  return `${new Intl.NumberFormat("en").format(meters)} m`;
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
  const rank: Record<StatusTone, number> = { live: 0, open: 1, soon: 2, closed: 3, neutral: 4, done: 5 };
  return [...list].sort((a, b) => {
    const ra = rank[championshipStatus(a.status).tone];
    const rb = rank[championshipStatus(b.status).tone];
    if (ra !== rb) return ra - rb;
    const da = a.startDate ? new Date(a.startDate).getTime() : Infinity;
    const db = b.startDate ? new Date(b.startDate).getTime() : Infinity;
    return da - db;
  });
}
