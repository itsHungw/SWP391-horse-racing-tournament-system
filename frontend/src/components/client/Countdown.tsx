import { useEffect, useState } from "react";

type Parts = { d: number; h: number; m: number; s: number };

function diffParts(targetMs: number): Parts | null {
  const diff = targetMs - Date.now();
  if (diff <= 0) return null;
  const total = Math.floor(diff / 1000);
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

function Segment({ value, unit }: { value: number; unit: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="font-data text-2xl font-semibold leading-none text-foil sm:text-3xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="font-data mt-1.5 text-[10px] uppercase tracking-[0.2em] text-ivory-faint">{unit}</span>
    </span>
  );
}

/** Live countdown to a date. Shows `doneLabel` once the moment passes. */
export function Countdown({
  target,
  doneLabel = "Underway",
  className = "",
}: {
  target: string;
  doneLabel?: string;
  className?: string;
}) {
  const targetMs = new Date(target).getTime();
  const [parts, setParts] = useState<Parts | null>(() =>
    Number.isNaN(targetMs) ? null : diffParts(targetMs),
  );

  useEffect(() => {
    if (Number.isNaN(targetMs)) return;
    setParts(diffParts(targetMs));
    const id = setInterval(() => setParts(diffParts(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (Number.isNaN(targetMs)) return null;

  if (!parts) {
    return (
      <span role="timer" aria-label="Time to post" className={`eyebrow text-gold-300 ${className}`}>
        {doneLabel}
      </span>
    );
  }

  return (
    <span
      role="timer"
      aria-label="Time to post"
      className={`inline-flex items-end gap-4 ${className}`}
    >
      {parts.d > 0 && <Segment value={parts.d} unit="days" />}
      <Segment value={parts.h} unit="hrs" />
      <Segment value={parts.m} unit="min" />
      <Segment value={parts.s} unit="sec" />
    </span>
  );
}
