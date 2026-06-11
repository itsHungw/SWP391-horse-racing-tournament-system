import { useState } from "react";
import { Calendar, Tag } from "lucide-react";
import { UserPrediction, predictionStatusLabel, PredictionStatus } from "../types/prediction.types";
import { PredictionResultCard } from "./PredictionResultCard";

interface MyPredictionsListProps {
  predictions: UserPrediction[];
  onEditPrediction: (prediction: UserPrediction) => void;
}

type FilterStatus = "ALL" | "PENDING" | "LOCKED" | "CORRECT" | "INCORRECT" | "REFUNDED";

export function MyPredictionsList({ predictions, onEditPrediction }: MyPredictionsListProps) {
  const [filter, setFilter] = useState<FilterStatus>("ALL");

  const filtered = predictions.filter((p) => {
    if (filter === "ALL") return true;
    if (filter === "CORRECT") return p.status === "CORRECT";
    if (filter === "INCORRECT") return p.status === "INCORRECT";
    if (filter === "PENDING") return p.status === "PENDING";
    if (filter === "LOCKED") return p.status === "LOCKED";
    if (filter === "REFUNDED") return p.status === "REFUNDED" || p.status === "CANCELLED";
    return true;
  });

  const getStatusBadge = (status: PredictionStatus) => {
    switch (status) {
      case "PENDING":
        return "border-white/15 bg-white/5 text-ivory-dim";
      case "LOCKED":
        return "border-gold-600/40 bg-gold-400/10 text-gold-300";
      case "CORRECT":
      case "CORRECT_EXACT":
      case "CORRECT_ANY_ORDER":
        return "border-emerald-glow/40 bg-emerald-glow/10 text-emerald-soft";
      case "INCORRECT":
        return "border-white/10 bg-white/5 text-ivory-faint";
      case "REFUNDED":
      case "CANCELLED":
        return "border-gold-600/30 bg-gold-400/5 text-gold-200";
      default:
        return "border-white/15 bg-white/5 text-ivory-dim";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PENDING", "LOCKED", "CORRECT", "INCORRECT", "REFUNDED"] as FilterStatus[]).map((st) => {
          let label = "All";
          if (st === "PENDING") label = "Pending";
          else if (st === "LOCKED") label = "Locked";
          else if (st === "CORRECT") label = "Correct";
          else if (st === "INCORRECT") label = "Incorrect";
          else if (st === "REFUNDED") label = "Refunded";

          const isActive = filter === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                isActive
                  ? "border-emerald-glow bg-emerald-glow text-turf-950"
                  : "border-white/12 text-ivory-dim hover:border-white/25 hover:text-ivory"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-turf-900 p-8 text-center text-sm font-semibold text-ivory-dim">
          No predictions found matching the filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((pred) => {
            const isPending = pred.status === "PENDING";
            return (
              <div key={pred.id} className="rounded-2xl border border-white/8 bg-turf-900 p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-medium text-ivory">
                      {pred.championshipName || "Championship"}
                    </h3>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-data text-[10px] uppercase tracking-[0.16em] text-ivory-faint">
                      <span>{pred.roundName || `Round ${pred.roundNumber ?? 1}`}</span>
                      {pred.roundCode && (
                        <>
                          <span className="text-ivory-faint/50">•</span>
                          <span>{pred.roundCode}</span>
                        </>
                      )}
                    </p>
                    {pred.raceName && (
                      <p className="mt-0.5 font-data text-[10px] uppercase tracking-[0.16em] text-ivory-faint/80">
                        {pred.raceName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-data text-[10px] uppercase tracking-[0.14em] ${getStatusBadge(
                      pred.status,
                    )}`}
                  >
                    {predictionStatusLabel[pred.status] || pred.status}
                  </span>
                </div>

                <div className="my-4 space-y-2 rounded-xl border border-white/8 bg-turf-950 p-4 text-xs font-semibold text-ivory-dim">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-emerald-soft" />
                      Type
                    </span>
                    <span className="font-data uppercase text-ivory">{pred.predictionType}</span>
                  </div>
                  <div className="border-t border-white/8 pt-2">
                    <p className="mb-1 text-ivory-faint">Selections</p>
                    <p className="font-semibold leading-relaxed text-ivory">
                      <span className="font-data text-gold-300">1st</span>{" "}
                      {pred.predictedWinnerName || `ID #${pred.predictedWinnerId}`}
                    </p>
                    {pred.predictionType === "TOP3" && (
                      <>
                        <p className="mt-1 font-semibold leading-relaxed text-ivory">
                          <span className="font-data text-gold-300">2nd</span>{" "}
                          {pred.predictedSecondName || `ID #${pred.predictedSecondId}`}
                        </p>
                        <p className="mt-1 font-semibold leading-relaxed text-ivory">
                          <span className="font-data text-gold-300">3rd</span>{" "}
                          {pred.predictedThirdName || `ID #${pred.predictedThirdId}`}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex justify-between border-t border-white/8 pt-2">
                    <span>Entry Cost</span>
                    <span className="font-data text-ivory">{pred.entryCostPoints} pts</span>
                  </div>
                </div>

                {(pred.status === "CORRECT" ||
                  pred.status === "CORRECT_EXACT" ||
                  pred.status === "CORRECT_ANY_ORDER" ||
                  pred.status === "INCORRECT" ||
                  pred.status === "REFUNDED" ||
                  pred.status === "CANCELLED") && (
                  <PredictionResultCard
                    status={pred.status}
                    resultCategory={pred.resultCategory}
                    rewardPoints={pred.rewardPoints}
                    entryCost={pred.entryCostPoints}
                  />
                )}

                {isPending && (
                  <div className="mt-4 flex items-center justify-between text-xs font-semibold">
                    <p className="flex items-center gap-1.5 text-ivory-faint">
                      <Calendar className="h-4 w-4" />
                      {new Date(pred.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {new Date(pred.createdAt).toLocaleDateString("en-US")}
                    </p>
                    <button
                      type="button"
                      onClick={() => onEditPrediction(pred)}
                      className="cursor-pointer rounded-md border border-emerald-glow/50 px-3.5 py-2 font-bold uppercase tracking-[0.14em] text-emerald-soft transition-colors hover:bg-emerald-glow/10"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
