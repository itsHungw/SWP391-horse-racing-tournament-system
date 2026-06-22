import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BarChart3, Crown, Flag, Trophy } from "lucide-react";

import { getPublicTournaments } from "../../api/racingApi";
import { getChampionshipStandings, getSpectatorLeaderboard } from "../../api/leaderboardApi";
import { ClientHeader } from "../../components/client/ClientHeader";
import { ClientFooter } from "../../components/client/ClientFooter";
import { Eyebrow, GoldRule, MotionReveal } from "../../components/client/primitives";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Tournament } from "../../types/racing";
import heroImage from "../../assets/slide.jpg";
import type { BoardTab, FormResult } from "./leaderboard/leaderboardTypes";

const EASE = [0.22, 1, 0.36, 1] as const;

const TABS: Array<{ key: BoardTab; label: string; Icon: typeof Trophy }> = [
  { key: "HORSE", label: "Horses", Icon: Trophy },
  { key: "JOCKEY", label: "Jockeys", Icon: Flag },
  { key: "SPECTATOR", label: "Spectators", Icon: Crown },
];

interface DisplayRow {
  rank: number;
  name: string;
  subtitle?: string | null;
  points: number;
  stats: { label: string; value: string }[];
  form?: FormResult[];
}

const podiumStyle = [
  { ring: "border-gold-400/60", glow: "from-gold-400/20", medal: "text-foil", chip: "bg-gold-400 text-turf-950" },
  { ring: "border-white/25", glow: "from-white/10", medal: "text-ivory", chip: "bg-white/80 text-turf-950" },
  { ring: "border-gold-600/40", glow: "from-gold-600/15", medal: "text-gold-500", chip: "bg-gold-600 text-turf-950" },
];

function FormPips({ form }: { form?: FormResult[] }) {
  if (!form || form.length === 0) return null;
  return (
    <span className="flex items-center gap-1">
      {form.slice(-5).map((f, i) => (
        <span
          key={i}
          title={f === "W" ? "Win" : f === "P" ? "Podium" : "Unplaced"}
          className={`flex h-5 w-5 items-center justify-center rounded-sm font-data text-[10px] font-semibold ${
            f === "W"
              ? "bg-gold-400 text-turf-950"
              : f === "P"
                ? "bg-emerald-glow/30 text-emerald-soft"
                : "bg-white/8 text-ivory-faint"
          }`}
        >
          {f}
        </span>
      ))}
    </span>
  );
}

export function LeaderboardPage() {
  useDocumentTitle("Leaderboard | Night at the Races");
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<BoardTab>("HORSE");
  const [scopeId, setScopeId] = useState<number | null>(null); // null = Overall
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [rows, setRows] = useState<DisplayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false); // false → show "coming soon" empty state

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], ["0%", "20%"]);

  // Load championship list once (for the scope selector) — real data.
  useEffect(() => {
    let mounted = true;
    getPublicTournaments()
      .then((data) => {
        if (mounted) setTournaments(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setTournaments([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Load standings whenever the tab or scope changes.
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setReady(false);

    async function load() {
      try {
        if (tab === "SPECTATOR") {
          const data = await getSpectatorLeaderboard(scopeId);
          if (!mounted) return;
          setRows(
            data.map((r) => ({
              rank: r.rank,
              name: r.displayName,
              points: r.points,
              stats: [
                { label: "Correct", value: String(r.correctPredictions) },
                {
                  label: "Accuracy",
                  value: r.totalPredictions
                    ? `${Math.round((r.correctPredictions / r.totalPredictions) * 100)}%`
                    : "—",
                },
              ],
            })),
          );
        } else {
          const data = await getChampionshipStandings(scopeId, tab);
          if (!mounted) return;
          setRows(
            data.map((r) => ({
              rank: r.rank,
              name: r.name,
              subtitle: r.subtitle,
              points: r.points,
              stats: [
                { label: "Wins", value: String(r.wins) },
                { label: "Podiums", value: String(r.podiums) },
                { label: "Starts", value: String(r.starts) },
              ],
              form: r.form,
            })),
          );
        }
        if (mounted) setReady(true);
      } catch {
        // Endpoint not available yet → premium empty-state, not a hard error.
        if (mounted) {
          setRows([]);
          setReady(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [tab, scopeId]);

  const scopeLabel = useMemo(() => {
    if (scopeId === null) return "All Championships";
    return tournaments.find((t) => t.id === scopeId)?.name ?? "Championship";
  }, [scopeId, tournaments]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const hasData = ready && rows.length > 0;
  const unit = tab === "SPECTATOR" ? "pts" : "pts";

  return (
    <div className="client-theme bg-turf-950 text-ivory">
      <ClientHeader />

      {/* Hero */}
      <section className="grain relative isolate overflow-hidden">
        <motion.div style={reduce ? undefined : { y: heroY }} className="absolute inset-0 -z-10">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-center opacity-45" />
        </motion.div>
        <div className="turf-vignette absolute inset-0 -z-10" />
        <div className="mx-auto max-w-[1400px] px-6 pb-12 pt-24 md:px-12 md:pt-32">
          <MotionReveal>
            <Eyebrow tone="gold">The Standings</Eyebrow>
            <h1 className="mt-6 font-display text-[clamp(2.8rem,7vw,6rem)] font-light leading-[0.9] tracking-[-0.02em]">
              Leaderboard<span className="text-foil">.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-ivory-dim">
              The championship form — top horses, jockeys, and spectators ranked across the running of the
              season.
            </p>
          </MotionReveal>

          {/* Tabs + scope */}
          <MotionReveal className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" y={0}>
            <div className="flex flex-wrap gap-2">
              {TABS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 ${
                    tab === key
                      ? "border-gold-400 bg-gold-400 text-turf-950"
                      : "border-white/15 text-ivory-dim hover:border-gold-400/50 hover:text-ivory"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-3">
              <span className="eyebrow text-ivory-faint">Season</span>
              <select
                value={scopeId === null ? "all" : String(scopeId)}
                onChange={(e) => setScopeId(e.target.value === "all" ? null : Number(e.target.value))}
                className="min-h-11 rounded-lg border border-white/15 bg-turf-900 px-4 text-sm font-semibold text-ivory outline-none transition-colors focus:border-gold-400 [&>option]:bg-turf-900"
              >
                <option value="all">All Championships (Overall)</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </MotionReveal>
        </div>
      </section>

      {/* Board */}
      <section className="bg-turf-900 py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <div className="mb-10 flex items-end justify-between border-b border-white/10 pb-6">
            <div>
              <Eyebrow tone="emerald">{TABS.find((t) => t.key === tab)?.label} · Standings</Eyebrow>
              <h2 className="mt-3 font-display text-2xl font-light tracking-tight md:text-3xl">{scopeLabel}</h2>
            </div>
            <GoldRule className="hidden w-24 sm:block" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${tab}-${scopeId}`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {loading ? (
                <div className="space-y-3" aria-label="Loading standings">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl border border-white/8 bg-turf-950" />
                  ))}
                </div>
              ) : !hasData ? (
                <div className="rounded-2xl border border-gold-600/25 bg-turf-950 px-7 py-12 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/5 text-gold-300">
                    <BarChart3 size={24} />
                  </span>
                  <p className="mt-6 font-display text-2xl font-light text-ivory">
                    Standings open with the first confirmed results.
                  </p>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ivory-dim">
                    Once {tab === "SPECTATOR" ? "spectators make their race picks" : "races are run and results are confirmed"},
                    the {scopeLabel.toLowerCase()} leaderboard will rank every contender here.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link
                      to="/races"
                      className="inline-flex items-center gap-2 rounded-sm border border-ivory/25 px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/70 hover:text-gold-300"
                    >
                      Race Calendar
                    </Link>
                    <Link
                      to="/spectator/predictions"
                      className="inline-flex items-center gap-2 rounded-sm bg-gold-400 px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-gold-300"
                    >
                      Prediction Arena
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Podium */}
                  {podium.length === 3 && (
                    <div className="mb-10 grid gap-4 md:grid-cols-3">
                      {[1, 0, 2].map((order) => {
                        const row = podium[order];
                        const s = podiumStyle[order];
                        return (
                          <div
                            key={row.rank}
                            className={`relative overflow-hidden rounded-2xl border ${s.ring} bg-gradient-to-b ${s.glow} to-turf-950 p-6 ${
                              order === 0 ? "md:-translate-y-3 md:p-8" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-data text-5xl font-semibold leading-none ${s.medal}`}>
                                {String(row.rank).padStart(2, "0")}
                              </span>
                              <span className={`rounded-full px-2.5 py-0.5 font-data text-[10px] font-bold uppercase tracking-[0.14em] ${s.chip}`}>
                                {row.rank === 1 ? "Leader" : `#${row.rank}`}
                              </span>
                            </div>
                            <h3 className="mt-5 font-display text-2xl font-medium tracking-tight text-ivory">{row.name}</h3>
                            {row.subtitle ? <p className="mt-1 text-sm text-ivory-faint">{row.subtitle}</p> : null}
                            <p className="mt-4 font-data text-3xl font-semibold text-foil">
                              {row.points}
                              <span className="ml-1 text-sm text-ivory-faint">{unit}</span>
                            </p>
                            {row.form ? <div className="mt-4"><FormPips form={row.form} /></div> : null}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Ranked table */}
                  <div className="overflow-hidden rounded-2xl border border-white/8 bg-turf-950">
                    <div className="grid grid-cols-[56px_1fr_auto] items-center gap-4 border-b border-white/10 px-6 py-4 font-data text-[10px] uppercase tracking-[0.2em] text-ivory-faint sm:grid-cols-[56px_1fr_repeat(3,72px)_120px]">
                      <span>Rank</span>
                      <span>{tab === "SPECTATOR" ? "Member" : tab === "HORSE" ? "Horse" : "Jockey"}</span>
                      {(podium[0]?.stats ?? []).map((st) => (
                        <span key={st.label} className="hidden text-right sm:block">
                          {st.label}
                        </span>
                      ))}
                      <span className="text-right">Points</span>
                    </div>

                    {(podium.length === 3 ? rest : rows).map((row) => (
                      <div
                        key={row.rank}
                        className="grid grid-cols-[56px_1fr_auto] items-center gap-4 border-b border-white/5 px-6 py-4 transition-colors last:border-0 hover:bg-white/[0.02] sm:grid-cols-[56px_1fr_repeat(3,72px)_120px]"
                      >
                        <span className="font-data text-lg font-semibold text-ivory-dim">
                          {String(row.rank).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-display text-lg font-medium text-ivory">{row.name}</p>
                          {row.subtitle ? (
                            <p className="truncate text-xs text-ivory-faint">{row.subtitle}</p>
                          ) : row.form ? (
                            <div className="mt-1 sm:hidden">
                              <FormPips form={row.form} />
                            </div>
                          ) : null}
                        </div>
                        {row.stats.map((st) => (
                          <span key={st.label} className="hidden text-right font-data text-sm text-ivory-dim sm:block">
                            {st.value}
                          </span>
                        ))}
                        <span className="text-right font-data text-xl font-semibold text-gold-300">
                          {row.points}
                          <span className="ml-1 text-xs text-ivory-faint">{unit}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <ClientFooter />
    </div>
  );
}
