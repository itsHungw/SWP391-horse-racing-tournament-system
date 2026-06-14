import { toneClasses, type StatusTone } from "../publicRacingData";

/** Shared status pill — one visual status language across all public pages. */
export function StatusPill({ tone, label }: { tone: StatusTone; label: string }) {
  const c = toneClasses[tone];
  const isLive = tone === "live" || tone === "open";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border ${c.ring} bg-turf-950/60 px-3 py-1`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot} ${isLive ? "live-pulse" : ""}`} />
      <span className={`eyebrow ${c.text}`}>{label}</span>
    </span>
  );
}
