import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Flag, MapPin, Search, Trophy, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { searchPublicTournaments } from "../../api/racingApi";
import { ClientFooter } from "../../components/client/ClientFooter";
import { ClientHeader } from "../../components/client/ClientHeader";
import { Eyebrow, GoldRule, MotionReveal } from "../../components/client/primitives";
import { useClientSession } from "../../hooks/useClientSession";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { usePublicQuery } from "../../hooks/usePublicQuery";
import type { PageResponse, TournamentSummary } from "../../types/racing";
import heroImage from "../../assets/slide.jpg";
import { championshipStatus, formatDateRange, formatLongDate } from "./publicRacingData";
import { parseChampionshipDiscoveryQuery, selectChampionshipInFocus } from "./racingDiscovery";
import { PublicPagination } from "./components/PublicPagination";
import { StatusPill } from "./components/StatusPill";

const EMPTY_PAGE: PageResponse<TournamentSummary> = {
  content: [],
  number: 0,
  size: 12,
  totalElements: 0,
  totalPages: 0,
};

function FocusCard({ championship, owner }: { championship: TournamentSummary; owner: boolean }) {
  const status = championshipStatus(championship.status);
  const primary =
    championship.status === "ONGOING" && championship.nextRace
      ? { label: "View Next Race", to: `/races/${championship.nextRace.id}` }
      : championship.status === "OPEN_REGISTRATION" && owner
        ? { label: "Register Horse", to: `/owner/tournament-registrations?tournamentId=${championship.id}` }
        : championship.status === "COMPLETED"
          ? { label: "View Results", to: `/races?scope=RESULTS&tournamentId=${championship.id}` }
          : { label: "View Championship", to: `/championships/${championship.id}` };

  return (
    <article className="relative overflow-hidden border border-gold-400/25 bg-turf-950 p-7 shadow-[0_35px_100px_-50px_rgba(212,175,55,0.5)] md:p-10">
      <div className="pointer-events-none absolute right-0 top-0 h-full w-2/5 bg-[linear-gradient(135deg,transparent,rgba(212,175,55,0.06))]" />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_300px] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <StatusPill tone={status.tone} label={status.label} />
            <span className="font-data text-[10px] uppercase tracking-[0.22em] text-ivory-faint">{championship.code}</span>
          </div>
          <h2 className="mt-6 max-w-3xl font-display text-4xl font-light leading-[1] tracking-tight text-ivory md:text-6xl">
            {championship.name}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ivory-dim">
            {championship.description || "A championship programme shaped by speed, form, and the long season."}
          </p>
          <dl className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm text-ivory-dim">
            <div className="inline-flex items-center gap-2"><CalendarDays size={15} className="text-gold-400" /> {formatDateRange(championship.startDate, championship.endDate)}</div>
            {championship.location ? <div className="inline-flex items-center gap-2"><MapPin size={15} className="text-gold-400" /> {championship.location}</div> : null}
            <div className="inline-flex items-center gap-2"><Flag size={15} className="text-gold-400" /> {championship.raceCount} rounds</div>
            <div className="inline-flex items-center gap-2"><Users size={15} className="text-gold-400" /> {championship.participantCount} horses</div>
          </dl>
        </div>
        <div className="border-l border-white/10 pl-6">
          {championship.nextRace ? (
            <>
              <p className="font-data text-[10px] uppercase tracking-[0.22em] text-ivory-faint">Next Race</p>
              <p className="mt-3 font-display text-2xl font-medium text-ivory">{championship.nextRace.name}</p>
              <p className="mt-2 text-sm text-ivory-dim">{formatLongDate(championship.nextRace.raceDateTime)}</p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-ivory-dim">
              {championship.status === "COMPLETED"
                ? "The final result is now part of the season record."
                : "Race programme details will appear when the schedule is published."}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={primary.to} className="inline-flex min-h-11 items-center gap-2 bg-gold-400 px-5 text-xs font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-gold-300">
              {primary.label} <ArrowRight size={14} />
            </Link>
            {primary.to !== `/championships/${championship.id}` ? (
              <Link to={`/championships/${championship.id}`} className="inline-flex min-h-11 items-center border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60">
                Programme
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function ChampionshipRow({ championship }: { championship: TournamentSummary }) {
  const status = championshipStatus(championship.status);
  return (
    <article className="group relative border-t border-white/10 py-7 transition-colors hover:border-gold-400/40">
      <div className="absolute left-0 top-7 h-14 w-px bg-gold-400/60" />
      <div className="grid gap-5 pl-5 md:grid-cols-[1fr_220px_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={status.tone} label={status.label} />
            <span className="font-data text-[10px] uppercase tracking-[0.2em] text-ivory-faint">{championship.code}</span>
          </div>
          <h3 className="mt-3 font-display text-2xl font-medium tracking-tight text-ivory transition-colors group-hover:text-gold-200 md:text-3xl">
            {championship.name}
          </h3>
          <p className="mt-2 line-clamp-1 text-sm text-ivory-dim">
            {championship.location || "Circuit venue TBA"} · {formatDateRange(championship.startDate, championship.endDate)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 border-l border-white/10 pl-5">
          <div><p className="font-data text-xl text-ivory">{championship.raceCount}</p><p className="mt-1 text-xs text-ivory-faint">Rounds</p></div>
          <div><p className="font-data text-xl text-ivory">{championship.participantCount}</p><p className="mt-1 text-xs text-ivory-faint">Horses</p></div>
        </div>
        <Link to={`/championships/${championship.id}`} className="inline-flex min-h-11 items-center gap-2 border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-200">
          View <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

export function ChampionshipsPage() {
  useDocumentTitle("Championships | Night at the Races");
  const { session } = useClientSession();
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => parseChampionshipDiscoveryQuery(params), [params]);
  const [draftSearch, setDraftSearch] = useState(state.search);
  const owner = session?.roles.some((role) => role.toUpperCase() === "HORSE_OWNER") ?? false;

  useEffect(() => setDraftSearch(state.search), [state.search]);

  const listParams = useMemo(
    () => ({ page: state.page, size: 12, search: state.search || undefined, status: state.status || undefined, year: state.year, sortBy: state.sortBy }),
    [state],
  );
  const listQuery = usePublicQuery(`championships:list:${JSON.stringify(listParams)}`, () => searchPublicTournaments(listParams));
  const focusQuery = usePublicQuery("championships:focus", () =>
    searchPublicTournaments({ page: 0, size: 12, sortBy: "ONGOING_FIRST" }),
  );

  const pageData = listQuery.data ?? EMPTY_PAGE;
  const focusPool: TournamentSummary[] = focusQuery.data?.content ?? [];

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    setParams(next);
  };
  const focus = selectChampionshipInFocus(focusPool);

  return (
    <div className="client-theme min-h-screen bg-turf-950 text-ivory">
      <ClientHeader />
      <main>
        <section className="grain relative isolate overflow-hidden border-b border-white/10">
          <img src={heroImage} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30" />
          <div className="turf-vignette absolute inset-0 -z-10" />
          <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-12 md:py-20">
            <Eyebrow tone="gold">The Season · 2026</Eyebrow>
            <h1 className="mt-5 font-display text-5xl font-light tracking-tight md:text-7xl">Championships<span className="text-foil">.</span></h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ivory-dim">Follow the programmes shaping the season, from open registration to the final result.</p>
          </div>
        </section>

        <section className="bg-turf-900 py-16 md:py-20" aria-labelledby="focus-title">
          <div className="mx-auto max-w-[1400px] px-6 md:px-12">
            <div className="mb-7 flex items-end justify-between gap-5">
              <div><p className="eyebrow text-gold-300">In Focus</p><h2 id="focus-title" className="mt-3 font-display text-3xl font-light md:text-4xl">The championship that matters now.</h2></div>
              <Trophy size={30} className="text-gold-400/60" aria-hidden="true" />
            </div>
            {focusQuery.loading ? <div className="h-72 animate-pulse border border-white/10 bg-turf-950" aria-label="Loading focused championship" /> : focus ? <FocusCard championship={focus} owner={owner} /> : focusQuery.error ? (
              <div role="alert" className="border-l-2 border-nyraRed bg-turf-950 px-7 py-9"><h3 className="font-display text-3xl font-light">The featured championship could not be loaded.</h3><p className="mt-3 text-ivory-dim">Check your connection and try again in a moment.</p></div>
            ) : (
              <div className="border-l-2 border-gold-400 bg-turf-950 px-7 py-9"><h3 className="font-display text-3xl font-light">No active championship right now.</h3><p className="mt-3 text-ivory-dim">Explore completed championships or check back later.</p></div>
            )}
          </div>
        </section>

        <section className="bg-turf-950 pb-24" aria-labelledby="discovery-title">
          <div className="sticky top-[68px] z-30 border-y border-white/10 bg-turf-950/95 backdrop-blur-xl">
            <form
              className="mx-auto grid max-w-[1400px] gap-3 px-6 py-4 md:grid-cols-[1fr_190px_150px_230px_auto] md:px-12"
              onSubmit={(event) => { event.preventDefault(); updateParams({ search: draftSearch, page: 0 }); }}
            >
              <label className="relative">
                <span className="sr-only">Search championships</span>
                <Search size={16} className="pointer-events-none absolute left-4 top-3.5 text-ivory-faint" />
                <input type="search" aria-label="Search championships" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Search championships..." className="h-11 w-full border border-white/15 bg-turf-900 pl-11 pr-4 text-sm text-ivory outline-none placeholder:text-ivory-faint focus:border-gold-400/70" />
              </label>
              <select aria-label="Championship status" value={state.status} onChange={(event) => updateParams({ status: event.target.value, page: 0 })} className="h-11 border border-white/15 bg-turf-900 px-3 text-sm text-ivory outline-none focus:border-gold-400/70">
                <option value="">All statuses</option><option value="ONGOING">Ongoing</option><option value="OPEN_REGISTRATION">Registration open</option><option value="SCHEDULE_PUBLISHED">Upcoming</option><option value="COMPLETED">Completed</option>
              </select>
              <input aria-label="Season year" type="number" min="2020" max="2200" value={state.year ?? ""} onChange={(event) => updateParams({ year: event.target.value, page: 0 })} placeholder="Season year" className="h-11 border border-white/15 bg-turf-900 px-3 text-sm text-ivory outline-none placeholder:text-ivory-faint focus:border-gold-400/70" />
              <select aria-label="Sort championships" value={state.sortBy} onChange={(event) => updateParams({ sortBy: event.target.value, page: 0 })} className="h-11 border border-white/15 bg-turf-900 px-3 text-sm text-ivory outline-none focus:border-gold-400/70">
                <option value="ONGOING_FIRST">Ongoing first</option><option value="REGISTRATION_CLOSING_SOON">Registration closing soon</option><option value="LATEST">Latest season</option>
              </select>
              <button type="submit" className="h-11 bg-gold-400 px-5 text-xs font-bold uppercase tracking-[0.14em] text-turf-950 hover:bg-gold-300">Search</button>
            </form>
          </div>
          <div className="mx-auto max-w-[1400px] px-6 pt-12 md:px-12">
            <MotionReveal className="flex items-end justify-between gap-5 border-b border-white/10 pb-6">
              <div><h2 id="discovery-title" className="font-display text-4xl font-light tracking-tight">Discover the season.</h2><GoldRule className="mt-5 w-20" /></div>
              <p role="status" aria-live="polite" className="font-data text-xs uppercase tracking-[0.18em] text-ivory-faint">{pageData.totalElements} championships</p>
            </MotionReveal>
            <div className="mt-3">
              {listQuery.loading ? [0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse border-t border-white/10 bg-white/[0.02]" />) : listQuery.error && !listQuery.data ? (
                <div role="alert" className="border-l-2 border-nyraRed bg-turf-900 px-6 py-7"><p className="text-rose-300">Could not load championships right now.</p><button type="button" onClick={listQuery.retry} className="mt-5 inline-flex min-h-11 items-center border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60">Try again</button></div>
              ) : pageData.content.length === 0 ? <div className="border-l-2 border-gold-400 bg-turf-900 px-7 py-9"><h3 className="font-display text-3xl font-light">No championships match this view.</h3><p className="mt-3 text-ivory-dim">Reset the filters or explore another season.</p></div> : (
                <div aria-busy={listQuery.fetching} className={`transition-opacity duration-300 ${listQuery.fetching ? "opacity-50" : "opacity-100"}`}>
                  {pageData.content.map((championship) => <ChampionshipRow key={championship.id} championship={championship} />)}
                </div>
              )}
            </div>
            <PublicPagination page={pageData.number} totalPages={pageData.totalPages} onChange={(page) => updateParams({ page })} />
          </div>
        </section>
      </main>
      <ClientFooter />
    </div>
  );
}
