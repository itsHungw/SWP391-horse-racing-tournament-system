import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { ClientHeader } from "../../components/client/ClientHeader";
import { ClientFooter } from "../../components/client/ClientFooter";
import { Eyebrow, GoldRule, MotionReveal, MotionStagger, MotionStaggerItem } from "../../components/client/primitives";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import heroImage from "../../assets/slide.jpg";

const previewRows = [
  { pos: "01", note: "Leading by championship points" },
  { pos: "02", note: "Form across the season" },
  { pos: "03", note: "Stakes wins and placings" },
];

export function LeaderboardPage() {
  useDocumentTitle("Leaderboard | Night at the Races");
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], ["0%", "20%"]);

  return (
    <div className="client-theme bg-turf-950 text-ivory">
      <ClientHeader />

      <section className="grain relative isolate overflow-hidden">
        <motion.div style={reduce ? undefined : { y: heroY }} className="absolute inset-0 -z-10">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-center opacity-45" />
        </motion.div>
        <div className="turf-vignette absolute inset-0 -z-10" />
        <div className="mx-auto max-w-[1400px] px-6 pb-16 pt-24 md:px-12 md:pb-24 md:pt-32">
          <MotionStagger className="max-w-3xl" gap={0.12}>
            <MotionStaggerItem>
              <Eyebrow tone="gold">The Standings</Eyebrow>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <h1 className="mt-6 font-display text-[clamp(2.8rem,7vw,6rem)] font-light leading-[0.9] tracking-[-0.02em]">
                Leaderboard<span className="text-foil">.</span>
              </h1>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-ivory-dim">
                The championship form — top horses and jockeys ranked across the running of the season.
              </p>
            </MotionStaggerItem>
          </MotionStagger>
        </div>
      </section>

      <section className="bg-turf-900 py-20 md:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 md:px-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <MotionReveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-turf-950/60 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400 live-pulse" />
              <span className="eyebrow text-gold-300">In Preparation</span>
            </span>
            <h2 className="mt-6 font-display text-3xl font-light leading-tight tracking-tight md:text-5xl">
              The official standings arrive with the first results.
            </h2>
            <GoldRule className="mt-6 w-20" />
            <p className="mt-6 max-w-lg text-lg font-light leading-relaxed text-ivory-dim">
              Once races are run and results are confirmed, the championship leaderboard will rank every
              contender by points, wins, and form. Until then, follow the calendar and step into the
              Prediction Arena.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/championships"
                className="group inline-flex items-center gap-2.5 rounded-sm bg-gold-400 px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.16em] text-turf-950 transition-colors hover:bg-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory"
              >
                View Championships
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/spectator/predictions"
                className="inline-flex items-center gap-2.5 rounded-sm border border-ivory/25 px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.16em] text-ivory transition-colors hover:border-gold-400/70 hover:text-gold-300"
              >
                Prediction Arena
              </Link>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.15}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-turf-950">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <Eyebrow tone="emerald">Championship Standings</Eyebrow>
                <span className="font-data text-xs uppercase tracking-[0.2em] text-ivory-faint">Preview</span>
              </div>
              <ul>
                {previewRows.map((row) => (
                  <li key={row.pos} className="flex items-center gap-5 border-b border-white/5 px-6 py-5 last:border-0">
                    <span className="font-data text-2xl font-semibold text-foil">{row.pos}</span>
                    <div className="flex-1">
                      <div className="h-3 w-2/3 rounded bg-white/10" />
                      <p className="mt-2 text-xs text-ivory-faint">{row.note}</p>
                    </div>
                    <div className="h-8 w-16 rounded bg-white/5" />
                  </li>
                ))}
              </ul>
            </div>
          </MotionReveal>
        </div>
      </section>

      <ClientFooter />
    </div>
  );
}
