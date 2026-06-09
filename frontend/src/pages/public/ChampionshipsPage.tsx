import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";

import { getPublicTournaments } from "../../api/racingApi";
import { ClientHeader } from "../../components/client/ClientHeader";
import { ClientFooter } from "../../components/client/ClientFooter";
import {
  Eyebrow,
  FoilStat,
  GoldRule,
  MotionReveal,
  MotionStagger,
  MotionStaggerItem,
} from "../../components/client/primitives";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Tournament } from "../../types/racing";
import heroImage from "../../assets/slide.jpg";
import {
  championshipStatus,
  formatDateRange,
  formatLongDate,
  isRegistrationOpen,
  sortChampionships,
  toneClasses,
  type StatusTone,
} from "./publicRacingData";

const FILTERS: Array<{ key: StatusTone | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "live", label: "Running" },
  { key: "open", label: "Open" },
  { key: "soon", label: "Upcoming" },
  { key: "done", label: "Concluded" },
];

function StatusPill({ tone, label }: { tone: StatusTone; label: string }) {
  const c = toneClasses[tone];
  const isLive = tone === "live" || tone === "open";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border ${c.ring} bg-turf-950/60 px-3 py-1`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot} ${isLive ? "live-pulse" : ""}`} />
      <span className={`eyebrow ${c.text}`}>{label}</span>
    </span>
  );
}

export function ChampionshipsPage() {
  useDocumentTitle("Championships | Night at the Races");
  const reduce = useReducedMotion();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusTone | "all">("all");

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], ["0%", "22%"]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPublicTournaments();
        if (mounted) setTournaments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Public championships unavailable.", err);
        if (mounted) {
          setTournaments([]);
          setError("Could not load the championship calendar right now.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const sorted = useMemo(() => sortChampionships(tournaments), [tournaments]);
  const visible = useMemo(
    () => (filter === "all" ? sorted : sorted.filter((t) => championshipStatus(t.status).tone === filter)),
    [sorted, filter],
  );

  const openCount = tournaments.filter((t) => championshipStatus(t.status).tone === "open").length;
  const liveCount = tournaments.filter((t) => championshipStatus(t.status).tone === "live").length;

  return (
    <div className="client-theme bg-turf-950 text-ivory">
      <ClientHeader />

      {/* Hero */}
      <section className="grain relative isolate overflow-hidden">
        <motion.div style={reduce ? undefined : { y: heroY }} className="absolute inset-0 -z-10">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-center opacity-50" />
        </motion.div>
        <div className="turf-vignette absolute inset-0 -z-10" />
        <div className="mx-auto max-w-[1400px] px-6 pb-14 pt-24 md:px-12 md:pb-20 md:pt-32">
          <MotionStagger className="max-w-3xl" gap={0.12}>
            <MotionStaggerItem>
              <Eyebrow tone="gold">The Season · 2026</Eyebrow>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <h1 className="mt-6 font-display text-[clamp(2.8rem,7vw,6rem)] font-light leading-[0.9] tracking-[-0.02em]">
                Championships<span className="text-foil">.</span>
              </h1>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-ivory-dim">
                Every season on the circuit — the contenders, the dates, the tracks, and the championships
                still open for entry.
              </p>
            </MotionStaggerItem>
          </MotionStagger>

          <MotionReveal className="mt-12" y={0}>
            <div className="grid max-w-2xl grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-turf-950/60 backdrop-blur-md">
              <FoilStat value={loading ? "—" : String(tournaments.length).padStart(2, "0")} label="Championships" className="px-6 py-6" />
              <FoilStat value={loading ? "—" : String(openCount).padStart(2, "0")} label="Open for Entry" className="px-6 py-6" />
              <FoilStat value={loading ? "—" : String(liveCount).padStart(2, "0")} label="Running Now" className="px-6 py-6" />
            </div>
          </MotionReveal>
        </div>
      </section>

      {/* Calendar */}
      <section className="bg-turf-900 py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <MotionReveal className="flex flex-col gap-7 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <Eyebrow tone="emerald">The Calendar</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-light tracking-tight md:text-5xl">
                Browse the championship slate.
              </h2>
              <GoldRule className="mt-6 w-20" />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 ${
                    filter === f.key
                      ? "border-gold-400 bg-gold-400 text-turf-950"
                      : "border-white/15 text-ivory-dim hover:border-gold-400/50 hover:text-ivory"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </MotionReveal>

          <div className="mt-12">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading championships">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-white/8 bg-turf-950 p-7">
                    <div className="h-5 w-28 rounded-full bg-white/5" />
                    <div className="mt-6 h-8 w-3/4 bg-white/5" />
                    <div className="mt-3 h-4 w-full bg-white/5" />
                    <div className="mt-8 h-px w-full bg-white/5" />
                    <div className="mt-6 h-4 w-2/3 bg-white/5" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div
                className="rounded-2xl border-l-4 border-nyraRed bg-turf-950 px-7 py-8 text-sm font-semibold text-rose-300"
                role="alert"
              >
                {error}
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-2xl border-l-4 border-gold-400 bg-turf-950 px-7 py-10">
                <Eyebrow tone="gold">Nothing here yet</Eyebrow>
                <p className="mt-4 max-w-lg font-display text-2xl font-light text-ivory">
                  {tournaments.length === 0
                    ? "The championship calendar opens with the season. Check back soon."
                    : "No championships match this filter."}
                </p>
              </div>
            ) : (
              <MotionStagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" gap={0.1}>
                {visible.map((t) => {
                  const status = championshipStatus(t.status);
                  const c = toneClasses[status.tone];
                  const regOpen = isRegistrationOpen(t);
                  return (
                    <MotionStaggerItem key={t.id}>
                      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-turf-900 to-turf-950 p-7 transition-all duration-500 hover:border-gold-400/40 hover:shadow-[0_30px_80px_-30px_rgba(212,175,55,0.3)]">
                        <div className={`absolute left-0 top-0 h-full w-1 ${c.dot} opacity-60`} />
                        <div className="flex items-center justify-between gap-3">
                          <StatusPill tone={status.tone} label={status.label} />
                          {t.code ? (
                            <span className="font-data text-xs uppercase tracking-[0.2em] text-ivory-faint">
                              {t.code}
                            </span>
                          ) : null}
                        </div>

                        <h3 className="mt-6 font-display text-3xl font-medium leading-tight tracking-tight text-ivory transition-colors group-hover:text-gold-200">
                          {t.name}
                        </h3>
                        {t.description ? (
                          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ivory-dim">{t.description}</p>
                        ) : null}

                        <GoldRule className="mt-6 w-full opacity-20" />

                        <dl className="mt-6 space-y-3 text-sm">
                          <div className="flex items-center gap-3 text-ivory-dim">
                            <CalendarDays size={16} className="shrink-0 text-gold-400/80" />
                            <dd className="font-data text-[13px]">{formatDateRange(t.startDate, t.endDate)}</dd>
                          </div>
                          {t.location ? (
                            <div className="flex items-center gap-3 text-ivory-dim">
                              <MapPin size={16} className="shrink-0 text-gold-400/80" />
                              <dd>{t.location}</dd>
                            </div>
                          ) : null}
                          {t.maxHorses ? (
                            <div className="flex items-center gap-3 text-ivory-dim">
                              <Users size={16} className="shrink-0 text-gold-400/80" />
                              <dd>
                                Field capacity <span className="font-data text-ivory">{t.maxHorses}</span>
                              </dd>
                            </div>
                          ) : null}
                        </dl>

                        {regOpen ? (
                          <p className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-soft">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-soft live-pulse" />
                            Entry window open
                            {t.registrationEndAt ? ` · closes ${formatLongDate(t.registrationEndAt)}` : ""}
                          </p>
                        ) : (
                          <p className="mt-6 text-xs font-semibold text-ivory-faint">
                            {t.registrationStartAt
                              ? `Entry opens ${formatLongDate(t.registrationStartAt)}`
                              : "Entry by championship invitation"}
                          </p>
                        )}
                      </article>
                    </MotionStaggerItem>
                  );
                })}
              </MotionStagger>
            )}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="grain relative isolate overflow-hidden bg-turf-950 py-24 md:py-32">
        <div className="absolute inset-0 -z-10 opacity-20">
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-turf-950 via-turf-950/85 to-turf-950/55" />
        <MotionReveal className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center md:px-12">
          <div className="max-w-2xl">
            <Eyebrow tone="gold">Compete on the circuit</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">
              Bring your stable to the championship.
            </h2>
            <p className="mt-5 max-w-lg text-lg font-light text-ivory-dim">
              Owners, jockeys, and referees apply through the paddock to take part in the season ahead.
            </p>
          </div>
          <Link
            to="/join-us"
            className="group inline-flex items-center gap-2.5 rounded-sm bg-gold-400 px-9 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-turf-950 shadow-[0_20px_50px_-12px_rgba(212,175,55,0.55)] transition-colors hover:bg-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory"
          >
            Join the Paddock
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </MotionReveal>
      </section>

      <ClientFooter />
    </div>
  );
}
