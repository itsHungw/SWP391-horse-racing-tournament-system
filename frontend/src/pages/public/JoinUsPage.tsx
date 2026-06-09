import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Crown, Flag, ShieldCheck } from "lucide-react";

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
import { useClientSession } from "../../hooks/useClientSession";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import heroImage from "../../assets/slide.jpg";

const roles = [
  {
    Icon: Crown,
    title: "Owner",
    eyebrow: "Stable Operations",
    description:
      "Enter your stable, manage championship registrations, and prepare the horse ownership workflows ahead.",
    requirements: ["Verified account email", "Owner intent statement", "Profile contact details"],
  },
  {
    Icon: Flag,
    title: "Jockey",
    eyebrow: "Race Participation",
    description:
      "Apply as a verified jockey for race-day participation, championship line-ups, and performance tracking.",
    requirements: ["Complete personal profile", "Submit riding background", "Wait for admin review"],
  },
  {
    Icon: ShieldCheck,
    title: "Referee",
    eyebrow: "Championship Integrity",
    description:
      "Uphold fair racing through referee access, race oversight, and structured review workflows.",
    requirements: ["Operational experience", "Clear review reason", "Admin approval required"],
  },
];

const applicationSteps = [
  { title: "Create an account", copy: "Register and verify your email to enter the system." },
  { title: "Complete your profile", copy: "Add the contact and background details for your role." },
  { title: "Choose a role", copy: "Apply as Owner, Jockey, or Referee from your dashboard." },
  { title: "Admin review", copy: "The operations team reviews and approves your application." },
];

export function JoinUsPage() {
  useDocumentTitle("Join the Paddock | Night at the Races");
  const reduce = useReducedMotion();
  const { isAuthenticated } = useClientSession();
  const primaryCtaHref = isAuthenticated ? "/my-role-requests" : "/register";
  const primaryCtaLabel = isAuthenticated ? "Start Application" : "Create Account";

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], ["0%", "20%"]);

  return (
    <div className="client-theme bg-turf-950 text-ivory">
      <ClientHeader />

      {/* Hero */}
      <section className="grain relative isolate overflow-hidden">
        <motion.div style={reduce ? undefined : { y: heroY }} className="absolute inset-0 -z-10">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-center opacity-45" />
        </motion.div>
        <div className="turf-vignette absolute inset-0 -z-10" />
        <div className="mx-auto max-w-[1400px] px-6 pb-16 pt-24 md:px-12 md:pb-20 md:pt-32">
          <MotionStagger className="max-w-3xl" gap={0.12}>
            <MotionStaggerItem>
              <Eyebrow tone="gold">Join the Championship Paddock</Eyebrow>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <h1 className="mt-6 font-display text-[clamp(2.8rem,7vw,6.5rem)] font-light leading-[0.9] tracking-[-0.02em]">
                Join the <span className="italic text-foil">Paddock.</span>
              </h1>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-ivory-dim">
                Join the racing championship as an owner, jockey, or referee. Build your profile, apply for a
                specialist role, and let the operations team review your application.
              </p>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href={primaryCtaHref}
                  className="group inline-flex items-center justify-center gap-2.5 rounded-sm bg-gold-400 px-8 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-turf-950 shadow-[0_20px_50px_-12px_rgba(212,175,55,0.55)] transition-colors hover:bg-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory"
                >
                  {primaryCtaLabel}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="#application-flow"
                  className="inline-flex items-center justify-center border-b border-ivory/30 px-2 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-ivory transition-colors hover:border-gold-400 hover:text-gold-300"
                >
                  View Application Flow
                </a>
              </div>
            </MotionStaggerItem>
          </MotionStagger>

          <MotionReveal className="mt-14" y={0}>
            <div className="grid max-w-2xl grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-turf-950/60 backdrop-blur-md">
              <FoilStat value="03" label="Specialist Roles" className="px-6 py-6" />
              <FoilStat value="04" label="Application Steps" className="px-6 py-6" />
              <FoilStat value="24h" label="Verification Support" className="px-6 py-6" />
            </div>
          </MotionReveal>
        </div>
      </section>

      {/* Roles */}
      <section className="bg-turf-900 py-20 md:py-28" aria-labelledby="roles-title">
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <MotionReveal className="max-w-2xl">
            <Eyebrow tone="emerald">Open Applications</Eyebrow>
            <h2 id="roles-title" className="mt-4 font-display text-3xl font-light tracking-tight md:text-5xl">
              Choose your track.
            </h2>
            <GoldRule className="mt-6 w-20" />
          </MotionReveal>

          <MotionStagger className="mt-14 grid gap-6 lg:grid-cols-3" gap={0.12}>
            {roles.map(({ Icon, title, eyebrow, description, requirements }) => (
              <MotionStaggerItem key={title}>
                <article className="group flex h-full flex-col justify-between rounded-2xl border border-white/8 bg-gradient-to-b from-turf-900 to-turf-950 p-8 transition-all duration-500 hover:border-gold-400/40 hover:shadow-[0_30px_80px_-30px_rgba(212,175,55,0.3)]">
                  <div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold-400/30 bg-gold-400/5 text-gold-300 transition-colors group-hover:bg-gold-400/15">
                      <Icon size={22} strokeWidth={1.6} />
                    </span>
                    <p className="eyebrow mt-6 text-gold-300">{eyebrow}</p>
                    <h3 className="mt-3 font-display text-3xl font-medium tracking-tight text-ivory transition-colors group-hover:text-gold-200">
                      {title}
                    </h3>
                    <p className="mt-4 text-[15px] leading-relaxed text-ivory-dim">{description}</p>
                    <ul className="mt-6 space-y-3">
                      {requirements.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm text-ivory-dim">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold-400" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a
                    href={primaryCtaHref}
                    className="group/cta mt-8 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-gold-300 transition-colors hover:text-gold-200"
                  >
                    Apply for {title}
                    <ArrowRight size={14} className="transition-transform group-hover/cta:translate-x-1" />
                  </a>
                </article>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </div>
      </section>

      {/* Application flow */}
      <section
        id="application-flow"
        className="relative overflow-hidden bg-turf-950 py-24 md:py-32"
        aria-labelledby="flow-title"
      >
        <div className="rail-sweep pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-600/30" />
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <MotionReveal className="max-w-2xl">
            <Eyebrow tone="gold">The Qualification Lane</Eyebrow>
            <h2 id="flow-title" className="mt-4 font-display text-3xl font-light tracking-tight md:text-5xl">
              From account to review.
            </h2>
            <p className="mt-5 max-w-lg text-lg font-light text-ivory-dim">
              Four steps along the rail — the same clean path for every specialist role.
            </p>
          </MotionReveal>

          <MotionStagger className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4" gap={0.1}>
            {applicationSteps.map((step, index) => (
              <MotionStaggerItem key={step.title}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/8 bg-turf-900 p-7 transition-colors hover:border-gold-400/40">
                  <span className="font-data text-5xl font-semibold text-foil">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-6 font-display text-xl font-medium text-ivory">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ivory-dim">{step.copy}</p>
                  {index < applicationSteps.length - 1 ? (
                    <span className="pointer-events-none absolute right-5 top-9 hidden text-gold-400/40 lg:block">
                      <ArrowRight size={20} />
                    </span>
                  ) : null}
                </div>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </div>
      </section>

      {/* Final CTA */}
      <section className="grain relative isolate overflow-hidden bg-turf-900 py-24 md:py-32">
        <div className="absolute inset-0 -z-10 opacity-20">
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-turf-900 via-turf-900/85 to-turf-900/55" />
        <MotionReveal className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center md:px-12">
          <div className="max-w-2xl">
            <Eyebrow tone="emerald">Ready for the paddock?</Eyebrow>
            <h2 className="mt-5 font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">
              Put your profile in front of the operations team.
            </h2>
          </div>
          <a
            href={primaryCtaHref}
            className="group inline-flex items-center gap-2.5 rounded-sm bg-gold-400 px-9 py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-turf-950 shadow-[0_20px_50px_-12px_rgba(212,175,55,0.55)] transition-colors hover:bg-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory"
          >
            {primaryCtaLabel}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </a>
        </MotionReveal>
      </section>

      <ClientFooter />
    </div>
  );
}
