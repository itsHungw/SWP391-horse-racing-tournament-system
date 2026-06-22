import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* ════════════════════════════════════════════════════════════════
   Client design-system primitives — "Night at the Races"
   A small, cohesive vocabulary so every public page speaks the same
   visual language instead of inventing its own.
   ════════════════════════════════════════════════════════════════ */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Viewport-reveal wrapper. Honors prefers-reduced-motion automatically. */
export function MotionReveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.75, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}

/** Stagger container — children should be <MotionStaggerItem>. */
export function MotionStagger({
  children,
  className,
  gap = 0.12,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function MotionStaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Uppercase mono eyebrow with a gold tick — the signature label motif. */
export function Eyebrow({
  children,
  tone = "gold",
  className = "",
}: {
  children: ReactNode;
  tone?: "gold" | "emerald" | "ivory";
  className?: string;
}) {
  const dot =
    tone === "emerald"
      ? "bg-emerald-soft"
      : tone === "ivory"
        ? "bg-ivory-dim"
        : "bg-gold-400";
  const text =
    tone === "emerald"
      ? "text-emerald-soft"
      : tone === "ivory"
        ? "text-ivory-dim"
        : "text-gold-300";

  return (
    <span className={`eyebrow inline-flex items-center gap-2.5 ${text} ${className}`}>
      <span className={`h-1.5 w-1.5 rotate-45 ${dot}`} aria-hidden="true" />
      {children}
    </span>
  );
}

/** Thin gold-leaf rule, fades to the right. */
export function GoldRule({ className = "" }: { className?: string }) {
  return <span className={`gold-rule block h-px ${className}`} aria-hidden="true" />;
}

/** Big foil numeral used for stats / race numbers. */
export function FoilStat({
  value,
  label,
  className = "",
}: {
  value: ReactNode;
  label: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="font-data text-foil text-4xl font-semibold leading-none sm:text-5xl">{value}</p>
      <p className="eyebrow mt-3 text-ivory-faint">{label}</p>
    </div>
  );
}
