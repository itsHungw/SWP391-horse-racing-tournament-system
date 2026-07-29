import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Clock3, List, Search, Trophy, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { getPublicRaceHighlight } from "../../api/raceMediaApi";
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
import { parseRaceDiscoveryQuery, racesByDay, rankRacesToPost } from "./racingDiscovery";
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

function NextToPost({
  race,
  latestResult,
  authenticated,
}: {
  race: RaceSummary;
  latestResult: boolean;
  authenticated: boolean;
}) {
  const status = raceStatus(race.status);
  return (
    <article className="relative overflow-hidden border border-gold-400/30 bg-turf-950 p-7 md:p-10">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_65%)]" />
      <div className="relative grid gap-9 lg:grid-cols-[1fr_330px] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <p className="eyebrow text-gold-300">{latestResult ? "Latest Result" : "Next To Post"}</p>
            <StatusPill tone={status.tone} label={latestResult ? (race.resultOfficial ? "Official Result Published" : "Awaiting Official Result") : status.label} />
          </div>
          <p className="mt-6 font-data text-[10px] uppercase tracking-[0.22em] text-ivory-faint">{race.tournamentName}</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-light leading-[0.98] tracking-tight text-ivory md:text-5xl lg:text-[4rem]">{race.name}</h2>
          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-sm text-ivory-dim">
            <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-gold-400" /> {formatPostTime(race.raceDateTime)}</span>
            <span>{formatDistance(race.distanceMeters)}</span>
            <span className="inline-flex items-center gap-2"><Users size={15} className="text-gold-400" /> {race.participantCount} runners</span>
          </div>
          {latestResult && race.winner ? <p className="mt-6 text-sm text-ivory-dim">Winner <strong className="font-display text-xl font-medium text-gold-200">{race.winner.horseName}</strong></p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {!latestResult && race.predictionOpen ? (
              <Link to={authenticated ? `/spectator/predictions?raceId=${race.id}` : "/login"} className="inline-flex min-h-11 items-center gap-2 bg-emerald-glow px-5 text-xs font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-emerald-soft">
                {authenticated ? "Make Prediction" : "Login to Predict"} <ArrowRight size={14} />
              </Link>
            ) : null}
            <Link to={`/races/${race.id}`} className="inline-flex min-h-11 items-center gap-2 bg-gold-400 px-5 text-xs font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-gold-300">
              {latestResult && race.resultOfficial ? "View Full Result" : "View Race Card"} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="border-l border-white/10 pl-7">
          {latestResult ? (
            <><Trophy size={28} className="text-gold-400/70" /><p className="mt-4 text-sm leading-relaxed text-ivory-dim">{race.resultOfficial ? "The official finish order is available on the race card." : "Results are being reviewed before publication."}</p></>
          ) : (
            <><p className="font-data text-[10px] uppercase tracking-[0.22em] text-ivory-faint">Countdown to post</p><div className="mt-5"><Countdown target={race.raceDateTime} doneLabel="Underway" /></div><p className="mt-5 text-sm text-ivory-dim">{race.location || "Track location TBA"}</p></>
          )}
        </div>
      </div>
    </article>
  );
}


function LatestReplayCard({
  race,
  highlight,
  loading,
}: {
  race: RaceSummary;
  highlight: RaceMediaPublicResponse | null;
  loading: boolean;
}) {
  const title = highlight?.title || highlight?.providerTitle || `${race.name} highlight`;
  return (
    <article className="overflow-hidden border border-white/12 bg-turf-950">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow text-gold-300">Latest replay</p>
          <StatusPill tone="done" label={race.resultOfficial ? "Official" : "Under review"} />
        </div>
        <p className="mt-4 font-data text-[10px] uppercase tracking-[0.2em] text-ivory-faint">{race.tournamentName}</p>
        <h3 className="mt-2 text-balance font-display text-2xl font-medium leading-tight text-ivory">{race.name}</h3>
        {race.winner ? <p className="mt-3 text-sm text-ivory-dim">Winner <strong className="text-gold-200">{race.winner.horseName}</strong></p> : null}
      </div>
      {loading ? (
        <div className="aspect-video animate-pulse bg-white/[0.04]" aria-label="Loading latest replay" />
      ) : highlight ? (
        <YouTubeEmbed embedUrl={highlight.embedUrl} title={title} thumbnailUrl={highlight.thumbnailUrl} playLabel="Play replay" />
      ) : (
        <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12),transparent_65%)] px-8 text-center">
          <div>
            <Trophy size={28} className="mx-auto text-gold-400/70" aria-hidden="true" />
            <p className="mt-4 text-sm leading-6 text-ivory-dim">The finish order is ready. Video will appear here when the official replay is published.</p>
          </div>
        </div>
      )}
      <Link to={`/races/${race.id}`} className="group flex min-h-12 items-center justify-between border-t border-white/10 px-6 text-[11px] font-bold uppercase tracking-[0.16em] text-ivory transition-colors hover:text-gold-200">
        View full result
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </Link>
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
  const nextRace = rankRacesToPost(heroUpcoming, [])[0] ?? heroResults[0] ?? null;
  const latestResult = heroResults[0] ?? null;
  const latestHighlightQuery = usePublicQuery(
    `races:hero:highlight:${latestResult?.id ?? "none"}`,
    () => latestResult ? getPublicRaceHighlight(latestResult.id) : Promise.resolve(null),
  );
  const heroLoading = heroUpcomingQuery.loading || heroResultsQuery.loading;
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
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-x-8 gap-y-4 px-6 py-9 md:px-12">
            <div>
              <h1 className="font-display text-4xl font-light tracking-tight md:text-5xl">Races<span className="text-foil">.</span></h1>
              <p className="mt-2 max-w-xl text-ivory-dim">Find the next post, make your prediction, or revisit the official finish order.</p>
            </div>
            <p role="status" aria-live="polite" className="font-data text-xs uppercase tracking-[0.18em] text-ivory-faint">
              {pageData.totalElements} races
            </p>
          </div>
        </section>

        {/* Race kế tiếp là nội dung đầu tiên có thể hành động — đặt cược. */}
        <section className="border-b border-white/8 bg-turf-900 pb-14 pt-8 md:pb-16 md:pt-10" aria-labelledby="next-post-title">
          <div className="mx-auto max-w-[1400px] px-6 md:px-12">
            <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow text-gold-300">Race-day priority</p>
                <h2 id="next-post-title" className="mt-3 font-display text-3xl font-light tracking-tight md:text-4xl">What matters now.</h2>
              </div>
              <Link to="/races?scope=RESULTS" className="inline-flex min-h-11 items-center gap-2 self-start text-[11px] font-bold uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:text-gold-200 sm:self-auto">
                Browse all results <ArrowRight size={14} />
              </Link>
            </div>

            {heroLoading ? (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]" aria-label="Loading race-day priority">
                <div className="h-80 animate-pulse border border-white/10 bg-turf-950" />
                <div className="h-80 animate-pulse border border-white/10 bg-turf-950" />
              </div>
            ) : nextRace ? (
              <div className={`grid gap-5 ${latestResult && nextRace.id !== latestResult.id ? "lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]" : ""}`}>
                <NextToPost
                  race={nextRace}
                  latestResult={heroUpcoming.every((upcomingRace) => upcomingRace.id !== nextRace.id)}
                  authenticated={isAuthenticated}
                />
                {latestResult && nextRace.id !== latestResult.id ? (
                  <LatestReplayCard
                    race={latestResult}
                    highlight={latestHighlightQuery.data}
                    loading={latestHighlightQuery.loading}
                  />
                ) : null}
              </div>
            ) : heroFailed ? (
              <div role="alert" className="border border-nyraRed/50 bg-turf-950 px-7 py-9"><h3 className="font-display text-3xl font-light">The race desk could not be loaded.</h3><p className="mt-3 text-ivory-dim">Check your connection and try again in a moment.</p></div>
            ) : (
              <div className="border border-gold-400/40 bg-turf-950 px-7 py-9"><h3 className="font-display text-3xl font-light">No race is on the card right now.</h3><p className="mt-3 text-ivory-dim">Check back when the next programme is published.</p></div>
            )}
          </div>
        </section>

        <section className="bg-turf-950 pb-24" aria-labelledby="programme-title">
          <div className="border-y border-white/10 bg-turf-950/95 backdrop-blur-xl lg:sticky lg:top-[var(--client-header-h)] lg:z-30">
            <div className="mx-auto max-w-[1400px] px-6 py-4 md:px-12">
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:max-w-[760px]">
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
                  <div>
                    <p className="mb-2 font-data text-[9px] uppercase tracking-[0.18em] text-ivory-faint">Display</p>
                    <SegmentedControl
                      label="Race programme layout"
                      value={state.view}
                      options={RACE_VIEW_OPTIONS}
                      onChange={(view) => updateParams({ view, page: 0 })}
                      accent="emerald"
                      className="grid-cols-2"
                    />
                  </div>
                </div>

                <form
                  className="grid min-w-0 gap-3 border-t border-white/8 pt-4 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_240px_160px_160px]"
                  onSubmit={(event) => { event.preventDefault(); updateParams({ search: draftSearch, page: 0 }); }}
                >
                  <label className="relative sm:col-span-2 xl:col-span-1"><span className="sr-only">Search races</span><Search size={16} className="pointer-events-none absolute left-4 top-3.5 text-ivory-dim" /><input type="search" aria-label="Search races" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Search race or venue" className="h-11 w-full rounded-lg border border-white/15 bg-turf-900 pl-11 pr-4 text-sm text-ivory outline-none placeholder:text-ivory-dim focus:border-gold-400/70" /></label>
                  <select aria-label="Championship filter" value={state.tournamentId ?? ""} onChange={(event) => updateParams({ tournamentId: event.target.value, page: 0 })} className="h-11 rounded-lg border border-white/15 bg-turf-900 px-3 text-sm text-ivory outline-none focus:border-gold-400/70"><option value="">All championships</option>{tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select>
                  <label className="relative"><span className="pointer-events-none absolute left-3 top-1 font-data text-[9px] uppercase tracking-[0.15em] text-ivory-dim">From</span><input aria-label="From date" type="date" value={state.from ?? ""} onChange={(event) => updateParams({ from: event.target.value, page: 0 })} className="h-11 w-full rounded-lg border border-white/15 bg-turf-900 px-3 pt-3 text-sm text-ivory outline-none focus:border-gold-400/70" /></label>
                  <label className="relative"><span className="pointer-events-none absolute left-3 top-1 font-data text-[9px] uppercase tracking-[0.15em] text-ivory-dim">To</span><input aria-label="To date" type="date" value={state.to ?? ""} onChange={(event) => updateParams({ to: event.target.value, page: 0 })} className="h-11 w-full rounded-lg border border-white/15 bg-turf-900 px-3 pt-3 text-sm text-ivory outline-none focus:border-gold-400/70" /></label>
                </form>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-[1400px] px-6 pt-12 md:px-12">
            <MotionReveal className="mb-10 flex items-end justify-between gap-5 border-b border-white/10 pb-6">
              <div><p className="eyebrow text-gold-300">Race programme</p><h2 id="programme-title" className="mt-3 font-display text-4xl font-light tracking-tight">{state.scope === "UPCOMING" ? "Upcoming cards." : "Official results."}</h2><GoldRule className="mt-5 w-20" /></div>
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
