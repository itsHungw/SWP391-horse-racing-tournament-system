import { Link } from "react-router-dom";
import { Award, Compass } from "lucide-react";

interface PredictionArenaHeaderProps {
  pointBalance: number;
}

export function PredictionArenaHeader({ pointBalance }: PredictionArenaHeaderProps) {
  return (
    <div className="grain relative isolate overflow-hidden rounded-2xl border border-emerald-glow/25 bg-gradient-to-br from-turf-800 via-turf-900 to-turf-950 p-7 sm:p-9">
      <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-emerald-glow/15 blur-[90px]" />
      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="eyebrow inline-flex items-center gap-2 text-emerald-soft">
            <Compass className="h-3.5 w-3.5" />
            Engagement Portal
          </p>
          <h1 className="mt-4 font-display text-4xl font-light tracking-tight text-ivory md:text-5xl">
            Prediction Arena
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-ivory-dim">
            Use your prediction funds to forecast race outcomes and earn real rewards. Free to
            play, open to all registered users.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-5 rounded-2xl border border-gold-600/30 bg-turf-950/60 p-5 backdrop-blur-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/10 text-gold-300">
            <Award className="h-6 w-6" />
          </span>
          <div>
            <p className="eyebrow text-gold-300">Wallet Balance</p>
            <p className="font-data mt-1 text-3xl font-semibold leading-none text-foil">{pointBalance}</p>
            <Link
              to="/blogs"
              className="mt-2 inline-block text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-soft transition-colors hover:text-emerald-glow"
            >
              Read stories to earn VND {"->"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
