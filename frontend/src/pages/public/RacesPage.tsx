import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";

import { getPublicTournaments } from "../../api/racingApi";
import { ClientHeader } from "../../components/client/ClientHeader";
import { ClientFooter } from "../../components/client/ClientFooter";
import {
  Eyebrow,
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
  toneClasses,
} from "./publicRacingData";

type MeetGroup = { key: string; label: string; sort: number; meets: Tournament[] };

function groupByMonth(list: Tournament[]): MeetGroup[] {
  const groups = new Map<string, MeetGroup>();
  for (const t of list) {
    const d = t.startDate ? new Date(t.startDate) : null;
    const valid = d && !Number.isNaN(d.getTime());
    const key = valid ? `${d!.getFullYear()}-${String(d!.getMonth()).padStart(2, "0")}` : "tba";
    const label = valid
      ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(d!)
      : "Dates to be announced";
    const sort = valid ? d!.getFullYear() * 12 + d!.getMonth() : Number.MAX_SAFE_INTEGER;
    if (!groups.has(key)) groups.set(key, { key, label, sort, meets: [] });
    groups.get(key)!.meets.push(t);
  }
  const result = [...groups.values()].sort((a, b) => a.sort - b.sort);
  for (const g of result) {
    g.meets.sort((a, b) => {
      const da = a.startDate ? new Date(a.startDate).getTime() : Infinity;
      const db = b.startDate ? new Date(b.startDate).getTime() : Infinity;
      return da - db;
    });
  }
  return result;
}

function dayBadge(value?: string): { day: string; mon: string } {
  if (!value) return { day: "—", mon: "TBA" };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { day: "—", mon: "TBA" };
  return {
    day: String(d.getDate()).padStart(2, "0"),
    mon: new Intl.DateTimeFormat("en", { month: "short" }).format(d).toUpperCase(),
  };
}

export function RacesPage() {
  useDocumentTitle("Race Calendar | Night at the Races");
  const reduce = useReducedMotion();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], ["0%", "20%"]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPublicTournaments();
        if (mounted) setTournaments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Public race calendar unavailable.", err);
        if (mounted) {
          setTournaments([]);
          setError("Could not load the race calendar right now.");
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

  const groups = useMemo(() => groupByMonth(tournaments), [tournaments]);

  return (
    <div className="client-theme bg-turf-950 text-ivory">
      <ClientHeader />

      {/* Hero */}
      <section className="grain relative isolate overflow-hidden">
        <motion.div style={reduce ? undefined : { y: heroY }} className="absolute inset-0 -z-10">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-center opacity-45" />
        </motion.div>
        <div className="turf-vignette absolute inset-0 -z-10" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-50">
          <div className="absolute left-[28%] top-0 h-full w-px bg-gradient-to-b from-transparent via-gold-400/20 to-transparent" />
          <div className="absolute right-[30%] top-0 h-full w-px bg-gradient-to-b from-transparent via-emerald-glow/20 to-transparent" />
        </div>
        <div className="mx-auto max-w-[1400px] px-6 pb-14 pt-24 md:px-12 md:pb-20 md:pt-32">
          <MotionStagger className="max-w-3xl" gap={0.12}>
            <MotionStaggerItem>
              <Eyebrow tone="gold">Post Times · The Calendar</Eyebrow>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <h1 className="mt-6 font-display text-[clamp(2.8rem,7vw,6rem)] font-light leading-[0.9] tracking-[-0.02em]">
                Race <span className="italic text-foil">Calendar.</span>
              </h1>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-ivory-dim">
                The full running of the season, meet by meet. Track every championship date and see which
                gates are open for entry.
              </p>
            </MotionStaggerItem>
          </MotionStagger>
        </div>
      </section>

      {/* Calendar agenda */}
      <section className="bg-turf-900 py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          {loading ? (
            <div className="space-y-10" aria-label="Loading race calendar">
              {[0, 1].map((g) => (
                <div key={g} className="grid gap-8 lg:grid-cols-[260px_1fr]">
                  <div className="h-10 w-40 animate-pulse bg-white/5" />
                  <div className="space-y-4">
                    {[0, 1].map((i) => (
                      <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/8 bg-turf-950" />
                    ))}
                  </div>
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
          ) : groups.length === 0 ? (
            <div className="rounded-2xl border-l-4 border-gold-400 bg-turf-950 px-7 py-10">
              <Eyebrow tone="gold">No fixtures yet</Eyebrow>
              <p className="mt-4 max-w-lg font-display text-2xl font-light text-ivory">
                The race calendar opens with the season. Check back soon for post times.
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {groups.map((group) => (
                <MotionReveal key={group.key} className="grid gap-8 lg:grid-cols-[260px_1fr]">
                  <div className="lg:sticky lg:top-28 lg:self-start">
                    <Eyebrow tone="emerald">Meet</Eyebrow>
                    <h2 className="mt-4 font-display text-3xl font-light leading-tight tracking-tight md:text-4xl">
                      {group.label}
                    </h2>
                    <GoldRule className="mt-5 w-16" />
                    <p className="mt-4 font-data text-xs uppercase tracking-[0.2em] text-ivory-faint">
                      {String(group.meets.length).padStart(2, "0")}{" "}
                      {group.meets.length === 1 ? "Championship" : "Championships"}
                    </p>
                  </div>

                  <MotionStagger className="space-y-4" gap={0.08}>
                    {group.meets.map((t) => {
                      const status = championshipStatus(t.status);
                      const c = toneClasses[status.tone];
                      const badge = dayBadge(t.startDate);
                      const regOpen = isRegistrationOpen(t);
                      return (
                        <MotionStaggerItem key={t.id}>
                          <article className="group flex items-stretch gap-6 overflow-hidden rounded-2xl border border-white/8 bg-turf-950 p-6 transition-all duration-500 hover:border-gold-400/40 hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]">
                            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-turf-900 px-5 py-4 text-center">
                              <span className="font-data text-3xl font-semibold leading-none text-foil">
                                {badge.day}
                              </span>
                              <span className="font-data mt-1 text-[10px] uppercase tracking-[0.2em] text-ivory-faint">
                                {badge.mon}
                              </span>
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col justify-center">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className={`inline-flex items-center gap-2 ${c.text}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${c.dot} ${regOpen ? "live-pulse" : ""}`} />
                                  <span className="eyebrow">{status.label}</span>
                                </span>
                                {t.code ? (
                                  <span className="font-data text-[11px] uppercase tracking-[0.2em] text-ivory-faint">
                                    {t.code}
                                  </span>
                                ) : null}
                              </div>
                              <h3 className="mt-2 truncate font-display text-2xl font-medium tracking-tight text-ivory transition-colors group-hover:text-gold-200">
                                {t.name}
                              </h3>
                              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ivory-dim">
                                <span className="font-data text-[13px]">{formatDateRange(t.startDate, t.endDate)}</span>
                                {t.location ? (
                                  <span className="inline-flex items-center gap-1.5">
                                    <MapPin size={14} className="text-gold-400/80" />
                                    {t.location}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="hidden flex-col items-end justify-center text-right sm:flex">
                              {regOpen ? (
                                <span className="text-xs font-semibold text-emerald-soft">
                                  Entry open
                                  {t.registrationEndAt ? (
                                    <span className="mt-1 block font-data text-[11px] text-ivory-faint">
                                      closes {formatLongDate(t.registrationEndAt)}
                                    </span>
                                  ) : null}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-ivory-faint">
                                  {t.registrationStartAt
                                    ? `Opens ${formatLongDate(t.registrationStartAt)}`
                                    : "By invitation"}
                                </span>
                              )}
                            </div>
                          </article>
                        </MotionStaggerItem>
                      );
                    })}
                  </MotionStagger>
                </MotionReveal>
              ))}
            </div>
          )}

          <MotionReveal className="mt-20 flex flex-col items-start gap-6 rounded-2xl border border-emerald-glow/25 bg-gradient-to-br from-turf-800 to-turf-950 p-9 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <Eyebrow tone="emerald">Make your pick</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-light tracking-tight md:text-4xl">
                Predict the field before the gates open.
              </h2>
              <p className="mt-3 text-ivory-dim">Free-to-play, virtual points only — never a real-money bet.</p>
            </div>
            <Link
              to="/spectator/predictions"
              className="group inline-flex items-center gap-2.5 rounded-sm bg-emerald-glow px-8 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-turf-950 transition-colors hover:bg-emerald-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory"
            >
              Enter the Arena
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </MotionReveal>
        </div>
      </section>

      <ClientFooter />
    </div>
  );
}
