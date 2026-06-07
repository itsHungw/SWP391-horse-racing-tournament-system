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
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "LOCKED":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "CORRECT":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "INCORRECT":
        return "bg-slate-100 text-slate-500 border-slate-200";
      case "REFUNDED":
      case "CANCELLED":
        return "bg-orange-50 text-orange-800 border-orange-200";
      default:
        return "bg-slate-100 text-slate-700";
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
              className={`px-3 py-1.5 rounded-full border text-xs font-black tracking-wider uppercase transition cursor-pointer ${
                isActive
                  ? "bg-[#006d5b] text-white border-[#006d5b]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 font-bold">
          No predictions found matching the filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((pred) => {
            const isPending = pred.status === "PENDING";
            const showEdit = isPending;
            
            return (
              <div key={pred.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-950">{pred.raceName || "Race"}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                      {pred.roundName || "Round"}
                    </p>
                  </div>
                  <span className={`border px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider ${getStatusBadge(pred.status)}`}>
                    {predictionStatusLabel[pred.status] || pred.status}
                  </span>
                </div>

                <div className="my-4 bg-slate-50 border border-slate-100 rounded-md p-3 text-xs font-bold text-slate-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 opacity-60 text-[#006d5b]" />
                      Type:
                    </span>
                    <span className="font-black text-slate-950 uppercase">{pred.predictionType}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2">
                    <p className="text-slate-500 mb-1">Selections:</p>
                    <p className="font-black text-slate-950 leading-relaxed">
                      1st: {pred.predictedWinnerName || `ID #${pred.predictedWinnerId}`}
                    </p>
                    {pred.predictionType === "TOP3" && (
                      <>
                        <p className="font-black text-slate-950 leading-relaxed mt-1">
                          2nd: {pred.predictedSecondName || `ID #${pred.predictedSecondId}`}
                        </p>
                        <p className="font-black text-slate-950 leading-relaxed mt-1">
                          3rd: {pred.predictedThirdName || `ID #${pred.predictedThirdId}`}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span>Entry Cost:</span>
                    <span className="font-black text-slate-950">{pred.entryCostPoints} points</span>
                  </div>
                </div>

                {(pred.status === "CORRECT" || pred.status === "INCORRECT" || pred.status === "REFUNDED" || pred.status === "CANCELLED") && (
                  <PredictionResultCard 
                    status={pred.status}
                    resultCategory={pred.resultCategory}
                    rewardPoints={pred.rewardPoints}
                    entryCost={pred.entryCostPoints}
                  />
                )}

                {showEdit && (
                  <div className="mt-4 flex justify-between items-center text-xs font-semibold">
                    <p className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 opacity-60" />
                      Submitted at: {new Date(pred.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })} - {new Date(pred.createdAt).toLocaleDateString("en-US")}
                    </p>
                    <button
                      type="button"
                      onClick={() => onEditPrediction(pred)}
                      className="rounded border border-[#006d5b] text-[#006d5b] hover:bg-emerald-50 px-3.5 py-2 font-black uppercase tracking-wider cursor-pointer transition"
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
