import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, Ruler, Trophy, Users } from "lucide-react";

import { getPublicRace, getPublicRaceResults } from "../../api/racingApi";
import { spectatorPredictionApi } from "../spectator/predictions/services/spectatorPredictionApi";
import type { PredictionOptions } from "../spectator/predictions/types/prediction.types";
import { ClientHeader } from "../../components/client/ClientHeader";
import { ClientFooter } from "../../components/client/ClientFooter";
import { Countdown } from "../../components/client/Countdown";
import { MotionPage } from "../../components/client/MotionPage";
import {
  Eyebrow,
  GoldRule,
  MotionReveal,
  MotionStagger,
  MotionStaggerItem,
} from "../../components/client/primitives";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { PublicRaceResult, Race } from "../../types/racing";
import heroImage from "../../assets/slide.jpg";
import { formatDistance, formatPostTime, isRaceConcluded, raceStatus } from "./publicRacingData";
import { StatusPill } from "./components/StatusPill";

export function RaceDetailPage() {
  const { id } = useParams();
  const idNum = Number(id);
  const reduce = useReducedMotion();

  const [race, setRace] = useState<Race | null>(null);
  const [result, setResult] = useState<PublicRaceResult | null>(null);
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
      const [raceRes, optRes, resultRes] = await Promise.allSettled([
        getPublicRace(idNum),
        spectatorPredictionApi.getPredictionOptions(idNum),
        getPublicRaceResults(idNum),
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

  if (notFound) {
    return (
      <div className="client-theme min-h-screen bg-turf-950 text-ivory">
        <ClientHeader />
        <main className="mx-auto max-w-[900px] px-6 py-28 md:px-12">
          <div className="rounded-2xl border-l-4 border-gold-400 bg-turf-900 px-8 py-12">
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
                className="max-w-xl rounded-2xl border-l-4 border-nyraRed bg-turf-900/80 px-7 py-6 text-sm font-semibold text-rose-300"
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
                </div>

                {!cancelled ? (
                  <div className="shrink-0 rounded-2xl border border-gold-600/30 bg-turf-950/70 px-7 py-6 backdrop-blur-sm">
                    <p className="eyebrow text-gold-300">{concluded ? "This race has run" : "Time to post"}</p>
                    <div className="mt-4">
                      <Countdown
                        target={race.raceDateTime}
                        doneLabel={concluded ? "Results are in" : "Underway"}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </MotionPage>
        </div>
      </section>

      {/* The Field */}
      <section className="bg-turf-900 py-18 md:py-24">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <MotionReveal className="max-w-xl">
            <Eyebrow tone="emerald">The Field</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-light tracking-tight md:text-5xl">
              Runners &amp; riders.
            </h2>
            <GoldRule className="mt-6 w-20" />
          </MotionReveal>

          <div className="mt-12">
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading the field">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/8 bg-turf-950" />
                ))}
              </div>
            ) : runners.length === 0 ? (
              <div className="rounded-2xl border-l-4 border-gold-400 bg-turf-950 px-7 py-10">
                <Eyebrow tone="gold">Field not drawn</Eyebrow>
                <p className="mt-4 max-w-lg font-display text-2xl font-light text-ivory">
                  The final field for this race has not been drawn yet. Check back closer to post time.
                </p>
              </div>
            ) : (
              <MotionStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" gap={0.06}>
                {runners.map((runner) => (
                  <MotionStaggerItem key={runner.raceParticipantId}>
                    <article className="flex h-full items-center gap-5 rounded-2xl border border-white/8 bg-gradient-to-b from-turf-900 to-turf-950 p-5 transition-colors hover:border-gold-400/35">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-gold-400/50 bg-gold-400/10 font-data text-xl font-semibold text-gold-200">
                        {runner.startNumber ?? "—"}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-xl font-medium tracking-tight text-ivory">
                          {runner.horseName}
                        </h3>
                        <p className="mt-0.5 truncate text-sm text-ivory-dim">{runner.jockeyName}</p>
                        {runner.laneNumber != null ? (
                          <p className="font-data mt-1.5 text-[10px] uppercase tracking-[0.18em] text-ivory-faint">
                            Lane {runner.laneNumber}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  </MotionStaggerItem>
                ))}
              </MotionStagger>
            )}
          </div>
        </div>
      </section>

      {!loading && concluded ? (
        <section className="border-t border-white/8 bg-turf-950 py-18 md:py-24" aria-labelledby="public-result-title">
          <div className="mx-auto max-w-[1100px] px-6 md:px-12">
            <MotionReveal>
              <Eyebrow tone="gold">{result?.official ? "After the wire" : "Under review"}</Eyebrow>
              <h2 id="public-result-title" className="mt-4 font-display text-3xl font-light tracking-tight md:text-5xl">
                {result?.official ? "Official Result" : "Awaiting Official Result"}
              </h2>
              <p className="mt-3 max-w-xl text-ivory-dim">
                {result?.official
                  ? "The confirmed finish order from the race officials."
                  : "Results are being reviewed. The finish order will appear after confirmation."}
              </p>
            </MotionReveal>

            {result?.official && result.entries.length ? (
              <MotionStagger className="mt-10 divide-y divide-white/10 border-y border-white/10" gap={0.04}>
                {result.entries.map((entry, index) => (
                  <MotionStaggerItem key={`${entry.position ?? index}-${entry.horseName}`}>
                    <article className="grid gap-4 py-5 sm:grid-cols-[72px_1fr_auto] sm:items-center">
                      <span className="font-data text-3xl font-semibold text-gold-200">
                        {entry.position ?? index + 1}
                      </span>
                      <div>
                        <h3 className="font-display text-2xl font-medium text-ivory">{entry.horseName}</h3>
                        <p className="mt-1 text-sm text-ivory-dim">{entry.jockeyName || "Jockey TBA"}</p>
                      </div>
                      <div className="flex gap-7 text-right">
                        <div>
                          <p className="eyebrow text-ivory-faint">Final time</p>
                          <p className="font-data mt-1 text-lg text-ivory">
                            {entry.finishTimeSeconds != null ? `${entry.finishTimeSeconds.toFixed(3)}s` : "TBA"}
                          </p>
                        </div>
                        <div>
                          <p className="eyebrow text-ivory-faint">Points</p>
                          <p className="font-data mt-1 text-lg text-gold-200">{entry.points}</p>
                        </div>
                      </div>
                    </article>
                  </MotionStaggerItem>
                ))}
              </MotionStagger>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Outcome / CTA */}
      {!loading && race ? (
        concluded ? (
          <section className="border-t border-white/8 bg-turf-950 py-16 md:py-20">
            <MotionReveal className="mx-auto flex max-w-[1100px] flex-col items-start gap-7 px-6 md:flex-row md:items-center md:justify-between md:px-12">
              <div className="max-w-xl">
                <Eyebrow tone="gold">After the wire</Eyebrow>
                <h2 className="mt-4 font-display text-3xl font-light tracking-tight md:text-4xl">
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
