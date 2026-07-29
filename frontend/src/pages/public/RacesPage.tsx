import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Clock3, List, Search, Trophy, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { searchPublicRaces, searchPublicTournaments } from "../../api/racingApi";
import heroImage from "../../assets/slide.jpg";
import { BannerCarousel } from "../../components/client/BannerCarousel";
import { ClientFooter } from "../../components/client/ClientFooter";
import { ClientHeader } from "../../components/client/ClientHeader";
import { Countdown } from "../../components/client/Countdown";
import { GoldRule, MotionReveal } from "../../components/client/primitives";
import { useClientSession } from "../../hooks/useClientSession";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { usePublicQuery } from "../../hooks/usePublicQuery";
import type { PageResponse, RaceSummary } from "../../types/racing";
import { formatDistance, formatPostTime, raceStatus } from "./publicRacingData";
import { parseRaceDiscoveryQuery, racesByDay, rankRacesToPost } from "./racingDiscovery";
import { PublicPagination } from "./components/PublicPagination";
import { RaceAgenda } from "./components/RaceAgenda";
import { RaceCalendar } from "./components/RaceCalendar";
import { RaceDayPanel } from "./components/RaceDayPanel";
import { StatusPill } from "./components/StatusPill";

const EMPTY_RACES: PageResponse<RaceSummary> = { content: [], number: 0, size: 20, totalElements: 0, totalPages: 0 };
const CALENDAR_BOUND = 100;

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
          <h2 className="mt-3 font-display text-4xl font-light leading-[1] tracking-tight text-ivory md:text-6xl">{race.name}</h2>
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
      from: state.from || calendarRange?.from,
      to: state.to || calendarRange?.to,
      page: state.view === "calendar" ? 0 : state.page,
      size: state.view === "calendar" ? CALENDAR_BOUND : 20,
    };
  }, [state]);
  const listQuery = usePublicQuery(`races:list:${JSON.stringify(listParams)}`, () => searchPublicRaces(listParams));
  const heroUpcomingQuery = usePublicQuery("races:hero:upcoming", () =>
    searchPublicRaces({ scope: "UPCOMING", sortBy: "NEXT_RACE", page: 0, size: 3 }),
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

  // Tối đa 5 race để lật, không chỉ một. `latestResult` xét theo từng race vì khi
  // hết race sắp chạy thì danh sách rơi về kết quả vừa công bố.
  const featuredRaces = rankRacesToPost(heroUpcoming, heroResults).slice(0, 5);
  const isLatestResult = (race: RaceSummary) => heroUpcoming.every((upcomingRace) => upcomingRace.id !== race.id);
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
        <section className="bg-turf-900 pb-14 pt-6 md:pb-16" aria-labelledby="next-post-title">
          <div className="mx-auto max-w-[1400px] px-6 md:px-12">
            <h2 id="next-post-title" className="sr-only">Next to post</h2>
            {heroLoading ? <div className="h-80 animate-pulse border border-white/10 bg-turf-950" aria-label="Loading next to post" /> : featuredRaces.length > 0 ? (
              <BannerCarousel
                label="Races in focus"
                slides={featuredRaces.map((race) => ({
                  key: race.id,
                  node: <NextToPost race={race} latestResult={isLatestResult(race)} authenticated={isAuthenticated} />,
                }))}
              />
            ) : heroFailed ? (
              <div role="alert" className="border border-nyraRed/50 bg-turf-950 px-7 py-9"><h3 className="font-display text-3xl font-light">The next race could not be loaded.</h3><p className="mt-3 text-ivory-dim">Check your connection and try again in a moment.</p></div>
            ) : (
              <div className="border border-gold-400/40 bg-turf-950 px-7 py-9"><h3 className="font-display text-3xl font-light">No race is on the card right now.</h3><p className="mt-3 text-ivory-dim">Check back when the next programme is published.</p></div>
            )}
          </div>
        </section>

        <section className="bg-turf-950 pb-24" aria-labelledby="programme-title">
          <div className="sticky top-[var(--client-header-h)] z-30 border-y border-white/10 bg-turf-950/95 backdrop-blur-xl">
            <div className="mx-auto max-w-[1400px] px-6 py-4 md:px-12">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex border border-white/15">
                  {(["UPCOMING", "RESULTS"] as const).map((scope) => <button key={scope} type="button" onClick={() => updateParams({ scope, page: 0 })} className={`min-h-11 px-5 text-xs font-bold uppercase tracking-[0.14em] ${state.scope === scope ? "bg-gold-400 text-turf-950" : "text-ivory-dim hover:text-ivory"}`}>{scope === "UPCOMING" ? "Upcoming" : "Results"}</button>)}
                </div>
                <div className="flex border border-white/15">
                  <button type="button" aria-label="Agenda" onClick={() => updateParams({ view: "agenda", page: 0 })} className={`inline-flex min-h-11 items-center gap-2 px-4 text-xs font-bold uppercase tracking-[0.14em] ${state.view === "agenda" ? "bg-emerald-glow text-turf-950" : "text-ivory-dim"}`}><List size={15} /> Agenda</button>
                  <button type="button" aria-label="Calendar" onClick={() => updateParams({ view: "calendar", page: 0 })} className={`inline-flex min-h-11 items-center gap-2 px-4 text-xs font-bold uppercase tracking-[0.14em] ${state.view === "calendar" ? "bg-emerald-glow text-turf-950" : "text-ivory-dim"}`}><CalendarDays size={15} /> Calendar</button>
                </div>
              </div>
              <form className="mt-3 grid gap-3 md:grid-cols-[1fr_250px_160px_160px_auto]" onSubmit={(event) => { event.preventDefault(); updateParams({ search: draftSearch, page: 0 }); }}>
                <label className="relative"><span className="sr-only">Search races</span><Search size={16} className="pointer-events-none absolute left-4 top-3.5 text-ivory-faint" /><input type="search" aria-label="Search races" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Search races..." className="h-11 w-full border border-white/15 bg-turf-900 pl-11 pr-4 text-sm text-ivory outline-none placeholder:text-ivory-faint focus:border-gold-400/70" /></label>
                <select aria-label="Championship filter" value={state.tournamentId ?? ""} onChange={(event) => updateParams({ tournamentId: event.target.value, page: 0 })} className="h-11 border border-white/15 bg-turf-900 px-3 text-sm text-ivory outline-none focus:border-gold-400/70"><option value="">All championships</option>{tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select>
                <input aria-label="From date" type="date" value={state.from ?? ""} onChange={(event) => updateParams({ from: event.target.value, page: 0 })} className="h-11 border border-white/15 bg-turf-900 px-3 text-sm text-ivory outline-none focus:border-gold-400/70" />
                <input aria-label="To date" type="date" value={state.to ?? ""} onChange={(event) => updateParams({ to: event.target.value, page: 0 })} className="h-11 border border-white/15 bg-turf-900 px-3 text-sm text-ivory outline-none focus:border-gold-400/70" />
              </form>
            </div>
          </div>

          <div className="mx-auto max-w-[1400px] px-6 pt-12 md:px-12">
            <MotionReveal className="mb-10 flex items-end justify-between gap-5 border-b border-white/10 pb-6">
              <div><h2 id="programme-title" className="font-display text-4xl font-light tracking-tight">{state.scope === "UPCOMING" ? "The next race days." : "Official record & review."}</h2><GoldRule className="mt-5 w-20" /></div>
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
