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
      <div className="rounded bg-orange-50 border border-orange-200 px-4 py-3 text-xs font-bold text-orange-800 flex items-center gap-2">
        <RefreshCw className="h-4.5 w-4.5 text-orange-600 animate-spin" />
        <div>
          <p className="font-black uppercase tracking-wide">Refunded</p>
          <p className="mt-0.5 text-orange-700">Refunded {entryCost} points because the race was cancelled.</p>
        </div>
      </div>
    );
  }

  const isCorrect = status === "CORRECT" || 
                    status === "CORRECT_EXACT" ||
                    status === "CORRECT_ANY_ORDER" ||
                    resultCategory === "WINNER_CORRECT" || 
                    resultCategory === "TOP3_EXACT" || 
                    resultCategory === "TOP3_ANY_ORDER";

  if (isCorrect) {
    let label = "Correct Prediction";
    if (resultCategory === "TOP3_EXACT" || status === "CORRECT_EXACT") label = "Correct Prediction (Exact Order)";
    else if (resultCategory === "TOP3_ANY_ORDER" || status === "CORRECT_ANY_ORDER") label = "Correct Prediction (Any Order)";

    return (
      <div className="rounded bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
        <CheckCircle2 className="h-4.5 w-4.5 text-[#006d5b]" />
        <div>
          <p className="font-black uppercase tracking-wide">{label}</p>
          <p className="mt-0.5 text-emerald-700">Rewarded +{rewardPoints} points added to available balance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded bg-slate-50 border border-slate-200 px-4 py-3 text-xs font-bold text-slate-800 flex items-center gap-2">
      <XCircle className="h-4.5 w-4.5 text-slate-500" />
      <div>
        <p className="font-black uppercase tracking-wide">Incorrect</p>
        <p className="mt-0.5 text-slate-600">This prediction did not match the official race results.</p>
      </div>
    </div>
  );
}
