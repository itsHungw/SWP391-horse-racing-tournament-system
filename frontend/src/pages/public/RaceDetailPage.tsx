import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock3, Film, Medal, Ruler, Trophy, Users } from "lucide-react";

import { getPublicRace, getPublicRaceResults } from "../../api/racingApi";
import { getPublicRaceHighlight } from "../../api/raceMediaApi";
import { spectatorPredictionApi } from "../spectator/predictions/services/spectatorPredictionApi";
import type { PredictionOptions } from "../spectator/predictions/types/prediction.types";
import { ClientHeader } from "../../components/client/ClientHeader";
import { ClientFooter } from "../../components/client/ClientFooter";
import { Countdown } from "../../components/client/Countdown";
import { MotionPage } from "../../components/client/MotionPage";
import { RaceHighlightPlayer } from "../../components/race-media/RaceHighlightPlayer";
import {
  Eyebrow,
  MotionReveal,
} from "../../components/client/primitives";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { PublicRaceResult, Race, RaceMediaPublicResponse } from "../../types/racing";
import heroImage from "../../assets/slide.jpg";
import { formatDistance, formatPostTime, isRaceConcluded, raceStatus } from "./publicRacingData";
import { StatusPill } from "./components/StatusPill";

type RunnerOption = PredictionOptions["options"][number];
type PublicResultEntry = PublicRaceResult["entries"][number];

const SILK_PALETTE = [
  { base: "#d4af37", stripe: "#04140f", accent: "#f5f1e6" },
  { base: "#2bbd8f", stripe: "#06201a", accent: "#f1e0a8" },
  { base: "#c9415d", stripe: "#f5f1e6", accent: "#04140f" },
  { base: "#3b82f6", stripe: "#f5f1e6", accent: "#e8cd7e" },
  { base: "#7c3aed", stripe: "#f1e0a8", accent: "#04140f" },
  { base: "#f97316", stripe: "#04140f", accent: "#f5f1e6" },
  { base: "#f5f1e6", stripe: "#b8912b", accent: "#06201a" },
  { base: "#111827", stripe: "#d4af37", accent: "#f5f1e6" },
] as const;

function runnerNumber(runner: RunnerOption) {
  return runner.startNumber ?? runner.laneNumber ?? null;
}

function formatRunnerNumber(runner: RunnerOption) {
  return String(runnerNumber(runner) ?? "-");
}

function drawNumber(runner: RunnerOption | PublicResultEntry, fallback?: RunnerOption | null) {
  return runner.laneNumber ?? runner.startNumber ?? fallback?.laneNumber ?? fallback?.startNumber ?? null;
}

function formatDrawNumber(runner: RunnerOption | PublicResultEntry, fallback?: RunnerOption | null) {
  return String(drawNumber(runner, fallback) ?? "-");
}

function normalizeRunnerKey(horseName?: string | null, jockeyName?: string | null) {
  return `${(horseName ?? "").trim().toLowerCase()}::${(jockeyName ?? "").trim().toLowerCase()}`;
}

function silkSeedValue(seed: number | string | null | undefined) {
  const text = String(seed ?? "runner");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 2147483647;
  }
  return hash;
}

function silkStyle(seed: number | string | null | undefined): CSSProperties {
  const raw = silkSeedValue(seed);
  const silk = SILK_PALETTE[Math.abs(raw) % SILK_PALETTE.length];
  return {
    background:
      `linear-gradient(135deg, ${silk.base} 0 38%, ${silk.stripe} 38% 52%, ${silk.base} 52% 100%)`,
    boxShadow: `inset 0 0 0 1px ${silk.accent}55`,
  };
}

function SilkChip({
  seed,
  className = "h-9 w-9",
}: {
  seed: number | string | null | undefined;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`relative shrink-0 overflow-hidden rounded-md border border-white/15 ${className}`}
      style={silkStyle(seed)}
    >
      <span className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 bg-white/70" />
      <span className="absolute inset-x-1 top-1/2 h-1 -translate-y-1/2 bg-black/25" />
    </span>
  );
}

function compareRunners(a: RunnerOption, b: RunnerOption) {
  const aNumber = runnerNumber(a) ?? Number.MAX_SAFE_INTEGER;
  const bNumber = runnerNumber(b) ?? Number.MAX_SAFE_INTEGER;
  return aNumber - bNumber || a.horseName.localeCompare(b.horseName);
}

function formatResultTime(seconds: number | null | undefined) {
  return seconds != null ? `${seconds.toFixed(3)}s` : "TBA";
}

function formatResultGap(entry: PublicResultEntry | undefined, winnerTime: number | null | undefined) {
  if (!entry || entry.finishTimeSeconds == null || winnerTime == null) return "-";
  const gap = entry.finishTimeSeconds - winnerTime;
  if (gap <= 0.0005) return "Winner";
  return `+${gap.toFixed(3)}s`;
}

// Podium metals for the top three placings. The placing number is always shown too, so
// colour reinforces rather than being the only signal (a11y: never colour alone).
const MEDAL_TONES: Record<number, { fill: string; label: string }> = {
  1: { fill: "#d4af37", label: "Gold" },
  2: { fill: "#c7ccd4", label: "Silver" },
  3: { fill: "#c88a4a", label: "Bronze" },
};
function medalTone(rank: number | null | undefined) {
  return rank != null ? MEDAL_TONES[rank] : undefined;
}
function medalFillStyle(rank: number | null | undefined): CSSProperties | undefined {
  const tone = medalTone(rank);
  return tone ? { backgroundColor: tone.fill, color: "#04140f" } : undefined;
}
function medalTextStyle(rank: number | null | undefined): CSSProperties | undefined {
  const tone = medalTone(rank);
  return tone ? { color: tone.fill } : undefined;
}

export function RaceDetailPage() {
  const { id } = useParams();
  const idNum = Number(id);
  const reduce = useReducedMotion();

  const [race, setRace] = useState<Race | null>(null);
  const [result, setResult] = useState<PublicRaceResult | null>(null);
  const [highlight, setHighlight] = useState<RaceMediaPublicResponse | null>(null);
  const [options, setOptions] = useState<PredictionOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle(race ? `${race.name} | Night at the Races` : "Race Card | Night at the Races");

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], ["0%", "22%"]);

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
      const [raceRes, optRes, resultRes, highlightRes] = await Promise.allSettled([
        getPublicRace(idNum),
        spectatorPredictionApi.getPredictionOptions(idNum),
        getPublicRaceResults(idNum),
        getPublicRaceHighlight(idNum),
      ]);
      if (!mounted) return;
      if (raceRes.status === "rejected") {
        const status = (raceRes.reason as { response?: { status?: number } })?.response?.status;
        if (status === 404) setNotFound(true);
        else setError("Could not load this race card right now.");
        setLoading(false);
        return;
      }
      setRace(raceRes.value);
      setOptions(optRes.status === "fulfilled" ? optRes.value : null);
      setResult(resultRes.status === "fulfilled" ? resultRes.value : null);
      setHighlight(highlightRes.status === "fulfilled" ? highlightRes.value : null);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [idNum]);

  const status = race ? raceStatus(race.status) : null;
  const concluded = race ? isRaceConcluded(race.status) : false;
  const cancelled = (race?.status ?? "").toUpperCase() === "CANCELLED";
  const predictionOpen = options?.predictionOpen ?? false;
  const runners = useMemo(() => options?.options ?? [], [options]);
  const sortedRunners = useMemo(() => [...runners].sort(compareRunners), [runners]);
  const runnerLookup = useMemo(() => {
    const byId = new Map<number, RunnerOption>();
    const byName = new Map<string, RunnerOption>();
    runners.forEach((runner) => {
      byId.set(runner.raceParticipantId, runner);
      byName.set(normalizeRunnerKey(runner.horseName, runner.jockeyName), runner);
    });
    return { byId, byName };
  }, [runners]);
  const findResultRunner = (entry: PublicResultEntry) =>
    (entry.raceParticipantId != null ? runnerLookup.byId.get(entry.raceParticipantId) : null) ??
    runnerLookup.byName.get(normalizeRunnerKey(entry.horseName, entry.jockeyName)) ??
    null;
  const resultEntries = result?.official ? result.entries : [];
  const winner = resultEntries[0] ?? null;
  const winnerRunner = winner ? findResultRunner(winner) : null;
  const podium = resultEntries.slice(0, 3);
  const winnerTime = winner?.finishTimeSeconds ?? null;

  if (notFound) {
    return (
      <div className="client-theme min-h-screen bg-turf-950 text-ivory">
        <ClientHeader />
        <main className="mx-auto max-w-[900px] px-6 py-28 md:px-12">
          <div className="rounded-2xl border border-gold-400/35 bg-turf-900 px-8 py-12">
            <Eyebrow tone="gold">Off the card</Eyebrow>
            <h1 className="mt-5 font-display text-4xl font-light text-ivory">
              This race is not on the programme.
            </h1>
            <Link
              to="/races"
              className="group mt-8 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-gold-300 transition-colors hover:text-ivory"
            >
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
              Back to the race calendar
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
        <div className="mx-auto max-w-[1400px] px-6 pb-14 pt-20 md:px-12 md:pb-18 md:pt-28">
          <MotionPage>
            {loading ? (
              <div className="max-w-2xl animate-pulse" aria-label="Loading race card">
                <div className="h-4 w-44 rounded-full bg-white/10" />
                <div className="mt-7 h-12 w-3/4 bg-white/10" />
                <div className="mt-5 h-4 w-1/2 bg-white/10" />
              </div>
            ) : error || !race ? (
              <div
                className="max-w-xl rounded-2xl border border-nyraRed/45 bg-turf-900/80 px-7 py-6 text-sm font-semibold text-rose-300"
                role="alert"
              >
                {error ?? "Could not load this race card right now."}
              </div>
            ) : (
              <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <Link
                    to={`/championships/${race.tournamentId}`}
                    className="group inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-gold-300 transition-colors hover:text-ivory"
                  >
                    <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
                    {race.tournamentName || "Championship programme"}
                  </Link>

                  <div className="mt-7 flex flex-wrap items-center gap-4">
                    {status ? <StatusPill tone={status.tone} label={status.label} /> : null}
                    {race.code ? (
                      <span className="font-data text-xs uppercase tracking-[0.22em] text-ivory-faint">
                        {race.code}
                      </span>
                    ) : null}
                  </div>

                  <h1 className="mt-5 font-display text-[clamp(2.4rem,6vw,4.6rem)] font-light leading-[0.95] tracking-[-0.02em]">
                    {race.name}
                    <span className="text-foil">.</span>
                  </h1>

                  <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-ivory-dim">
                    <span className="font-data text-[13px]">{formatPostTime(race.raceDateTime)}</span>
                    {formatDistance(race.distanceMeters) ? (
                      <span className="inline-flex items-center gap-2">
                        <Ruler size={15} className="text-gold-400/80" />
                        <span className="font-data text-[13px]">{formatDistance(race.distanceMeters)}</span>
                      </span>
                    ) : null}
                    {race.maxParticipants ? (
                      <span className="inline-flex items-center gap-2">
                        <Users size={15} className="text-gold-400/80" />
                        Field of <span className="font-data text-ivory">{race.maxParticipants}</span>
                      </span>
                    ) : null}
                  </div>

                  {highlight ? (
                    <a
                      href="#race-highlight"
                      className="mt-7 inline-flex min-h-11 items-center gap-3 rounded-full border border-gold-400/35 bg-turf-950/70 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-200 backdrop-blur transition-colors hover:border-gold-300 hover:bg-gold-400 hover:text-turf-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400"
                    >
                      <Film size={15} aria-hidden="true" />
                      Official highlight available
                      <ArrowRight size={14} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>

                {!cancelled ? (
                  concluded ? (
                    <div className="shrink-0 rounded-2xl border border-gold-600/30 bg-turf-950/70 px-7 py-6 backdrop-blur-sm">
                      <p className="eyebrow text-gold-300">{result?.official ? "Official results" : "Under review"}</p>
                      {winner ? (
                        <div className="mt-4 flex items-center gap-4">
                          <SilkChip seed={`${winner.raceParticipantId ?? winnerRunner?.raceParticipantId ?? "result"}-${winner.horseName}`} className="h-11 w-11" />
                          <div className="min-w-0">
                            <p className="font-display text-xl font-medium leading-tight text-ivory">{winner.horseName}</p>
                            <p className="mt-1 font-data text-[11px] uppercase tracking-[0.16em] text-ivory-faint">
                              Draw {formatDrawNumber(winner, winnerRunner)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 max-w-[260px] text-sm leading-6 text-ivory-dim">
                          Finish order is being checked by race officials.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="shrink-0 rounded-2xl border border-gold-600/30 bg-turf-950/70 px-7 py-6 backdrop-blur-sm">
                      <p className="eyebrow text-gold-300">Time to post</p>
                      <div className="mt-4">
                        <Countdown target={race.raceDateTime} doneLabel="Underway" />
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            )}
          </MotionPage>
        </div>
      </section>

      {/* The Field */}
      <section className="scroll-mt-28 bg-turf-900 py-14 md:scroll-mt-32 md:py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <MotionReveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Eyebrow tone="emerald">Racecard</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-light md:text-5xl">
                The draw.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-ivory-dim md:text-base">
                Saddlecloth, colours, horse and rider in the same scan, with the gate draw kept close to the runner.
              </p>
            </div>
            {!loading ? (
              <div className="grid w-full max-w-sm grid-cols-2 divide-x divide-white/10 rounded-2xl border border-white/10 bg-turf-950/70">
                <div className="p-4">
                  <p className="font-data text-2xl font-semibold text-gold-200">{String(sortedRunners.length).padStart(2, "0")}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory-faint">Declared</p>
                </div>
                <div className="p-4">
                  <p className="font-data text-2xl font-semibold text-ivory">{race?.maxParticipants ?? "-"}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory-faint">Field cap</p>
                </div>
              </div>
            ) : null}
          </MotionReveal>

          <div className="mt-10">
            {loading ? (
              <div className="rounded-2xl border border-white/8 bg-turf-950 p-4" aria-label="Loading the field">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="mb-3 h-14 animate-pulse rounded-md bg-white/8 last:mb-0" />
                ))}
              </div>
            ) : sortedRunners.length === 0 ? (
              <div className="rounded-2xl border border-gold-400/30 bg-turf-950 px-7 py-10">
                <Eyebrow tone="gold">Field not drawn</Eyebrow>
                <p className="mt-4 max-w-lg font-display text-2xl font-light text-ivory">
                  The final field for this race has not been drawn yet. Check back closer to post time.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-turf-950">
                <div className="grid grid-cols-[108px_1fr_64px] border-b border-white/8 bg-turf-900/80 px-4 py-3 font-data text-[10px] uppercase tracking-[0.16em] text-ivory-faint sm:grid-cols-[132px_1fr_112px]">
                  <span>No / silk</span>
                  <span>Runner / rider</span>
                  <span className="text-right">Draw</span>
                </div>
                <div className="divide-y divide-white/8">
                  {sortedRunners.map((runner) => (
                    <article
                      key={runner.raceParticipantId}
                      className="grid min-h-[76px] grid-cols-[108px_1fr_64px] items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.035] sm:grid-cols-[132px_1fr_112px]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold-400/45 bg-gold-400/10 font-data text-lg font-semibold text-gold-200">
                          {formatRunnerNumber(runner)}
                        </span>
                        <SilkChip seed={`${runner.raceParticipantId}-${runner.horseName}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="break-words font-display text-lg font-medium leading-tight text-ivory sm:text-xl">
                          {runner.horseName}
                        </h3>
                        <p className="mt-0.5 truncate text-sm text-ivory-dim">{runner.jockeyName}</p>
                      </div>
                      <p className="text-right font-data text-xs uppercase tracking-[0.14em] text-ivory-faint">
                        <span className="hidden sm:inline">Gate </span>
                        {formatDrawNumber(runner)}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {!loading && concluded ? (
        <section className="scroll-mt-28 border-t border-white/8 bg-turf-950 py-18 md:scroll-mt-32 md:py-24" aria-labelledby="public-result-title">
          <div className="mx-auto max-w-[1100px] px-6 md:px-12">
            <MotionReveal>
              <Eyebrow tone="gold">{result?.official ? "After the wire" : "Under review"}</Eyebrow>
              <h2 id="public-result-title" className="mt-4 font-display text-3xl font-light md:text-5xl">
                {result?.official ? "Official Result" : "Awaiting Official Result"}
              </h2>
              <p className="mt-3 max-w-xl text-ivory-dim">
                {result?.official
                  ? "The confirmed finish order from the race officials."
                  : "Results are being reviewed. The finish order will appear after confirmation."}
              </p>
            </MotionReveal>

            {winner ? (
              <div className="mt-10 space-y-5">
                <div className="grid overflow-hidden rounded-2xl border border-gold-400/25 bg-turf-900 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold-400 font-data text-sm font-black text-turf-950">
                        1
                      </span>
                      <SilkChip seed={`${winner.raceParticipantId ?? winnerRunner?.raceParticipantId ?? "result"}-${winner.horseName}`} className="h-10 w-10" />
                      <span className="font-data text-[11px] uppercase tracking-[0.18em] text-gold-300">Official winner</span>
                      <span className="rounded-full border border-white/10 px-3 py-1 font-data text-[10px] uppercase tracking-[0.14em] text-ivory-faint">
                        Draw {formatDrawNumber(winner, winnerRunner)}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-4xl font-medium leading-none text-ivory md:text-5xl">
                      {winner.horseName}
                    </h3>
                    <p className="mt-3 text-base text-ivory-dim">{winner.jockeyName || "Jockey TBA"}</p>
                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/8 bg-turf-950/70 p-4">
                        <Clock3 className="h-4 w-4 text-gold-300" aria-hidden="true" />
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory-faint">Final time</p>
                        <p className="font-data mt-1 text-lg text-ivory">
                          {formatResultTime(winner.finishTimeSeconds)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-turf-950/70 p-4">
                        <Trophy className="h-4 w-4 text-gold-300" aria-hidden="true" />
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory-faint">Points</p>
                        <p className="font-data mt-1 text-lg text-gold-200">{winner.points}</p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-turf-950/70 p-4">
                        <Medal className="h-4 w-4 text-gold-300" aria-hidden="true" />
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory-faint">Winning margin</p>
                        <p className="font-data mt-1 text-lg text-ivory">{formatResultGap(resultEntries[1], winnerTime)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/8 bg-turf-950 p-5 lg:border-l lg:border-t-0">
                    <p className="font-data text-[11px] uppercase tracking-[0.18em] text-ivory-faint">Podium</p>
                    <div className="mt-4 space-y-3">
                      {podium.map((entry, index) => {
                        const runner = findResultRunner(entry);
                        return (
                          <article key={`${entry.position ?? index}-${entry.horseName}-podium`} className="grid grid-cols-[40px_34px_1fr_auto] items-center gap-3 rounded-xl border border-white/8 bg-turf-900/80 p-3">
                            <span
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 font-data text-sm font-black text-ivory"
                              style={medalFillStyle(entry.position ?? index + 1)}
                              title={medalTone(entry.position ?? index + 1)?.label}
                            >
                              {entry.position ?? index + 1}
                            </span>
                            <SilkChip seed={`${entry.raceParticipantId ?? runner?.raceParticipantId ?? "result"}-${entry.horseName}`} className="h-8 w-8" />
                            <div className="min-w-0">
                              <p className="break-words font-display text-base font-medium leading-tight text-ivory sm:text-lg">{entry.horseName}</p>
                              <p className="mt-1 text-xs leading-5 text-ivory-dim">
                                Draw {formatDrawNumber(entry, runner)} / {entry.jockeyName || "Jockey TBA"}
                              </p>
                            </div>
                            <p className="font-data text-sm text-gold-200">{entry.points}</p>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-turf-950">
                  <div className="grid grid-cols-[40px_1fr_78px] border-b border-white/8 bg-turf-900/80 px-4 py-3 font-data text-[10px] uppercase tracking-[0.16em] text-ivory-faint sm:grid-cols-[64px_92px_1.5fr_1fr_104px_72px]">
                    <span>Pos</span>
                    <span className="hidden sm:block">Draw</span>
                    <span>Runner</span>
                    <span className="hidden sm:block">Gap</span>
                    <span className="text-right">Time</span>
                    <span className="hidden text-right sm:block">Pts</span>
                  </div>
                  <div className="divide-y divide-white/8">
                    {resultEntries.map((entry, index) => {
                      const runner = findResultRunner(entry);
                      return (
                        <article
                          key={`${entry.position ?? index}-${entry.horseName}`}
                          className="grid min-h-[68px] grid-cols-[40px_1fr_78px] items-center gap-3 px-4 py-3 sm:grid-cols-[64px_92px_1.5fr_1fr_104px_72px]"
                        >
                          <span className="font-data text-2xl font-semibold text-ivory-dim" style={medalTextStyle(entry.position ?? index + 1)}>{entry.position ?? index + 1}</span>
                          <div className="hidden items-center gap-2 sm:flex">
                            <SilkChip seed={`${entry.raceParticipantId ?? runner?.raceParticipantId ?? "result"}-${entry.horseName}`} className="h-8 w-8" />
                            <span className="font-data text-sm text-ivory">{formatDrawNumber(entry, runner)}</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="break-words font-display text-lg font-medium leading-tight text-ivory sm:text-xl">{entry.horseName}</h3>
                            <p className="mt-1 text-sm leading-5 text-ivory-dim">
                              <span className="sm:hidden">Draw {formatDrawNumber(entry, runner)} / </span>
                              {entry.jockeyName || "Jockey TBA"}
                              <span className="block text-ivory-faint sm:hidden">{formatResultGap(entry, winnerTime)}</span>
                            </p>
                          </div>
                          <p className="hidden font-data text-sm text-ivory-dim sm:block">{formatResultGap(entry, winnerTime)}</p>
                          <p className="text-right font-data text-sm text-ivory">{formatResultTime(entry.finishTimeSeconds)}</p>
                          <p className="hidden text-right font-data text-sm text-gold-200 sm:block">{entry.points}</p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {!loading && highlight ? <RaceHighlightPlayer highlight={highlight} /> : null}

      {/* Outcome / CTA */}
      {!loading && race ? (
        concluded ? (
          <section className="border-t border-white/8 bg-turf-950 py-16 md:py-20">
            <MotionReveal className="mx-auto flex max-w-[1100px] flex-col items-start gap-7 px-6 md:flex-row md:items-center md:justify-between md:px-12">
              <div className="max-w-xl">
                <Eyebrow tone="gold">After the wire</Eyebrow>
                <h2 className="mt-4 font-display text-3xl font-light md:text-4xl">
                  Results feed the championship standings.
                </h2>
                <p className="mt-3 text-ivory-dim">
                  Points from this race are reflected in the championship table and the season leaderboard.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to={`/championships/${race.tournamentId}`}
                  className="group inline-flex items-center gap-2.5 rounded-sm bg-gold-400 px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-turf-950 transition-colors hover:bg-gold-300"
                >
                  <Trophy size={15} />
                  Championship standings
                </Link>
                <Link
                  to="/leaderboard"
                  className="group inline-flex items-center gap-2.5 rounded-sm border border-white/20 px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-200"
                >
                  Season leaderboard
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </MotionReveal>
          </section>
        ) : predictionOpen ? (
          <div className="sticky bottom-6 z-30 mx-auto w-full max-w-[760px] px-6">
            <MotionReveal y={18}>
              <Link
                to={`/spectator/predictions?raceId=${race.id}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-emerald-glow/40 bg-turf-900/95 px-7 py-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur transition-colors hover:border-emerald-glow"
              >
                <div>
                  <p className="eyebrow flex items-center gap-2 text-emerald-soft">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-soft live-pulse" />
                    Predictions open
                  </p>
                  <p className="mt-1.5 font-display text-xl font-medium text-ivory">
                    Make your pick for this race.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2.5 rounded-sm bg-emerald-glow px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-turf-950 transition-colors group-hover:bg-emerald-soft">
                  Enter the Arena
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </MotionReveal>
          </div>
        ) : null
      ) : null}

      <div className="h-10" aria-hidden="true" />
      <ClientFooter />
    </div>
  );
}
