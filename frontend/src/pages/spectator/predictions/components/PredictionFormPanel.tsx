import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { OpenRacePrediction, PredictionOptions } from "../types/prediction.types";
import { CommunityChoices } from "./CommunityChoices";

interface PredictionFormPanelProps {
  race: OpenRacePrediction | null;
  options: PredictionOptions | null;
  pointBalance: number;
  onSubmit: (payload: {
    raceId: number;
    predictionType: "WINNER" | "TOP3";
    predictedWinnerId: number;
    predictedSecondId?: number | null;
    predictedThirdId?: number | null;
  }) => Promise<void>;
  onUpdate: (predictionId: number, payload: {
    raceId: number;
    predictionType: "WINNER" | "TOP3";
    predictedWinnerId: number;
    predictedSecondId?: number | null;
    predictedThirdId?: number | null;
  }) => Promise<void>;
}

export function PredictionFormPanel({ race, options, pointBalance, onSubmit, onUpdate }: PredictionFormPanelProps) {
  const [predType, setPredType] = useState<"WINNER" | "TOP3">("WINNER");
  const [winnerId, setWinnerId] = useState<string>("");
  const [secondId, setSecondId] = useState<string>("");
  const [thirdId, setThirdId] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const existingPred = options?.myPredictions?.find(p => p.predictionType === predType);
  const predictionOpen = options?.predictionOpen ?? false;

  useEffect(() => {
    if (existingPred) {
      setWinnerId(existingPred.predictedWinnerId.toString());
      setSecondId(existingPred.predictedSecondId ? existingPred.predictedSecondId.toString() : "");
      setThirdId(existingPred.predictedThirdId ? existingPred.predictedThirdId.toString() : "");
    } else {
      setWinnerId("");
      setSecondId("");
      setThirdId("");
    }
    setFormError(null);
  }, [existingPred, predType, options]);

  if (!race || !options) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500 font-bold h-full flex flex-col justify-center items-center">
        <ShieldAlert className="h-12 w-12 text-slate-300 mb-4" />
        Select a race on the left to start predicting.
      </div>
    );
  }

  const cost = predType === "WINNER" ? options.entryCost.winner : options.entryCost.top3;
  const pointsSufficient = pointBalance >= cost;
  
  const getHorseNameById = (idStr: string) => {
    const opt = options.options.find(o => o.raceParticipantId.toString() === idStr);
    return opt ? `#${opt.startNumber} {${opt.horseName}} (${opt.jockeyName})` : "";
  };

  const handleValidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!winnerId) {
      setFormError("Please select a horse for 1st place.");
      return;
    }

    if (predType === "TOP3") {
      if (!secondId || !thirdId) {
        setFormError("Please select horses for all 3 places.");
        return;
      }
      if (winnerId === secondId || winnerId === thirdId || secondId === thirdId) {
        setFormError("Please select 3 different horses for 1st, 2nd, and 3rd places.");
        return;
      }
    }

    if (!existingPred && !pointsSufficient) {
      setFormError(`Insufficient point balance. You need ${cost - pointBalance} more points.`);
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        raceId: race.raceId,
        predictionType: predType,
        predictedWinnerId: Number(winnerId),
        predictedSecondId: predType === "TOP3" ? Number(secondId) : null,
        predictedThirdId: predType === "TOP3" ? Number(thirdId) : null,
      };

      if (existingPred) {
        await onUpdate(existingPred.id, payload);
      } else {
        await onSubmit(payload);
      }
      setShowConfirm(false);
    } catch (err: any) {
      setFormError(err?.message || "An error occurred while submitting prediction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showCommunity = predType === "WINNER" ? options.winnerDistributionVisible : options.top3DistributionVisible;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm relative">
      <h2 className="text-xs font-black uppercase tracking-[0.16em] text-[#006d5b] mb-4">
        Prediction Details: {race.raceName}
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50 p-1.5 rounded-lg">
        <button
          type="button"
          onClick={() => setPredType("WINNER")}
          className={`py-3 text-center text-sm font-black rounded-md transition cursor-pointer ${
            predType === "WINNER"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          Winner Pick (5 pts)
        </button>
        <button
          type="button"
          onClick={() => setPredType("TOP3")}
          className={`py-3 text-center text-sm font-black rounded-md transition cursor-pointer ${
            predType === "TOP3"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          Top 3 Pick (10 pts)
        </button>
      </div>

      <div className="mb-6 rounded-md bg-[#f3f6f4] border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700">
        {predType === "WINNER" ? (
          <p>
            <span className="font-black text-[#006d5b] uppercase">Potential Payout:</span> Reward +10 points if your chosen horse finishes 1st.
          </p>
        ) : (
          <p className="leading-relaxed">
            <span className="font-black text-[#006d5b] uppercase">Potential Payout:</span> Reward +30 points for matching the exact order (1st, 2nd, 3rd) · Reward +15 points if all three horses finish in the Top 3 in a different order.
          </p>
        )}
      </div>

      {!predictionOpen && (
        <div className="mb-6 rounded-md bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-black uppercase tracking-wide">Predictions Locked</p>
            <p className="mt-0.5 leading-relaxed">Predictions are closed as paddock checks have started or the race has finished.</p>
          </div>
        </div>
      )}

      {formError && (
        <div className="mb-6 rounded-md bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800">
          {formError}
          {!pointsSufficient && !existingPred && (
            <a href="#blog" className="mt-2 block text-xs font-black text-[#006d5b] underline">
              Read articles to earn points
            </a>
          )}
        </div>
      )}

      <form onSubmit={handleValidateSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]" htmlFor="winner">
            {predType === "WINNER" ? "Select Winning Horse" : "1st Place (Winner)"}
          </label>
          <select
            id="winner"
            disabled={!predictionOpen}
            className="mt-2 block min-h-12 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-950 outline-none focus:border-[#006d5b]"
            value={winnerId}
            onChange={(e) => setWinnerId(e.target.value)}
          >
            <option value="">Select horse...</option>
            {options.options.map((opt) => (
              <option key={opt.raceParticipantId} value={opt.raceParticipantId}>
                #{opt.startNumber} {opt.horseName} ({opt.jockeyName})
              </option>
            ))}
          </select>
        </div>

        {predType === "TOP3" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]" htmlFor="second">
                2nd Place (Second)
              </label>
              <select
                id="second"
                disabled={!predictionOpen}
                className="mt-2 block min-h-12 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-950 outline-none focus:border-[#006d5b]"
                value={secondId}
                onChange={(e) => setSecondId(e.target.value)}
              >
                <option value="">Select horse...</option>
                {options.options.map((opt) => (
                  <option key={opt.raceParticipantId} value={opt.raceParticipantId}>
                    #{opt.startNumber} {opt.horseName} ({opt.jockeyName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]" htmlFor="third">
                3rd Place (Third)
              </label>
              <select
                id="third"
                disabled={!predictionOpen}
                className="mt-2 block min-h-12 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-950 outline-none focus:border-[#006d5b]"
                value={thirdId}
                onChange={(e) => setThirdId(e.target.value)}
              >
                <option value="">Select horse...</option>
                {options.options.map((opt) => (
                  <option key={opt.raceParticipantId} value={opt.raceParticipantId}>
                    #{opt.startNumber} {opt.horseName} ({opt.jockeyName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {predictionOpen && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs font-bold text-slate-700 flex flex-col gap-2">
            <div className="flex justify-between">
              <span>Entry cost:</span>
              <span className="font-black text-slate-950">{cost} points</span>
            </div>
            {!existingPred && (
              <div className="flex justify-between border-t border-slate-200 pt-2 text-emerald-800">
                <span>Estimated balance after submission:</span>
                <span className="font-black">{pointBalance - cost} points</span>
              </div>
            )}
            {existingPred && (
              <p className="text-emerald-700 font-bold mt-1 text-[11px]">
                * This prediction was already submitted. Editing your selections does not cost extra points.
              </p>
            )}
          </div>
        )}

        {predictionOpen && (
          <button
            type="submit"
            className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#006d5b] px-8 py-4 text-sm font-black text-white hover:bg-[#004d3d] transition disabled:opacity-60 shadow-md cursor-pointer"
          >
            {existingPred ? "Confirm Update Selection" : "Confirm Submit Prediction"}
          </button>
        )}
      </form>

      {showCommunity && (
        <CommunityChoices options={options.options} predictionType={predType} />
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md w-full shadow-2xl animate-auth-panel-in text-xs font-bold text-slate-700">
            <h3 className="text-lg font-black text-slate-950 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#006d5b]" />
              Confirm Prediction
            </h3>
            
            <ul className="space-y-3 mb-6 bg-slate-50 p-4 border border-slate-200 rounded-md">
              <li className="flex justify-between border-b border-slate-200 pb-2">
                <span>Type:</span>
                <span className="font-black text-slate-950">{predType === "WINNER" ? "Winner Pick" : "Top 3 Pick"}</span>
              </li>
              <li>
                <p className="text-slate-500 mb-1">Selected Horses:</p>
                <p className="font-black text-slate-950 leading-relaxed">
                  1st: {getHorseNameById(winnerId)}
                </p>
                {predType === "TOP3" && (
                  <>
                    <p className="font-black text-slate-950 leading-relaxed mt-1">
                      2nd: {getHorseNameById(secondId)}
                    </p>
                    <p className="font-black text-slate-950 leading-relaxed mt-1">
                      3rd: {getHorseNameById(thirdId)}
                    </p>
                  </>
                )}
              </li>
              <li className="flex justify-between border-t border-slate-200 pt-2">
                <span>Entry Cost:</span>
                <span className="font-black text-slate-950">{existingPred ? "0" : cost} points</span>
              </li>
              {!existingPred && (
                <li className="flex justify-between text-emerald-800">
                  <span>Balance after submission:</span>
                  <span className="font-black">{pointBalance - cost} points</span>
                </li>
              )}
            </ul>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 min-h-12 border border-slate-300 rounded-md hover:bg-slate-50 font-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="flex-1 min-h-12 bg-[#006d5b] text-white hover:bg-[#004d3d] rounded-md font-black cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
