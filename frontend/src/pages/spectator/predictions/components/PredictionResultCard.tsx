import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface PredictionResultCardProps {
  status: string;
  resultCategory: string;
  rewardPoints: number;
  entryCost: number;
}

export function PredictionResultCard({ status, resultCategory, rewardPoints, entryCost }: PredictionResultCardProps) {
  if (status === "REFUNDED" || resultCategory === "REFUNDED") {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-gold-600/30 bg-gold-400/5 px-4 py-3 text-xs font-semibold text-gold-200">
        <RefreshCw className="h-4 w-4 shrink-0 text-gold-300" />
        <div>
          <p className="font-data uppercase tracking-[0.14em] text-gold-300">Refunded</p>
          <p className="mt-0.5 text-ivory-dim">Refunded {entryCost} points because the race was cancelled.</p>
        </div>
      </div>
    );
  }

  const isCorrect =
    status === "CORRECT" ||
    status === "CORRECT_EXACT" ||
    status === "CORRECT_ANY_ORDER" ||
    resultCategory === "WINNER_CORRECT" ||
    resultCategory === "TOP3_EXACT" ||
    resultCategory === "TOP3_ANY_ORDER";

  if (isCorrect) {
    let label = "Correct Prediction";
    if (resultCategory === "TOP3_EXACT" || status === "CORRECT_EXACT") label = "Correct · Exact Order";
    else if (resultCategory === "TOP3_ANY_ORDER" || status === "CORRECT_ANY_ORDER") label = "Correct · Any Order";

    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-emerald-glow/40 bg-emerald-glow/10 px-4 py-3 text-xs font-semibold text-emerald-soft">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-soft" />
        <div>
          <p className="font-data uppercase tracking-[0.14em]">{label}</p>
          <p className="mt-0.5 text-ivory-dim">Rewarded +{rewardPoints} points added to your balance.</p>
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
