import type { CSSProperties } from "react";

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

function silkStyle(seed: number | string | null | undefined): CSSProperties {
  const text = String(seed ?? "runner");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 2147483647;
  }
  const silk = SILK_PALETTE[Math.abs(hash) % SILK_PALETTE.length];
  return {
    background: `linear-gradient(135deg, ${silk.base} 0 38%, ${silk.stripe} 38% 52%, ${silk.base} 52% 100%)`,
    boxShadow: `inset 0 0 0 1px ${silk.accent}55`,
  };
}

export function SilkChip({
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
