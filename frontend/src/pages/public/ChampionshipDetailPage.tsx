import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarDays, Film, Flag, MapPin, Trophy, Users } from "lucide-react";

import { getPublicRaces, getPublicTournament } from "../../api/racingApi";
import { getPublicTournamentHighlights } from "../../api/raceMediaApi";
import { getChampionshipStandings } from "../../api/leaderboardApi";
import { ClientHeader } from "../../components/client/ClientHeader";
import { ClientFooter } from "../../components/client/ClientFooter";
import { CountUp } from "../../components/client/CountUp";
import { MotionPage } from "../../components/client/MotionPage";
import { ChampionshipHighlightsRail } from "../../components/race-media/ChampionshipHighlightsRail";
import {
  Eyebrow,
  GoldRule,
  MotionReveal,
  MotionStagger,
  MotionStaggerItem,
} from "../../components/client/primitives";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Race, RaceMediaPublicResponse, Tournament } from "../../types/racing";
import type { ChampionshipStanding, StandingType } from "./leaderboard/leaderboardTypes";
import heroImage from "../../assets/slide.jpg";
import {
  championshipStatus,
  formatDateRange,
  formatDistance,
  formatLongDate,
  formatPostTime,
  isRaceConcluded,
  isRegistrationOpen,
  raceStatus,
} from "./publicRacingData";
import { StatusPill } from "./components/StatusPill";

const PHASES = ["Registration", "Racing", "Concluded"] as const;

function phaseIndex(status: string | undefined): number {
  const tone = championshipStatus(status).tone;
  if (tone === "live") return 1;
  if (tone === "done") return 2;
  return 0;
}

type DayGroup = { key: string; label: string; races: Race[] };

function groupRacesByDay(races: Race[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  const sorted = [...races].sort(
    (a, b) => new Date(a.raceDateTime).getTime() - new Date(b.raceDateTime).getTime(),
  );
  for (const race of sorted) {
    const d = new Date(race.raceDateTime);
    const valid = !Number.isNaN(d.getTime());
    const key = valid ? d.toISOString().slice(0, 10) : "tba";
    const label = valid
      ? new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(d)
      : "Date to be announced";
    if (!groups.has(key)) groups.set(key, { key, label, races: [] });
    groups.get(key)!.races.push(race);
  }
  return [...groups.values()];
}

function PodiumColumn({ standing, place }: { standing: ChampionshipStanding; place: 1 | 2 | 3 }) {
  const heights = { 1: "h-36 sm:h-44", 2: "h-28 sm:h-32", 3: "h-22 sm:h-24" } as const;
  const tones = {
    1: "from-gold-400/30 to-gold-600/5 border-gold-400/50 text-gold-200",
    2: "from-white/12 to-white/2 border-white/25 text-ivory",
    3: "from-gold-600/15 to-transparent border-gold-600/30 text-gold-300/80",
  } as const;
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
      <p className="w-full truncate text-center font-display text-lg font-medium text-ivory sm:text-xl">
        {standing.name}
      </p>
      {standing.subtitle ? (
        <p className="mt-0.5 w-full truncate text-center text-xs text-ivory-faint">{standing.subtitle}</p>
      ) : null}
      <p className="font-data mt-2 text-sm text-gold-300">
        {standing.points} <span className="text-[10px] uppercase tracking-[0.16em] text-ivory-faint">pts</span>
      </p>
      <div
        className={`mt-3 flex w-full items-start justify-center rounded-t-xl border border-b-0 bg-gradient-to-b pt-3 ${heights[place]} ${tones[place]}`}
      >
        <span className="font-data text-2xl font-semibold">{place}</span>
      </div>
    </div>
  );
}

export function ChampionshipDetailPage() {
  const { id } = useParams();
  const idNum = Number(id);
  const reduce = useReducedMotion();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [highlights, setHighlights] = useState<RaceMediaPublicResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [standingsType, setStandingsType] = useState<StandingType>("HORSE");
  const [standingsCache, setStandingsCache] = useState<
    Partial<Record<StandingType, ChampionshipStanding[]>>
  >({});

  useDocumentTitle(
    tournament ? `${tournament.name} | Night at the Races` : "Championship | Night at the Races",
  );

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], ["0%", "24%"]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!Number.isFinite(idNum) || idNum <= 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setNotFound(false);
      const [tRes, rRes, hRes] = await Promise.allSettled([
        getPublicTournament(idNum),
        getPublicRaces(idNum),
        getPublicTournamentHighlights(idNum),
      ]);
      if (!mounted) return;
      if (tRes.status === "rejected") {
        const status = (tRes.reason as { response?: { status?: number } })?.response?.status;
        if (status === 404) setNotFound(true);
        else setError("Could not load this championship right now.");
        setLoading(false);
        return;
      }
      setTournament(tRes.value);
      setRaces(rRes.status === "fulfilled" ? rRes.value : []);
      setHighlights(hRes.status === "fulfilled" ? hRes.value : []);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [idNum]);

  useEffect(() => {
    let mounted = true;
    if (!Number.isFinite(idNum) || idNum <= 0) return;
    if (standingsCache[standingsType]) return;
    getChampionshipStandings(idNum, standingsType)
      .then((rows) => {
        if (mounted) setStandingsCache((prev) => ({ ...prev, [standingsType]: rows }));
      })
      .catch(() => {
        if (mounted) setStandingsCache((prev) => ({ ...prev, [standingsType]: [] }));
      });
    return () => {
      mounted = false;
    };
  }, [idNum, standingsType, standingsCache]);

  const dayGroups = useMemo(() => groupRacesByDay(races), [races]);
  const highlightRaceIds = useMemo(() => new Set(highlights.map((highlight) => highlight.raceId)), [highlights]);
  const finishedCount = useMemo(() => races.filter((r) => isRaceConcluded(r.status)).length, [races]);
  const standings = standingsCache[standingsType];
  const podium = (standings ?? []).slice(0, 3);
  const tableRows = (standings ?? []).slice(3, 10);

  if (notFound) {
    return (
      <div className="client-theme min-h-screen bg-turf-950 text-ivory">
        <ClientHeader />
        <main className="mx-auto max-w-[900px] px-6 py-28 md:px-12">
          <div className="rounded-2xl border-l-4 border-gold-400 bg-turf-900 px-8 py-12">
            <Eyebrow tone="gold">Off the card</Eyebrow>
            <h1 className="mt-5 font-display text-4xl font-light text-ivory">
              This championship is not on the programme.
            </h1>
            <Link
              to="/championships"
              className="group mt-8 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-gold-300 transition-colors hover:text-ivory"
            >
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
              Back to championships
            </Link>
          </div>
        </main>
        <ClientFooter />
      </div>
    );
  }

  return (
    <div className="client-theme bg-turf-950 text-ivory">
      <ClientHeader />

      {/* Hero */}
      <section className="grain relative isolate overflow-hidden">
        <motion.div style={reduce ? undefined : { y: heroY }} className="absolute inset-0 -z-10">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-center opacity-45" />
        </motion.div>
        <div className="turf-vignette absolute inset-0 -z-10" />
        <div className="mx-auto max-w-[1400px] px-6 pb-12 pt-20 md:px-12 md:pb-16 md:pt-28">
          <MotionPage>
            <Link
              to="/championships"
              className="group inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-gold-300 transition-colors hover:text-ivory"
            >
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
              All championships
            </Link>

            {loading ? (
              <div className="mt-8 max-w-2xl animate-pulse" aria-label="Loading championship">
                <div className="h-5 w-36 rounded-full bg-white/10" />
                <div className="mt-6 h-14 w-3/4 bg-white/10" />
                <div className="mt-5 h-4 w-1/2 bg-white/10" />
              </div>
            ) : error || !tournament ? (
              <div
                className="mt-10 max-w-xl rounded-2xl border-l-4 border-nyraRed bg-turf-900/80 px-7 py-6 text-sm font-semibold text-rose-300"
                role="alert"
              >
                {error ?? "Could not load this championship right now."}
              </div>
            ) : (
              <>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <StatusPill
                    tone={championshipStatus(tournament.status).tone}
                    label={championshipStatus(tournament.status).label}
                  />
                  {tournament.code ? (
                    <span className="font-data text-xs uppercase tracking-[0.22em] text-ivory-faint">
                      {tournament.code}
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.4rem,6vw,5rem)] font-light leading-[0.95] tracking-[-0.02em]">
                  {tournament.name}
                  <span className="text-foil">.</span>
                </h1>
                {tournament.description ? (
                  <p className="mt-5 max-w-2xl text-lg font-light leading-relaxed text-ivory-dim">
                    {tournament.description}
                  </p>
                ) : null}
                <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-ivory-dim">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={16} className="text-gold-400/80" />
                    <span className="font-data text-[13px]">
                      {formatDateRange(tournament.startDate, tournament.endDate)}
                    </span>
                  </span>
                  {tournament.location ? (
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={16} className="text-gold-400/80" />
                      {tournament.location}
                    </span>
                  ) : null}
                  {tournament.maxHorses ? (
                    <span className="inline-flex items-center gap-2">
                      <Users size={16} className="text-gold-400/80" />
                      Field capacity <span className="font-data text-ivory">{tournament.maxHorses}</span>
                    </span>
                  ) : null}
                  {tournament.totalPrizePool !== undefined && tournament.totalPrizePool !== null ? (
                    <span className="inline-flex items-center gap-2">
                      <Trophy size={16} className="text-gold-400/80" />
                      Prize Pool <span className="font-data text-gold-400">{tournament.totalPrizePool.toLocaleString()} VND</span>
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-xs font-semibold">
                  {isRegistrationOpen(tournament) ? (
                    <span className="inline-flex items-center gap-2 text-emerald-soft">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-soft live-pulse" />
                      Entry window open
                      {tournament.registrationEndAt
                        ? ` · closes ${formatLongDate(tournament.registrationEndAt)}`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-ivory-faint">
                      {tournament.registrationStartAt
                        ? `Entry opens ${formatLongDate(tournament.registrationStartAt)}`
                        : "Entry by championship invitation"}
                    </span>
                  )}
                </p>
              </>
            )}
          </MotionPage>

          {/* Phase timeline */}
          {!loading && tournament ? (
            <MotionReveal className="mt-12 max-w-3xl" y={14}>
              <div className="flex items-center" aria-label="Championship phase">
                {PHASES.map((phase, i) => {
                  const current = phaseIndex(tournament.status);
                  const done = i < current;
                  const active = i === current;
                  return (
                    <div key={phase} className={`flex items-center ${i < PHASES.length - 1 ? "flex-1" : ""}`}>
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-full border font-data text-xs ${
                            active
                              ? "border-gold-400 bg-gold-400 text-turf-950 shadow-[0_0_30px_-6px_rgba(212,175,55,0.8)]"
                              : done
                                ? "border-gold-400/50 bg-gold-400/15 text-gold-300"
                                : "border-white/15 bg-turf-900 text-ivory-faint"
                          }`}
                        >
                          {done ? <Flag size={13} /> : i + 1}
                        </span>
                        <span
                          className={`mt-2.5 whitespace-nowrap font-data text-[10px] uppercase tracking-[0.18em] ${
                            active ? "text-gold-300" : done ? "text-ivory-dim" : "text-ivory-faint"
                          }`}
                        >
                          {phase}
                        </span>
                      </div>
                      {i < PHASES.length - 1 ? (
                        <span
                          className={`mx-3 mb-6 h-px flex-1 ${done ? "bg-gold-400/50" : "bg-white/12"}`}
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </MotionReveal>
          ) : null}
        </div>
      </section>

      {/* Stats band */}
      {!loading && tournament ? (
        <section className="border-y border-white/8 bg-turf-900/60">
          <div className="mx-auto grid max-w-[1400px] grid-cols-3 divide-x divide-white/8 px-6 md:px-12">
            {[
              { value: races.length, label: "Races on the card" },
              { value: finishedCount, label: "Results in" },
              { value: Math.max(races.length - finishedCount, 0), label: "Still to run" },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-8 text-center sm:px-8">
                <CountUp
                  value={stat.value}
                  className="font-data text-foil text-4xl font-semibold leading-none sm:text-5xl"
                  format={(n) => String(n).padStart(2, "0")}
                />
                <p className="eyebrow mt-3 text-ivory-faint">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!loading ? <ChampionshipHighlightsRail highlights={highlights} races={races} /> : null}

      {/* Race schedule */}
      <section className="bg-turf-900 py-18 md:py-24">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <MotionReveal className="max-w-xl">
            <Eyebrow tone="emerald">The Programme</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-light tracking-tight md:text-5xl">
              Race schedule.
            </h2>
            <GoldRule className="mt-6 w-20" />
          </MotionReveal>

          <div className="mt-12">
            {loading ? (
              <div className="space-y-4" aria-label="Loading races">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/8 bg-turf-950" />
                ))}
              </div>
            ) : dayGroups.length === 0 ? (
              <div className="rounded-2xl border-l-4 border-gold-400 bg-turf-950 px-7 py-10">
                <Eyebrow tone="gold">Card not drawn</Eyebrow>
                <p className="mt-4 max-w-lg font-display text-2xl font-light text-ivory">
                  Races for this championship will be published once the schedule is set.
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {dayGroups.map((group) => (
                  <MotionReveal key={group.key}>
                    <p className="font-data text-xs uppercase tracking-[0.22em] text-gold-300">
                      {group.label}
                    </p>
                    <MotionStagger className="mt-5 space-y-4" gap={0.07}>
                      {group.races.map((race) => {
                        const rs = raceStatus(race.status);
                        return (
                          <MotionStaggerItem key={race.id}>
                            <Link
                              to={`/races/${race.id}`}
                              className="group flex flex-col gap-4 rounded-2xl border border-white/8 bg-turf-950 p-6 transition-all duration-500 hover:border-gold-400/40 hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                  <StatusPill tone={rs.tone} label={rs.label} />
                                  {highlightRaceIds.has(race.id) ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/40 bg-gold-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-200">
                                      <Film size={12} aria-hidden="true" />
                                      Highlight
                                    </span>
                                  ) : null}
                                  {race.code ? (
                                    <span className="font-data text-[11px] uppercase tracking-[0.2em] text-ivory-faint">
                                      {race.code}
                                    </span>
                                  ) : null}
                                </div>
                                <h3 className="mt-2.5 truncate font-display text-2xl font-medium tracking-tight text-ivory transition-colors group-hover:text-gold-200">
                                  {race.name}
                                </h3>
                                <p className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ivory-dim">
                                  <span className="font-data text-[13px]">{formatPostTime(race.raceDateTime)}</span>
                                  {formatDistance(race.distanceMeters) ? (
                                    <span className="font-data text-[13px]">
                                      {formatDistance(race.distanceMeters)}
                                    </span>
                                  ) : null}
                                </p>
                              </div>
                              <span className="inline-flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-300">
                                Race card
                                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                              </span>
                            </Link>
                          </MotionStaggerItem>
                        );
                      })}
                    </MotionStagger>
                  </MotionReveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Standings */}
      <section className="bg-turf-950 py-18 md:py-24">
        <div className="mx-auto max-w-[1100px] px-6 md:px-12">
          <MotionReveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow tone="gold">The Table</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-light tracking-tight md:text-5xl">
                Championship standings.
              </h2>
              <GoldRule className="mt-6 w-20" />
            </div>
            <div className="flex gap-2">
              {(["HORSE", "JOCKEY"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setStandingsType(t)}
                  className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 ${
                    standingsType === t
                      ? "border-gold-400 bg-gold-400 text-turf-950"
                      : "border-white/15 text-ivory-dim hover:border-gold-400/50 hover:text-ivory"
                  }`}
                >
                  {t === "HORSE" ? "Horses" : "Jockeys"}
                </button>
              ))}
            </div>
          </MotionReveal>

          <div className="mt-12">
            {standings === undefined ? (
              <div className="h-56 animate-pulse rounded-2xl border border-white/8 bg-turf-900" aria-label="Loading standings" />
            ) : podium.length === 0 ? (
              <div className="rounded-2xl border-l-4 border-gold-400 bg-turf-900 px-7 py-10">
                <Eyebrow tone="gold">Waiting on results</Eyebrow>
                <p className="mt-4 max-w-lg font-display text-2xl font-light text-ivory">
                  Standings publish after the first results are confirmed.
                </p>
              </div>
            ) : (
              <>
                <MotionStagger className="flex items-end gap-4 sm:gap-8" gap={0.14}>
                  {podium[1] ? (
                    <MotionStaggerItem className="flex-1">
                      <PodiumColumn standing={podium[1]} place={2} />
                    </MotionStaggerItem>
                  ) : null}
                  <MotionStaggerItem className="flex-1">
                    <PodiumColumn standing={podium[0]} place={1} />
                  </MotionStaggerItem>
                  {podium[2] ? (
                    <MotionStaggerItem className="flex-1">
                      <PodiumColumn standing={podium[2]} place={3} />
                    </MotionStaggerItem>
                  ) : null}
                </MotionStagger>

                {tableRows.length > 0 ? (
                  <MotionReveal className="mt-2 overflow-hidden rounded-b-2xl border border-white/8 bg-turf-900">
                    <table className="w-full text-sm">
                      <caption className="sr-only">Standings ranks 4 and below</caption>
                      <tbody>
                        {tableRows.map((row) => (
                          <tr key={`${row.rank}-${row.name}`} className="border-b border-white/5 last:border-0">
                            <td className="font-data w-14 px-5 py-3.5 text-ivory-faint">{row.rank}</td>
                            <td className="px-2 py-3.5">
                              <span className="font-semibold text-ivory">{row.name}</span>
                              {row.subtitle ? (
                                <span className="ml-2 hidden text-xs text-ivory-faint sm:inline">{row.subtitle}</span>
                              ) : null}
                            </td>
                            <td className="font-data px-5 py-3.5 text-right text-gold-300">{row.points} pts</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </MotionReveal>
                ) : null}

                <MotionReveal className="mt-8">
                  <Link
                    to="/leaderboard"
                    className="group inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-gold-300 transition-colors hover:text-ivory"
                  >
                    <Trophy size={15} />
                    Full season leaderboard
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </MotionReveal>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="grain relative isolate overflow-hidden border-t border-white/8 bg-turf-950 py-20 md:py-28">
        <div className="absolute inset-0 -z-10 opacity-15">
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-turf-950 via-turf-950/85 to-turf-950/60" />
        <MotionReveal className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center md:px-12">
          <div className="max-w-2xl">
            <Eyebrow tone="emerald">Play the card</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">
              Call the field before the gates open.
            </h2>
            <p className="mt-4 max-w-lg text-lg font-light text-ivory-dim">
              VND wallet predictions with projected returns shown before confirmation.
            </p>
          </div>
          <Link
            to="/spectator/predictions"
            className="group inline-flex items-center gap-2.5 rounded-sm bg-emerald-glow px-9 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-turf-950 transition-colors hover:bg-emerald-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory"
          >
            Enter the Arena
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </MotionReveal>
      </section>

      <ClientFooter />
    </div>
  );
}
