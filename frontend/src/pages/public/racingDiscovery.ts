import type { RaceSummary, TournamentSummary } from "../../types/racing";

export type RaceDiscoveryState = {
  scope: "UPCOMING" | "RESULTS";
  view: "agenda" | "calendar";
  search: string;
  tournamentId?: number;
  from?: string;
  to?: string;
  month: string;
  page: number;
};

export type ChampionshipDiscoveryState = {
  search: string;
  status: string;
  year?: number;
  sortBy: "ONGOING_FIRST" | "REGISTRATION_CLOSING_SOON" | "LATEST";
  page: number;
};

export type RaceGroup = { key: string; label: string; races: RaceSummary[] };

const OFFICIAL_RESULTS = new Set(["RESULT_CONFIRMED", "PUBLISHED"]);
const LIVE_RACES = new Set(["ONGOING", "READY", "CHECKING"]);

function validDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function timestamp(value?: string | null, fallback = Number.POSITIVE_INFINITY) {
  return validDate(value)?.getTime() ?? fallback;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

export function parseRaceDiscoveryQuery(params: URLSearchParams): RaceDiscoveryState {
  const scope = params.get("scope") === "RESULTS" ? "RESULTS" : "UPCOMING";
  const view = params.get("view") === "calendar" ? "calendar" : "agenda";
  const page = Math.max(0, Number.parseInt(params.get("page") ?? "0", 10) || 0);
  const tournamentId = Number.parseInt(params.get("tournamentId") ?? "", 10);
  const currentMonth = monthKey(new Date());
  return {
    scope,
    view,
    search: params.get("search")?.trim() ?? "",
    tournamentId: Number.isFinite(tournamentId) && tournamentId > 0 ? tournamentId : undefined,
    from: params.get("from") || undefined,
    to: params.get("to") || undefined,
    month: /^\d{4}-\d{2}$/.test(params.get("month") ?? "") ? params.get("month")! : currentMonth,
    page,
  };
}

export function parseChampionshipDiscoveryQuery(params: URLSearchParams): ChampionshipDiscoveryState {
  const sort = params.get("sortBy");
  const sortBy =
    sort === "LATEST" || sort === "REGISTRATION_CLOSING_SOON" ? sort : "ONGOING_FIRST";
  const year = Number.parseInt(params.get("year") ?? "", 10);
  return {
    search: params.get("search")?.trim() ?? "",
    status: params.get("status")?.trim().toUpperCase() ?? "",
    year: Number.isFinite(year) && year > 0 ? year : undefined,
    sortBy,
    page: Math.max(0, Number.parseInt(params.get("page") ?? "0", 10) || 0),
  };
}

/**
 * Xếp hạng giải theo mức đáng chú ý với khán giả: đang chạy trước (có race kế càng ưu tiên),
 * rồi mở đăng ký, sắp tới, và cuối cùng là đã xong.
 */
export function rankChampionshipsInFocus(list: TournamentSummary[]) {
  const sorted = [...list].sort((a, b) => {
    const rank = (championship: TournamentSummary) => {
      const status = championship.status.toUpperCase();
      if (status === "ONGOING" && championship.nextRace) return 0;
      if (status === "ONGOING") return 1;
      if (status === "OPEN_REGISTRATION") return 2;
      if (["CLOSED_REGISTRATION", "SCHEDULE_PUBLISHED"].includes(status)) return 3;
      if (status === "COMPLETED") return 4;
      return 5;
    };
    const rankDifference = rank(a) - rank(b);
    if (rankDifference) return rankDifference;
    const status = a.status.toUpperCase();
    if (status === "ONGOING") return timestamp(a.nextRace?.raceDateTime) - timestamp(b.nextRace?.raceDateTime);
    if (status === "OPEN_REGISTRATION") return timestamp(a.registrationEndAt) - timestamp(b.registrationEndAt);
    if (status === "COMPLETED") return timestamp(b.endDate, 0) - timestamp(a.endDate, 0);
    return timestamp(a.startDate) - timestamp(b.startDate);
  });
  return sorted;
}

export function selectChampionshipInFocus(list: TournamentSummary[]) {
  return rankChampionshipsInFocus(list)[0] ?? null;
}

/**
 * Xếp hạng race theo thứ tự khán giả quan tâm: đang chạy trước, rồi tới giờ xuất
 * phát gần nhất, cuối cùng mới là kết quả vừa công bố (chỉ khi không còn race nào
 * sắp chạy). Giữ đúng thứ tự ưu tiên mà selectNextToPost vẫn dùng.
 */
export function rankRacesToPost(upcoming: RaceSummary[], results: RaceSummary[], now = new Date()) {
  const byPostTime = (a: RaceSummary, b: RaceSummary) => timestamp(a.raceDateTime) - timestamp(b.raceDateTime);
  const live = upcoming.filter((race) => LIVE_RACES.has(race.status.toUpperCase())).sort(byPostTime);
  const scheduled = upcoming
    .filter((race) => !LIVE_RACES.has(race.status.toUpperCase()) && timestamp(race.raceDateTime) >= now.getTime())
    .sort(byPostTime);
  if (live.length || scheduled.length) return [...live, ...scheduled];

  return [...results]
    .filter((race) => OFFICIAL_RESULTS.has(race.status.toUpperCase()) || race.resultOfficial)
    .sort((a, b) => timestamp(b.raceDateTime, 0) - timestamp(a.raceDateTime, 0));
}

export function selectNextToPost(upcoming: RaceSummary[], results: RaceSummary[], now = new Date()) {
  return rankRacesToPost(upcoming, results, now)[0] ?? null;
}

export function groupAgendaRaces(races: RaceSummary[], now = new Date()): RaceGroup[] {
  const today = dateKey(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = dateKey(tomorrowDate);
  const weekLimit = new Date(now);
  weekLimit.setDate(weekLimit.getDate() + 7);

  const groups = new Map<string, RaceGroup>();
  const push = (key: string, label: string, race: RaceSummary) => {
    if (!groups.has(key)) groups.set(key, { key, label, races: [] });
    groups.get(key)!.races.push(race);
  };

  for (const race of [...races].sort((a, b) => timestamp(a.raceDateTime) - timestamp(b.raceDateTime))) {
    const date = validDate(race.raceDateTime);
    if (!date) {
      push("later", "Later", race);
    } else if (LIVE_RACES.has(race.status.toUpperCase())) {
      push("live", "Live Now", race);
    } else if (dateKey(date) === today) {
      push("today", "Today", race);
    } else if (dateKey(date) === tomorrow) {
      push("tomorrow", "Tomorrow", race);
    } else if (date <= weekLimit) {
      push("week", "This Week", race);
    } else if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
      push("month", "Later This Month", race);
    } else {
      push(monthKey(date), monthLabel(date), race);
    }
  }
  return [...groups.values()];
}

export function groupRacesByTimeSlot(races: RaceSummary[]): RaceGroup[] {
  const groups = new Map<string, RaceGroup>();
  for (const race of [...races].sort((a, b) => timestamp(a.raceDateTime) - timestamp(b.raceDateTime))) {
    const hour = validDate(race.raceDateTime)?.getHours() ?? 12;
    const key = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    const label = key[0].toUpperCase() + key.slice(1);
    if (!groups.has(key)) groups.set(key, { key, label, races: [] });
    groups.get(key)!.races.push(race);
  }
  return [...groups.values()];
}

export function racesByDay(races: RaceSummary[]) {
  const days = new Map<string, RaceSummary[]>();
  for (const race of races) {
    const date = validDate(race.raceDateTime);
    if (!date) continue;
    const key = dateKey(date);
    days.set(key, [...(days.get(key) ?? []), race]);
  }
  return days;
}
