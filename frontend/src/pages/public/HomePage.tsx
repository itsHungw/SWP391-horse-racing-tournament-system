import { useEffect, useState } from "react";
import { resolveFileUrl } from "../../utils/fileUrl";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Play, Trophy, MapPin, BarChart3 } from "lucide-react";

import { blogApi } from "../../api/blogApi";
import { getPublicRacingSummary, searchPublicRaces } from "../../api/racingApi";
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
import type { Blog } from "../../types/blog";
import type { PublicRacingSummary, RaceSummary } from "../../types/racing";
import heroImage from "../../assets/slide.jpg";
import { StatusPill } from "./components/StatusPill";
import { formatDistance, formatPostTime, raceStatus } from "./publicRacingData";
import { selectNextToPost } from "./racingDiscovery";

const EASE = [0.22, 1, 0.36, 1] as const;

const fallbackNews =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD3saKgDU0-ot9kioPQkTnU-C4T2VptX_iWNLBeQbVxehn21O8bD1RE9UShnD3qRvwvY14_AsQL3YyApeN3SrSP0Ebvm6nIbIv0A_fv-p2O_UWKt7PhZKQb_yY0fP_9eodHg13F0jBkZQ26xuS3PPbase_pms-XnBF-bAvTr1cxfSZtCyP1SRLXB94ddDXR3sDXxdieralZiuHP3f04FygdlJhKiub8gd3okHWLbSCfUJl56P5njmpz3WshFQU5618TcctmqF3yxNs";

const pillars = [
  {
    Icon: Trophy,
    title: "Championships",
    copy: "Track every season, every standing. Follow the contenders chasing the championship crown.",
    to: "/championships",
    cta: "View Standings",
  },
  {
    Icon: MapPin,
    title: "Race Routes",
    copy: "Post times, distances, and the field for every card on the championship calendar.",
    to: "/races",
    cta: "Open Calendar",
  },
  {
    Icon: BarChart3,
    title: "Leaderboard",
    copy: "See the form — top horses and jockeys ranked across the running of the season.",
    to: "/leaderboard",
    cta: "See Rankings",
  },
];

function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value),
  );
}

function formatFinaleDate(value?: string) {
  if (!value) return "TBA";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "TBA";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function HomePage() {
  useDocumentTitle("Aqueduct — Night at the Races | Championship Horse Racing");
  const reduce = useReducedMotion();
  const [latestBlogs, setLatestBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [blogsError, setBlogsError] = useState<string | null>(null);
  const [featuredRace, setFeaturedRace] = useState<RaceSummary | null>(null);
  const [featuredRaceLoading, setFeaturedRaceLoading] = useState(true);
  const [featuredRaceError, setFeaturedRaceError] = useState<string | null>(null);
  const [publicSummary, setPublicSummary] = useState<PublicRacingSummary | null>(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], ["0%", "18%"]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.08]);

  useEffect(() => {
    let isMounted = true;
    async function loadLatestBlogs() {
      setBlogsLoading(true);
      setBlogsError(null);
      try {
        const data = await blogApi.getPublishedBlogs(undefined, 0, 3);
        if (isMounted) setLatestBlogs(Array.isArray(data.content) ? data.content : []);
      } catch (err) {
        console.error("Public blog preview unavailable.", err);
        if (isMounted) {
          setLatestBlogs([]);
          setBlogsError("Could not load the latest newsroom posts.");
        }
      } finally {
        if (isMounted) setBlogsLoading(false);
      }
    }
    loadLatestBlogs();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedRace() {
      setFeaturedRaceLoading(true);
      setFeaturedRaceError(null);
      try {
        const [upcoming, results, summary] = await Promise.all([
          searchPublicRaces({ scope: "UPCOMING", sortBy: "NEXT_RACE", page: 0, size: 3 }),
          searchPublicRaces({ scope: "RESULTS", sortBy: "LATEST_RESULT", page: 0, size: 1 }),
          getPublicRacingSummary(),
        ]);
        if (isMounted) {
          setFeaturedRace(selectNextToPost(upcoming.content, results.content));
          setPublicSummary(summary);
        }
      } catch (err) {
        console.error("Public featured race unavailable.", err);
        if (isMounted) {
          setFeaturedRace(null);
          setPublicSummary(null);
          setFeaturedRaceError("Could not load the featured race right now.");
        }
      } finally {
        if (isMounted) setFeaturedRaceLoading(false);
      }
    }

    loadFeaturedRace();
    return () => {
      isMounted = false;
    };
  }, []);

  const featuredStatus = featuredRace ? raceStatus(featuredRace.status) : null;
  const featuredDistance = featuredRace ? formatDistance(featuredRace.distanceMeters) : null;
  const homeStats = [
    { value: publicSummary ? String(publicSummary.raceCount) : "—", label: "Races on Calendar" },
    { value: publicSummary ? String(publicSummary.raceDayCount) : "—", label: "Race Days" },
    { value: publicSummary ? String(publicSummary.championshipCount) : "—", label: "Championships" },
    { value: publicSummary ? formatFinaleDate(publicSummary.seasonFinale ?? undefined) : "—", label: "Season Finale" },
  ];
  const marquee = [
    "Night at the Races",
    `${homeStats[0].value} Races on Calendar`,
    `${homeStats[1].value} Race Days`,
    `${homeStats[2].value} Championships`,
    `${homeStats[3].value} Season Finale`,
    "VND Pool Estimates",
  ];

  return (
    <div className="client-theme bg-turf-950 text-ivory">
      <ClientHeader />

      {/* ─────────────────────────────  HERO  ───────────────────────────── */}
      <section className="grain relative isolate overflow-hidden">
        <motion.div style={reduce ? undefined : { y: heroY, scale: heroScale }} className="absolute inset-0 -z-10">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-center" />
        </motion.div>
        <div className="turf-vignette absolute inset-0 -z-10" />
        {/* decorative racing rails */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
          <div className="absolute left-[18%] top-0 h-full w-px bg-gradient-to-b from-transparent via-gold-400/25 to-transparent" />
          <div className="absolute right-[22%] top-0 h-full w-px bg-gradient-to-b from-transparent via-emerald-glow/25 to-transparent" />
        </div>

        <div className="mx-auto flex min-h-[92vh] max-w-[1400px] flex-col justify-center px-6 py-28 md:px-12">
          <MotionStagger className="max-w-3xl" gap={0.14}>
            <MotionStaggerItem>
              <Eyebrow tone="gold">Official Championship Racing · NYC</Eyebrow>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <h1 className="mt-6 font-display text-[clamp(3.2rem,9vw,7.5rem)] font-light leading-[0.86] tracking-[-0.02em] text-ivory">
                Night at the
                <span className="block italic text-foil">Races.</span>
              </h1>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-ivory-dim sm:text-xl">
                Follow the form, read the newsroom, and step into the Prediction Arena across every
                published race day.
              </p>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  to="/championships"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-sm bg-gold-400 px-8 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-turf-950 shadow-[0_20px_50px_-12px_rgba(212,175,55,0.55)] transition-colors hover:bg-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory"
                >
                  Explore Championships
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/spectator/predictions"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-sm border border-ivory/25 px-8 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-ivory backdrop-blur-sm transition-colors hover:border-gold-400/70 hover:text-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400"
                >
                  <Play size={15} className="fill-current" />
                  Enter the Arena
                </Link>
              </div>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <p className="eyebrow mt-7 text-ivory-faint">VND wallet picks - final odds lock at race start</p>
            </MotionStaggerItem>
          </MotionStagger>
        </div>

        {/* Hero stat ribbon */}
        <MotionReveal
          as="div"
          className="relative z-10 border-t border-white/10 bg-turf-950/70 backdrop-blur-md"
          y={0}
        >
          <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-white/10 px-6 md:grid-cols-4 md:px-12">
            <FoilStat value={homeStats[0].value} label={homeStats[0].label} className="py-7 pr-6" />
            <FoilStat value={homeStats[1].value} label={homeStats[1].label} className="py-7 px-6" />
            <FoilStat value={homeStats[2].value} label={homeStats[2].label} className="py-7 px-6" />
            <FoilStat value={homeStats[3].value} label={homeStats[3].label} className="py-7 pl-6" />
          </div>
        </MotionReveal>
      </section>

      {/* ─────────────────────────  MARQUEE  ───────────────────────── */}
      <div className="relative overflow-hidden border-y border-gold-600/20 bg-turf-900 py-4">
        <div className={`flex w-max items-center gap-10 ${reduce ? "" : "animate-[marquee_28s_linear_infinite]"}`}>
          {[...marquee, ...marquee, ...marquee].map((word, i) => (
            <span key={i} className="flex items-center gap-10">
              <span className="font-display text-xl italic text-ivory/80">{word}</span>
              <span className="h-1.5 w-1.5 rotate-45 bg-gold-400" />
            </span>
          ))}
        </div>
        <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-33.33%)}}`}</style>
      </div>

      {/* ─────────────────────  CHAMPIONSHIP PILLARS  ───────────────────── */}
      <section id="championships" className="relative bg-turf-950 py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <MotionReveal className="max-w-2xl">
            <Eyebrow tone="emerald">The Season</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-light leading-tight tracking-tight text-ivory md:text-6xl">
              Everything the championship moves through.
            </h2>
            <GoldRule className="mt-7 w-24" />
          </MotionReveal>

          <MotionStagger className="mt-14 grid gap-5 md:grid-cols-3" gap={0.12}>
            {pillars.map(({ Icon, title, copy, to, cta }) => (
              <MotionStaggerItem key={title}>
                <Link
                  to={to}
                  className="group relative flex h-full min-h-[320px] flex-col justify-between overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-turf-900 to-turf-950 p-8 transition-all duration-500 hover:border-gold-400/40 hover:shadow-[0_30px_80px_-30px_rgba(212,175,55,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400"
                >
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-glow/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100 opacity-0" />
                  <div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold-400/30 bg-gold-400/5 text-gold-300 transition-colors group-hover:bg-gold-400/15">
                      <Icon size={22} strokeWidth={1.6} />
                    </span>
                    <h3 className="mt-7 font-display text-3xl font-medium tracking-tight text-ivory">{title}</h3>
                    <p className="mt-4 text-[15px] leading-relaxed text-ivory-dim">{copy}</p>
                  </div>
                  <span className="mt-8 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-gold-300">
                    {cta}
                    <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </div>
      </section>

      {/* ───────────────────────  FEATURED RACE  ─────────────────────── */}
      <section id="races" className="relative overflow-hidden bg-turf-900 py-24 md:py-32">
        <div className="mx-auto grid max-w-[1400px] items-center gap-14 px-6 md:px-12 lg:grid-cols-2">
          <MotionReveal>
            {featuredRaceLoading ? (
              <div aria-label="Loading featured race" className="animate-pulse">
                <div className="h-3 w-36 rounded-full bg-white/10" />
                <div className="mt-6 h-14 w-4/5 rounded bg-white/10" />
                <div className="mt-3 h-14 w-3/5 rounded bg-white/10" />
                <div className="mt-10 h-28 rounded-xl bg-white/10" />
              </div>
            ) : featuredRace && featuredStatus ? (
              <>
                <Eyebrow tone="gold">Featured Race</Eyebrow>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-ivory-faint">
                  {featuredRace.tournamentName}
                </p>
                <h2 className="mt-3 font-display text-4xl font-light leading-[1.02] tracking-tight text-ivory md:text-6xl">
                  {featuredRace.name}
                </h2>
                <p className="mt-7 max-w-md text-lg font-light leading-relaxed text-ivory-dim">
                  Open the race card for post time, distance, and the latest field details.
                </p>

                <dl className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {[
                    ["Post Time", formatPostTime(featuredRace.raceDateTime)],
                    ["Distance", featuredDistance ?? "TBA"],
                    ["Max Field", `${featuredRace.maxParticipants} max`],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-turf-950 px-5 py-6">
                      <dt className="eyebrow text-ivory-faint">{label}</dt>
                      <dd className="font-data mt-2 text-2xl font-semibold text-ivory">{value}</dd>
                    </div>
                  ))}
                </dl>

                <Link
                  to={`/races/${featuredRace.id}`}
                  aria-label={`Open ${featuredRace.name} race card`}
                  className="group mt-10 inline-flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.16em] text-gold-300 transition-colors hover:text-gold-200"
                >
                  Open Race Card
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            ) : (
              <>
                <Eyebrow tone="gold">Featured Race</Eyebrow>
                <h2 className="mt-5 font-display text-4xl font-light leading-[1.02] tracking-tight text-ivory md:text-6xl">
                  Race Calendar
                </h2>
                <p
                  role={featuredRaceError ? "alert" : undefined}
                  className="mt-7 max-w-md text-lg font-light leading-relaxed text-ivory-dim"
                >
                  {featuredRaceError ?? "No races are on the card yet."}
                </p>
                <Link
                  to="/races"
                  className="group mt-10 inline-flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.16em] text-gold-300 transition-colors hover:text-gold-200"
                >
                  View the Full Calendar
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </MotionReveal>

          <MotionReveal delay={0.15}>
            <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10">
              <img
                src={heroImage}
                alt="Thoroughbreds rounding the turn at Aqueduct"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-turf-950 via-turf-950/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-7">
                <div>
                  <p className="font-data text-[11px] uppercase tracking-[0.3em] text-gold-300">
                    {featuredRace?.code ?? "Race card"}
                  </p>
                  <p className="mt-2 font-display text-2xl font-medium text-ivory">
                    {featuredRace?.name ?? "Full calendar"}
                  </p>
                </div>
                {featuredStatus ? (
                  <StatusPill label={featuredStatus.label} tone={featuredStatus.tone} />
                ) : null}
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      {/* ─────────────────────  PREDICTION ARENA TEASER  ───────────────────── */}
      <section id="predictions" className="relative overflow-hidden bg-turf-950 py-24 md:py-32">
        <div className="rail-sweep pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-600/30" />
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-glow/25 bg-gradient-to-br from-turf-800 via-turf-900 to-turf-950 p-10 md:p-16">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-glow/15 blur-[100px]" />
            <div className="relative grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
              <MotionReveal>
                <Eyebrow tone="emerald">The Prediction Arena</Eyebrow>
                <h2 className="mt-5 font-display text-4xl font-light leading-tight tracking-tight text-ivory md:text-5xl">
                  Read the race. Earn the reward.
                </h2>
                <p className="mt-6 max-w-lg text-lg font-light leading-relaxed text-ivory-dim">
                  Make your race picks before the gates open. Your VND stake, projected return, and possible
                  loss are shown before confirmation.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <Link
                    to="/spectator/predictions"
                    className="group inline-flex items-center gap-2.5 rounded-sm bg-emerald-glow px-8 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-turf-950 transition-colors hover:bg-emerald-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory"
                  >
                    Enter the Arena
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                  <span className="eyebrow text-ivory-faint">Pool estimate, final at lock</span>
                </div>
              </MotionReveal>

              <MotionReveal delay={0.15}>
                <div className="space-y-3">
                  {[
                    ["01", "Pick the Winner", "Choose from the field before post time."],
                    ["02", "Set Your Stake", "Review the VND receipt before you confirm."],
                    ["03", "Settle at Lock", "Returns are based on the final locked odds."],
                  ].map(([n, t, d]) => (
                    <div
                      key={n}
                      className="flex items-start gap-5 rounded-xl border border-white/8 bg-turf-950/60 p-5 transition-colors hover:border-gold-400/30"
                    >
                      <span className="font-data text-2xl font-semibold text-gold-400">{n}</span>
                      <div>
                        <p className="font-display text-lg font-medium text-ivory">{t}</p>
                        <p className="mt-1 text-sm text-ivory-dim">{d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </MotionReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────  NEWSROOM  ─────────────────────────── */}
      <section className="bg-turf-900 py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <MotionReveal className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-xl">
              <Eyebrow tone="gold">The Newsroom</Eyebrow>
              <h2 className="mt-5 font-display text-4xl font-light leading-tight tracking-tight text-ivory md:text-6xl">
                From the championship desk.
              </h2>
            </div>
            <Link
              to="/blogs"
              className="group inline-flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.16em] text-gold-300 transition-colors hover:text-gold-200"
            >
              All Stories
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </MotionReveal>

          {blogsLoading ? (
            <div className="grid gap-6 md:grid-cols-3" aria-label="Loading latest stories">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-white/8 bg-turf-950 p-5">
                  <div className="aspect-video rounded-lg bg-white/5" />
                  <div className="mt-5 h-3 w-28 bg-white/5" />
                  <div className="mt-3 h-6 w-11/12 bg-white/5" />
                  <div className="mt-2 h-6 w-7/12 bg-white/5" />
                </div>
              ))}
            </div>
          ) : blogsError ? (
            <div className="rounded-2xl border-l-4 border-nyraRed bg-turf-950 px-6 py-5 text-sm font-semibold text-rose-300" role="alert">
              {blogsError}
            </div>
          ) : latestBlogs.length === 0 ? (
            <div className="rounded-2xl border-l-4 border-gold-400 bg-turf-950 px-6 py-5 text-sm font-semibold text-ivory-dim">
              No published stories yet — the newsroom opens with the season.
            </div>
          ) : (
            <MotionStagger className="grid gap-6 md:grid-cols-3" gap={0.12}>
              {latestBlogs.map((article) => (
                <MotionStaggerItem key={article.id}>
                  <Link
                    to={`/blogs/${article.slug}`}
                    aria-label={`Read ${article.title}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-turf-950 transition-all duration-500 hover:border-gold-400/40 hover:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={resolveFileUrl(article.thumbnail) || fallbackNews}
                        alt={article.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="eyebrow text-gold-300">
                        {article.authorName} · {formatBlogDate(article.createdAt)}
                      </p>
                      <h3 className="mt-3 font-display text-2xl font-medium leading-snug text-ivory transition-colors group-hover:text-gold-200">
                        {article.title}
                      </h3>
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ivory-dim">{article.summary}</p>
                    </div>
                  </Link>
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          )}
        </div>
      </section>

      {/* ─────────────────────────  JOIN PADDOCK  ───────────────────────── */}
      <section className="grain relative isolate overflow-hidden bg-turf-950 py-28 md:py-36">
        <div className="absolute inset-0 -z-10 opacity-25">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-center" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-turf-950 via-turf-950/85 to-turf-950/60" />
        <MotionReveal className="mx-auto max-w-3xl px-6 text-center md:px-12">
          <div className="flex justify-center">
            <Eyebrow tone="gold">Owner · Jockey · Referee</Eyebrow>
          </div>
          <h2 className="mt-6 font-display text-[clamp(2.6rem,6vw,5rem)] font-light leading-[0.95] tracking-tight text-ivory">
            Join the
            <span className="italic text-foil"> Paddock.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-lg font-light leading-relaxed text-ivory-dim">
            Build your profile, apply for a specialist role, and let the operations team bring you onto the
            championship circuit.
          </p>
          <Link
            to="/join-us"
            className="group mt-10 inline-flex items-center gap-2.5 rounded-sm bg-gold-400 px-9 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-turf-950 shadow-[0_20px_50px_-12px_rgba(212,175,55,0.55)] transition-colors hover:bg-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory"
          >
            Start Your Application
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </MotionReveal>
      </section>

      <ClientFooter />
    </div>
  );
}
