import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Clock3, List, Search, Trophy, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { getPublicRaceHighlight, getPublicRaceLiveStream } from "../../api/raceMediaApi";
import { searchPublicRaces, searchPublicTournaments } from "../../api/racingApi";
import heroImage from "../../assets/slide.jpg";
import { ClientFooter } from "../../components/client/ClientFooter";
import { ClientHeader } from "../../components/client/ClientHeader";
import { Countdown } from "../../components/client/Countdown";
import { GoldRule, MotionReveal } from "../../components/client/primitives";
import { YouTubeEmbed } from "../../components/race-media/YouTubeEmbed";
import { useClientSession } from "../../hooks/useClientSession";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { usePublicQuery } from "../../hooks/usePublicQuery";
import type { PageResponse, RaceMediaPublicResponse, RaceSummary } from "../../types/racing";
import { formatDateInput, formatDistance, formatPostTime, raceStatus } from "./publicRacingData";
import { parseRaceDiscoveryQuery, racesByDay, rankRacesToPost, selectRacePulse, type RacePulseSelection } from "./racingDiscovery";
import { PublicPagination } from "./components/PublicPagination";
import { RaceAgenda } from "./components/RaceAgenda";
import { RaceCalendar } from "./components/RaceCalendar";
import { RaceDayPanel } from "./components/RaceDayPanel";
import { SegmentedControl } from "./components/SegmentedControl";
import { StatusPill } from "./components/StatusPill";

const EMPTY_RACES: PageResponse<RaceSummary> = { content: [], number: 0, size: 20, totalElements: 0, totalPages: 0 };
const CALENDAR_BOUND = 100;

const RACE_SCOPE_OPTIONS = [
  { value: "UPCOMING", label: "Upcoming", icon: <Clock3 size={14} aria-hidden="true" /> },
  { value: "RESULTS", label: "Results", icon: <Trophy size={14} aria-hidden="true" /> },
] as const;

const RACE_VIEW_OPTIONS = [
  { value: "agenda", label: "Agenda", icon: <List size={14} aria-hidden="true" /> },
  { value: "calendar", label: "Calendar", icon: <CalendarDays size={14} aria-hidden="true" /> },
] as const;

function monthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const end = new Date(year, monthNumber, 0);
  return {
    from: `${month}-01`,
    to: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
  };
}

function RacePulse({
  selection,
  highlight,
  liveStream,
  mediaLoading,
  nextRace,
  authenticated,
}: {
  selection: RacePulseSelection | null;
  highlight: RaceMediaPublicResponse | null;
  liveStream: RaceMediaPublicResponse | null;
  mediaLoading: boolean;
  nextRace: RaceSummary | null;
  authenticated: boolean;
}) {
  if (!selection) {
    return (
      <div className="border border-gold-400/40 bg-turf-950 px-7 py-9">
        <h3 className="font-display text-3xl font-light">No race is on the card right now.</h3>
        <p className="mt-3 text-ivory-dim">Check back when the next programme is published.</p>
      </div>
    );
  }

  const { mode, race } = selection;
  const status = raceStatus(race.status);
  const live = mode === "LIVE";
  const latestResult = mode === "LATEST_RESULT";
  const media = live ? liveStream : highlight;
  const mediaTitle = media?.title || media?.providerTitle || race.name + (live ? " live stream" : " highlight");
  const label = live ? "Live now" : latestResult ? "Latest official result" : "Next on the programme";
  const statusLabel = live ? "Live now" : latestResult ? "Official result" : status.label;
  const raceAction = latestResult && race.resultOfficial ? "View full result" : "View race card";
  const nextAction = race.predictionOpen ? "Make prediction" : null;

  return (
    <article className="relative overflow-hidden border border-gold-400/30 bg-turf-950">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_65%)]" />
      <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(440px,520px)]">
        <div className="p-7 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow text-gold-300">{label}</p>
            <StatusPill tone={live ? "live" : latestResult ? "done" : status.tone} label={statusLabel} />
          </div>
          <p className="mt-6 font-data text-[10px] uppercase tracking-[0.22em] text-ivory-faint">{race.tournamentName}</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-light leading-[0.98] tracking-tight text-ivory md:text-5xl">{race.name}</h2>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ivory-dim">
            <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-gold-400" /> {formatPostTime(race.raceDateTime)}</span>
            {formatDistance(race.distanceMeters) ? <span>{formatDistance(race.distanceMeters)}</span> : null}
            <span className="inline-flex items-center gap-2"><Users size={15} className="text-gold-400" /> {race.participantCount} runners</span>
          </div>
          {latestResult && race.winner ? <p className="mt-6 text-sm text-ivory-dim">Winner <strong className="font-display text-xl font-medium text-gold-200">{race.winner.horseName}</strong></p> : null}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to={"/races/" + race.id} className="inline-flex min-h-11 items-center gap-2 bg-gold-400 px-5 text-xs font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-gold-300">
              {raceAction} <ArrowRight size={14} />
            </Link>
            {!latestResult && nextAction ? (
              <Link to={authenticated ? "/spectator/predictions?raceId=" + race.id : "/login"} className="inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-ivory-dim transition-colors hover:text-gold-200">
                {nextAction} <ArrowRight size={14} />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/10 lg:border-l lg:border-t-0">
          {mediaLoading ? (
            <div className="aspect-video animate-pulse bg-white/[0.04]" aria-label={live ? "Loading live coverage" : "Loading latest highlight"} />
          ) : media ? (
            <YouTubeEmbed embedUrl={media.embedUrl} title={mediaTitle} thumbnailUrl={media.thumbnailUrl} playLabel={live ? "Watch live" : "Watch highlight"} live={live} mute={live} />
          ) : latestResult ? (
            <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12),transparent_65%)] px-8 text-center">
              <div>
                <Trophy size={28} className="mx-auto text-gold-400/70" aria-hidden="true" />
                <p className="mt-4 text-sm leading-6 text-ivory-dim">The official result is ready. The replay will appear when it is published.</p>
              </div>
            </div>
          ) : live ? (
            <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12),transparent_65%)] px-8 text-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-nyraRed/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-200"><span className="live-pulse h-2 w-2 rounded-full bg-nyraRed" aria-hidden="true" /> Live now</span>
                <p className="mt-4 text-sm leading-6 text-ivory-dim">Live coverage is not available yet. Follow the race card for official updates.</p>
              </div>
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center px-8 text-center">
              <p className="font-data text-[10px] uppercase tracking-[0.22em] text-ivory-faint">Countdown to post</p>
              <div className="mt-5"><Countdown target={race.raceDateTime} doneLabel="Underway" /></div>
              <p className="mt-5 text-sm text-ivory-dim">{race.location || "Track location TBA"}</p>
            </div>
          )}
          <div className="flex min-h-12 items-center justify-between gap-4 border-t border-white/10 px-6 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory-faint">
            <span>{live ? "Live coverage" : latestResult ? "Official result" : "Race programme"}</span>
            {latestResult ? <span className="text-gold-200">{race.winner?.horseName || "Result published"}</span> : null}
          </div>
        </div>
      </div>

      {nextRace && nextRace.id !== race.id ? (
        <div className="flex flex-col gap-3 border-t border-white/10 px-7 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="min-w-0">
            <p className="eyebrow text-ivory-faint">Next on the programme</p>
            <p className="mt-2 truncate font-display text-2xl text-ivory">{nextRace.name}</p>
            <p className="mt-1 text-sm text-ivory-dim">{formatPostTime(nextRace.raceDateTime)} · {nextRace.tournamentName}</p>
          </div>
          <Link to={"/races/" + nextRace.id} className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-200">
            View race card <ArrowRight size={14} />
          </Link>
        </div>
      ) : null}
    </article>
  );
}

export function RacesPage() {
  useDocumentTitle("Races | Night at the Races");
  const { isAuthenticated } = useClientSession();
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => parseRaceDiscoveryQuery(params), [params]);
  const [draftSearch, setDraftSearch] = useState(state.search);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => setDraftSearch(state.search), [state.search]);
  useEffect(() => setSelectedDay(null), [state.month, state.scope, state.view]);

  const listParams = useMemo(() => {
    const calendarRange = state.view === "calendar" ? monthRange(state.month) : null;
    return {
      scope: state.scope,
      sortBy: (state.scope === "RESULTS" ? "LATEST_RESULT" : "NEXT_RACE") as "LATEST_RESULT" | "NEXT_RACE",
      search: state.search || undefined,
      tournamentId: state.tournamentId,
      from: state.from || (state.scope === "UPCOMING" ? formatDateInput() : calendarRange?.from),
      to: state.to || calendarRange?.to,
      page: state.view === "calendar" ? 0 : state.page,
      size: state.view === "calendar" ? CALENDAR_BOUND : 20,
    };
  }, [state]);
  const listQuery = usePublicQuery(`races:list:${JSON.stringify(listParams)}`, () => searchPublicRaces(listParams));
  const heroUpcomingQuery = usePublicQuery("races:hero:upcoming", () =>
    searchPublicRaces({ scope: "UPCOMING", sortBy: "NEXT_RACE", from: formatDateInput(), page: 0, size: 3 }),
  );
  const heroResultsQuery = usePublicQuery("races:hero:results", () =>
    searchPublicRaces({ scope: "RESULTS", sortBy: "LATEST_RESULT", page: 0, size: 3 }),
  );
  const tournamentsQuery = usePublicQuery("tournaments:filter-options", () =>
    searchPublicTournaments({ page: 0, size: 48, sortBy: "ONGOING_FIRST" }),
  );

  const pageData = listQuery.data ?? EMPTY_RACES;
  const heroUpcoming = heroUpcomingQuery.data?.content ?? [];
  const heroResults = heroResultsQuery.data?.content ?? [];
  const tournaments = tournamentsQuery.data?.content ?? [];
  const pulseSelection = selectRacePulse(heroUpcoming, heroResults);
  const nextRace = rankRacesToPost(heroUpcoming, []).find((race) => race.id !== pulseSelection?.race.id) ?? null;
  const latestResult = pulseSelection?.mode === "LATEST_RESULT" ? pulseSelection.race : null;
  const liveRace = pulseSelection?.mode === "LIVE" ? pulseSelection.race : null;
  const latestHighlightQuery = usePublicQuery(
    `races:hero:highlight:${latestResult?.id ?? "none"}`,
    () => latestResult ? getPublicRaceHighlight(latestResult.id) : Promise.resolve(null),
  );
  const liveStreamQuery = usePublicQuery(
    `races:hero:live:${liveRace?.id ?? "none"}`,
    () => liveRace ? getPublicRaceLiveStream(liveRace.id) : Promise.resolve(null),
  );
  const heroLoading = heroUpcomingQuery.loading || heroResultsQuery.loading;
  const heroMediaLoading = pulseSelection?.mode === "LIVE" ? liveStreamQuery.loading : pulseSelection?.mode === "LATEST_RESULT" ? latestHighlightQuery.loading : false;
  const heroFailed =
    (heroUpcomingQuery.error && !heroUpcomingQuery.data) || (heroResultsQuery.error && !heroResultsQuery.data);

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    setParams(next);
  };
  // Cùng lý do với ChampionshipsPage: các ô lọc khác áp dụng ngay, riêng search bắt
  // bấm nút thì người dùng gõ xong tưởng trang hỏng. Cho search chạy trễ 350ms.
  useEffect(() => {
    if (draftSearch === state.search) return;
    const timer = setTimeout(() => updateParams({ search: draftSearch, page: 0 }), 350);
    return () => clearTimeout(timer);
    // updateParams đọc `params` mới nhất mỗi lần chạy nên không cần vào deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftSearch, state.search]);

  const activeFilterCount = [state.search, state.tournamentId, state.from, state.to].filter(Boolean).length;
  const selectedRaces = selectedDay ? racesByDay(pageData.content).get(selectedDay) ?? [] : [];

  return (
    <div className="client-theme min-h-screen bg-turf-950 text-ivory">
      <ClientHeader />
      <main>
        {/* Masthead gọn: hero cũ cao gần hết màn hình mà không mang tin gì, đẩy race
            kế tiếp — thứ khán giả vào đây để tìm — xuống dưới nếp gấp. */}
        <section className="grain relative isolate overflow-hidden border-b border-white/10 bg-turf-900">
          <img src={heroImage} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-20" />
          <div className="turf-vignette absolute inset-0 -z-10" />
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-x-8 gap-y-4 px-6 py-7 md:px-12">
            <div>
              <h1 className="font-display text-4xl font-light tracking-tight md:text-5xl">Races<span className="text-foil">.</span></h1>
              <p className="mt-2 max-w-xl text-ivory-dim">Watch the latest race, check the official result, and follow what comes next.</p>
            </div>
            <p role="status" aria-live="polite" className="font-data text-xs uppercase tracking-[0.18em] text-ivory-faint">
              {pageData.totalElements} races
            </p>
          </div>
        </section>

        <section className="border-b border-white/8 bg-turf-900 pb-9 pt-6" aria-labelledby="race-pulse-title">
          <div className="mx-auto max-w-[1400px] px-6 md:px-12">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="race-pulse-title" className="eyebrow text-gold-300">Race pulse</h2>
              <Link to="/races?scope=RESULTS" className="inline-flex min-h-11 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:text-gold-200">
                Browse all results <ArrowRight size={14} />
              </Link>
            </div>

            {heroLoading ? (
              <div className="h-[28rem] animate-pulse border border-white/10 bg-turf-950" aria-label="Loading race pulse" />
            ) : heroFailed ? (
              <div role="alert" className="border border-nyraRed/50 bg-turf-950 px-7 py-9"><h3 className="font-display text-3xl font-light">The race desk could not be loaded.</h3><p className="mt-3 text-ivory-dim">Check your connection and try again in a moment.</p></div>
            ) : (
              <RacePulse
                selection={pulseSelection}
                highlight={latestHighlightQuery.data ?? null}
                liveStream={liveStreamQuery.data ?? null}
                mediaLoading={heroMediaLoading}
                nextRace={nextRace}
                authenticated={isAuthenticated}
              />
            )}
          </div>
        </section>

        <section className="bg-turf-950 pb-24" aria-labelledby="programme-title">
          <div className="border-y border-white/10 bg-turf-950/95 backdrop-blur-xl lg:sticky lg:top-[var(--client-header-h)] lg:z-30">
            <div className="mx-auto max-w-[1400px] px-6 py-4 md:px-12">
              <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
                <div>
                  <p className="mb-2 font-data text-[9px] uppercase tracking-[0.18em] text-ivory-faint">Programme</p>
                  <SegmentedControl
                    label="Race programme scope"
                    value={state.scope}
                    options={RACE_SCOPE_OPTIONS}
                    onChange={(scope) => updateParams({ scope, page: 0 })}
                    className="grid-cols-2"
                  />
                </div>

                <details className="group min-w-0">
                  <summary className="ml-auto flex min-h-11 w-fit cursor-pointer list-none items-center gap-3 rounded-lg border border-white/15 bg-turf-900 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-200 [&::-webkit-details-marker]:hidden">
                    <Search size={15} aria-hidden="true" />
                    Filters
                    {activeFilterCount > 0 ? <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-400 px-1.5 font-data text-[10px] text-turf-950">{activeFilterCount}</span> : null}
                  </summary>
                  <form
                    className="mt-3 grid min-w-0 gap-3 border-t border-white/8 pt-4 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_240px_160px_160px_auto]"
                    onSubmit={(event) => { event.preventDefault(); updateParams({ search: draftSearch, page: 0 }); }}
                  >
                    <label className="relative sm:col-span-2 xl:col-span-1"><span className="sr-only">Search races</span><Search size={16} className="pointer-events-none absolute left-4 top-3.5 text-ivory-dim" /><input type="search" aria-label="Search races" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Search race or venue" className="h-11 w-full rounded-lg border border-white/15 bg-turf-900 pl-11 pr-4 text-sm text-ivory outline-none placeholder:text-ivory-dim focus:border-gold-400/70" /></label>
                    <select aria-label="Championship filter" value={state.tournamentId ?? ""} onChange={(event) => updateParams({ tournamentId: event.target.value, page: 0 })} className="h-11 rounded-lg border border-white/15 bg-turf-900 px-3 text-sm text-ivory outline-none focus:border-gold-400/70"><option value="">All championships</option>{tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select>
                    <label className="relative"><span className="pointer-events-none absolute left-3 top-1 font-data text-[9px] uppercase tracking-[0.15em] text-ivory-dim">From</span><input aria-label="From date" type="date" value={state.from ?? ""} onChange={(event) => updateParams({ from: event.target.value, page: 0 })} className="h-11 w-full rounded-lg border border-white/15 bg-turf-900 px-3 pt-3 text-sm text-ivory outline-none focus:border-gold-400/70" /></label>
                    <label className="relative"><span className="pointer-events-none absolute left-3 top-1 font-data text-[9px] uppercase tracking-[0.15em] text-ivory-dim">To</span><input aria-label="To date" type="date" value={state.to ?? ""} onChange={(event) => updateParams({ to: event.target.value, page: 0 })} className="h-11 w-full rounded-lg border border-white/15 bg-turf-900 px-3 pt-3 text-sm text-ivory outline-none focus:border-gold-400/70" /></label>
                    {activeFilterCount > 0 ? <button type="button" onClick={() => { setDraftSearch(""); updateParams({ search: "", tournamentId: "", from: "", to: "", page: 0 }); }} className="inline-flex min-h-11 items-center justify-center px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ivory-dim transition-colors hover:text-gold-200">Clear</button> : null}
                  </form>
                </details>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-[1400px] px-6 pt-12 md:px-12">
            <MotionReveal className="mb-10 flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="eyebrow text-gold-300">Race programme</p><h2 id="programme-title" className="mt-3 font-display text-4xl font-light tracking-tight">{state.scope === "UPCOMING" ? "Next races." : "Official results."}</h2><GoldRule className="mt-5 w-20" /></div>
              <div className="w-full sm:w-[260px]">
                <p className="mb-2 font-data text-[9px] uppercase tracking-[0.18em] text-ivory-faint">View</p>
                <SegmentedControl
                  label="Race programme layout"
                  value={state.view}
                  options={RACE_VIEW_OPTIONS}
                  onChange={(view) => updateParams({ view, page: 0 })}
                  accent="neutral"
                  className="grid-cols-2"
                />
              </div>
            </MotionReveal>
            {listQuery.loading ? <div className="space-y-4" aria-label="Loading race programme">{[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse border-t border-white/10 bg-white/[0.02]" />)}</div> : listQuery.error && !listQuery.data ? (
              <div role="alert" className="border border-nyraRed/50 bg-turf-900 px-6 py-7"><p className="text-rose-300">Could not load the race programme right now.</p><button type="button" onClick={listQuery.retry} className="mt-5 inline-flex min-h-11 items-center border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60">Try again</button></div>
            ) : pageData.content.length === 0 ? <div className="border border-gold-400/40 bg-turf-900 px-7 py-9"><h3 className="font-display text-3xl font-light">{state.scope === "UPCOMING" ? "No upcoming races match this view." : "No results match this view."}</h3><p className="mt-3 text-ivory-dim">Adjust the filters or explore another championship.</p></div> : (
              <div aria-busy={listQuery.fetching} className={`transition-opacity duration-300 ${listQuery.fetching ? "opacity-50" : "opacity-100"}`}>
                {state.view === "calendar" && pageData.totalElements > CALENDAR_BOUND ? (
                  <p className="mb-6 border border-gold-400/30 bg-turf-900 px-5 py-4 text-sm text-ivory-dim">
                    This month has {pageData.totalElements} races — the calendar shows the first {CALENDAR_BOUND}.{" "}
                    <button type="button" onClick={() => updateParams({ view: "agenda", page: 0 })} className="font-bold uppercase tracking-[0.12em] text-gold-300 underline-offset-4 hover:underline">Browse all in the agenda</button>
                  </p>
                ) : null}
                {state.view === "calendar" ? <RaceCalendar races={pageData.content} month={state.month} onMonthChange={(month) => updateParams({ month, page: 0 })} onSelectDay={setSelectedDay} /> : <RaceAgenda races={pageData.content} results={state.scope === "RESULTS"} />}
              </div>
            )}
            {state.view === "agenda" ? <PublicPagination page={pageData.number} totalPages={pageData.totalPages} onChange={(page) => updateParams({ page })} /> : null}
          </div>
        </section>
      </main>
      {selectedDay ? <RaceDayPanel day={selectedDay} races={selectedRaces} onClose={() => setSelectedDay(null)} /> : null}
      <ClientFooter />
    </div>
  );
}
