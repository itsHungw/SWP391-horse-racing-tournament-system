import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface PredictionResultCardProps {
  status: string;
  resultCategory: string;
  rewardPoints: number;
  entryCost: number;
  predictionType: string;
}

export function PredictionResultCard({ status, resultCategory, rewardPoints, entryCost, predictionType }: PredictionResultCardProps) {
  if (status === "REFUNDED" || resultCategory === "REFUNDED") {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-gold-600/30 bg-gold-400/5 px-4 py-3 text-xs font-semibold text-gold-200">
        <RefreshCw className="h-4 w-4 shrink-0 text-gold-300" />
        <div>
          <p className="font-data uppercase tracking-[0.14em] text-gold-300">Refunded</p>
          <p className="mt-0.5 text-ivory-dim">Refunded {entryCost} VND because the race was cancelled.</p>
        </div>
      </div>
    );
  }

  const isWin =
    status === "CORRECT" ||
    resultCategory === "EXACT_POSITION_CORRECT" ||
    resultCategory === "HEAD_TO_HEAD_CORRECT";

  if (isWin) {
    let label = "Correct Prediction";
    if (predictionType === "HEAD_TO_HEAD") label = "Correct · Head to Head";

    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-emerald-glow/40 bg-emerald-glow/10 px-4 py-3 text-xs font-semibold text-emerald-soft">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-soft" />
        <div>
          <p className="font-data uppercase tracking-[0.14em]">{label}</p>
          <p className="mt-0.5 text-ivory-dim">Rewarded +{rewardPoints} VND added to your balance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-ivory-dim">
      <XCircle className="h-4 w-4 shrink-0 text-ivory-faint" />
      <div>
        <p className="font-data uppercase tracking-[0.14em] text-ivory">Incorrect</p>
        <p className="mt-0.5 text-ivory-faint">This prediction did not match the official race results.</p>
      </div>
    </div>
  );
}
