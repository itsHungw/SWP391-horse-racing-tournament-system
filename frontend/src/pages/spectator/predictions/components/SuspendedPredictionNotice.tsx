import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";

export function SuspendedPredictionNotice() {
  return (
    <section
      aria-labelledby="prediction-restriction-title"
      className="relative mb-4 overflow-hidden rounded-lg border border-amber-300/25 bg-[#2a1015] px-5 py-4 shadow-[0_18px_50px_-38px_rgba(0,0,0,.9)]"
    >
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-amber-400" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-300/10 text-amber-300">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-data text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
              Account under review
            </p>
            <h1 id="prediction-restriction-title" className="mt-1 font-display text-xl font-bold text-ivory">
              Predictions are temporarily paused
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ivory-dim">
              You can still review races, odds, existing positions, and settlements. New predictions remain unavailable while your account is under review.
            </p>
          </div>
        </div>
        <Link
          to="/account-restricted"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-amber-300/35 px-4 text-sm font-black text-amber-200 transition-colors hover:bg-amber-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          Review account status <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
