import { useState } from "react";
import { Calendar, Tag, TrendingUp, Flag } from "lucide-react";
import { UserPrediction, predictionStatusLabel, PredictionStatus, PredictionType } from "../types/prediction.types";
import { PredictionResultCard } from "./PredictionResultCard";
import { computePayout, formatVnd } from "../predictionCockpitUtils";
import { CreateDisputeModal } from "../../disputes/components/CreateDisputeModal";

const TYPE_LABEL: Record<PredictionType, string> = {
  WINNER: "Winner",
  EXACT_POSITION: "Exact Position",
  HEAD_TO_HEAD: "Head-to-Head",
  WINNING_STREAK: "Winning Streak",
};

function selectionLabel(p: UserPrediction): string {
  if (p.predictionType === "EXACT_POSITION") {
    return `${p.predictedWinnerName ?? "-"}${p.predictedPosition ? ` - Pos ${p.predictedPosition}` : ""}`;
  }
  return p.predictedWinnerName ?? "-";
}

interface MyPredictionsListProps {
  predictions: UserPrediction[];
}

type FilterStatus = "ALL" | "PENDING" | "LOCKED" | "CORRECT" | "INCORRECT" | "REFUNDED";

export function MyPredictionsList({ predictions }: MyPredictionsListProps) {
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [reportingPredictionId, setReportingPredictionId] = useState<number | null>(null);

  const filtered = predictions.filter((p) => {
    if (filter === "ALL") return true;
    if (filter === "CORRECT") return p.status === "CORRECT";
    if (filter === "INCORRECT") return p.status === "INCORRECT";
    if (filter === "PENDING") return p.status === "PENDING";
    if (filter === "LOCKED") return p.status === "LOCKED";
    if (filter === "REFUNDED") return p.status === "REFUNDED" || p.status === "CANCELLED";
    return true;
  }).sort((a, b) => b.id - a.id);

  const getStatusBadge = (status: PredictionStatus) => {
    switch (status) {
      case "PENDING":
        return "border-white/15 bg-white/5 text-ivory-dim";
      case "LOCKED":
        return "border-gold-600/40 bg-gold-400/10 text-gold-300";
      case "CORRECT":
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
                          <span className="text-ivory-faint/50">-</span>
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

                {(() => {
                  const stake = pred.wagerAmount ?? pred.entryCostPoints ?? 0;
                  const odds = pred.lockedOdds ?? null;
                  const showPotential = (pred.status === "PENDING" || pred.status === "LOCKED") && !!odds;
                  const { payout, profit, returnPct } = computePayout(stake, odds);
                  return (
                    <div className="my-4 space-y-2 rounded-xl border border-white/8 bg-turf-950 p-4 text-xs font-semibold text-ivory-dim">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-emerald-soft" />
                          {TYPE_LABEL[pred.predictionType] ?? pred.predictionType}
                        </span>
                        <span className="min-w-0 truncate text-right font-semibold text-ivory">{selectionLabel(pred)}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/8 pt-2">
                        <span>Stake</span>
                        <span className="font-data text-ivory">{formatVnd(stake)} VND</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Odds{showPotential ? " (provisional)" : ""}</span>
                        <span className="font-data font-bold text-gold-300">{odds ? odds.toFixed(2) : "-"}</span>
                      </div>
                      {showPotential && (
                        <div className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-emerald-glow/25 bg-emerald-glow/[0.07] px-3 py-2">
                          <span className="flex items-center gap-1.5 text-emerald-soft">
                            <TrendingUp className="h-3.5 w-3.5" /> If it wins
                          </span>
                          <span className="text-right leading-tight">
                            <span className="font-data text-sm font-black text-emerald-soft">{formatVnd(payout)} VND</span>
                            <span className="ml-1.5 font-data text-[11px] font-bold text-emerald-soft/80">
                              +{formatVnd(profit)} ({Math.round(returnPct)}%)
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {(pred.status === "CORRECT" ||
                  pred.status === "INCORRECT" ||
                  pred.status === "REFUNDED" ||
                  pred.status === "CANCELLED") && (
                  <PredictionResultCard
                    status={pred.status}
                    resultCategory={pred.resultCategory}
                    rewardPoints={pred.rewardPoints}
                    entryCost={pred.entryCostPoints}
                    predictionType={pred.predictionType}
                  />
                )}

                <div className="mt-4 flex items-center justify-between text-xs font-semibold border-t border-white/8 pt-3">
                  <p className="flex items-center gap-1.5 text-ivory-faint">
                    <Calendar className="h-4 w-4" />
                    {new Date(pred.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    - {new Date(pred.createdAt).toLocaleDateString("en-US")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setReportingPredictionId(pred.id)}
                    className="inline-flex items-center gap-1.5 rounded bg-rose-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300 transition-colors hover:bg-rose-500/20"
                    title="Report an issue with this prediction"
                  >
                    <Flag size={12} />
                    Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateDisputeModal
        isOpen={reportingPredictionId !== null}
        onClose={() => setReportingPredictionId(null)}
        referenceType="RACE_PREDICTION"
        referenceId={reportingPredictionId ?? 0}
      />
    </div>
  );
}
