import { Compass, Award } from "lucide-react";

interface PredictionArenaHeaderProps {
  pointBalance: number;
}

export function PredictionArenaHeader({ pointBalance }: PredictionArenaHeaderProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 mb-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b] flex items-center gap-1.5">
            <Compass className="h-4 w-4" />
            Engagement Portal
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            Prediction Arena
          </h1>
          <p className="mt-2 text-sm text-slate-600 font-bold leading-relaxed">
            Use Prediction Points to forecast race outcomes and earn virtual reward points.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 shrink-0 flex items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#006d5b] text-white">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Prediction Points</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{pointBalance} points available</p>
            <a
              className="mt-1 block text-xs font-black text-[#006d5b] hover:text-[#004d3d] hover:underline"
              href="#blog"
            >
              Read articles to earn points
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
