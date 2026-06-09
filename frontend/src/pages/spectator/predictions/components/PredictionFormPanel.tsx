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
  onUpdate: (
    predictionId: number,
    payload: {
      raceId: number;
      predictionType: "WINNER" | "TOP3";
      predictedWinnerId: number;
      predictedSecondId?: number | null;
      predictedThirdId?: number | null;
    },
  ) => Promise<void>;
}

const selectClass =
  "mt-2 block min-h-12 w-full rounded-lg border border-white/12 bg-turf-950 px-4 py-3 text-base font-semibold text-ivory outline-none transition-colors focus:border-emerald-glow [&>option]:bg-turf-900 [&>option]:text-ivory disabled:opacity-50";
const labelClass = "eyebrow block text-emerald-soft";

export function PredictionFormPanel({ race, options, pointBalance, onSubmit, onUpdate }: PredictionFormPanelProps) {
  const [predType, setPredType] = useState<"WINNER" | "TOP3">("WINNER");
  const [winnerId, setWinnerId] = useState<string>("");
  const [secondId, setSecondId] = useState<string>("");
  const [thirdId, setThirdId] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const existingPred = options?.myPredictions?.find((p) => p.predictionType === predType);
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
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/8 bg-turf-900 p-12 text-center text-sm font-semibold text-ivory-dim">
        <ShieldAlert className="mb-4 h-12 w-12 text-ivory-faint/50" />
        Select a race on the left to start predicting.
      </div>
    );
  }

  const cost = predType === "WINNER" ? options.entryCost.winner : options.entryCost.top3;
  const pointsSufficient = pointBalance >= cost;

  const getHorseNameById = (idStr: string) => {
    const opt = options.options.find((o) => o.raceParticipantId.toString() === idStr);
    return opt ? `#${opt.startNumber} ${opt.horseName} (${opt.jockeyName})` : "";
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
    <div className="relative rounded-2xl border border-white/8 bg-turf-900 p-6 md:p-7">
      <h2 className="eyebrow text-emerald-soft">Prediction · {race.raceName}</h2>

      {/* Type toggle */}
      <div className="mt-5 mb-6 grid grid-cols-2 gap-2 rounded-xl border border-white/8 bg-turf-950 p-1.5">
        <button
          type="button"
          onClick={() => setPredType("WINNER")}
          className={`cursor-pointer rounded-lg py-3 text-center text-sm font-bold transition-colors ${
            predType === "WINNER" ? "bg-emerald-glow text-turf-950" : "text-ivory-dim hover:text-ivory"
          }`}
        >
          Winner Pick ({options.entryCost.winner} pts)
        </button>
        <button
          type="button"
          onClick={() => setPredType("TOP3")}
          className={`cursor-pointer rounded-lg py-3 text-center text-sm font-bold transition-colors ${
            predType === "TOP3" ? "bg-emerald-glow text-turf-950" : "text-ivory-dim hover:text-ivory"
          }`}
        >
          Top 3 Pick ({options.entryCost.top3} pts)
        </button>
      </div>

      {/* Reward explainer */}
      <div className="mb-6 rounded-xl border border-gold-600/25 bg-gold-400/5 px-4 py-3 text-xs font-semibold leading-relaxed text-ivory-dim">
        {predType === "WINNER" ? (
          <p>
            <span className="font-data uppercase tracking-[0.12em] text-gold-300">Reward:</span> +10 points if your
            chosen horse finishes 1st.
          </p>
        ) : (
          <p>
            <span className="font-data uppercase tracking-[0.12em] text-gold-300">Reward:</span> +30 points for the
            exact order (1st, 2nd, 3rd) · +15 points if all three finish in the Top 3 in any order.
          </p>
        )}
      </div>

      {!predictionOpen && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-gold-600/30 bg-gold-400/5 p-4 text-xs font-semibold text-gold-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-gold-300" />
          <div>
            <p className="font-data uppercase tracking-[0.14em] text-gold-300">Predictions Locked</p>
            <p className="mt-0.5 leading-relaxed text-ivory-dim">
              Predictions are closed — paddock checks have started or the race has finished.
            </p>
          </div>
        </div>
      )}

      {formError && (
        <div className="mb-6 rounded-xl border border-nyraRed/40 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
          {formError}
          {!pointsSufficient && !existingPred && (
            <a href="/blogs" className="mt-2 block font-bold text-emerald-soft underline">
              Read stories to earn points
            </a>
          )}
        </div>
      )}

      <form onSubmit={handleValidateSubmit} className="space-y-6">
        <div>
          <label className={labelClass} htmlFor="winner">
            {predType === "WINNER" ? "Select Winning Horse" : "1st Place (Winner)"}
          </label>
          <select id="winner" disabled={!predictionOpen} className={selectClass} value={winnerId} onChange={(e) => setWinnerId(e.target.value)}>
            <option value="">Select horse…</option>
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
              <label className={labelClass} htmlFor="second">
                2nd Place
              </label>
              <select id="second" disabled={!predictionOpen} className={selectClass} value={secondId} onChange={(e) => setSecondId(e.target.value)}>
                <option value="">Select horse…</option>
                {options.options.map((opt) => (
                  <option key={opt.raceParticipantId} value={opt.raceParticipantId}>
                    #{opt.startNumber} {opt.horseName} ({opt.jockeyName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="third">
                3rd Place
              </label>
              <select id="third" disabled={!predictionOpen} className={selectClass} value={thirdId} onChange={(e) => setThirdId(e.target.value)}>
                <option value="">Select horse…</option>
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
          <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-turf-950 p-4 text-xs font-semibold text-ivory-dim">
            <div className="flex justify-between">
              <span>Entry cost</span>
              <span className="font-data text-ivory">{cost} points</span>
            </div>
            {!existingPred && (
              <div className="flex justify-between border-t border-white/8 pt-2 text-emerald-soft">
                <span>Estimated balance after</span>
                <span className="font-data">{pointBalance - cost} points</span>
              </div>
            )}
            {existingPred && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-soft">
                * Already submitted. Editing your selections costs no extra points.
              </p>
            )}
          </div>
        )}

        {predictionOpen && (
          <button
            type="submit"
            className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-glow px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] text-turf-950 shadow-[0_16px_40px_-16px_rgba(31,157,118,0.8)] transition-colors hover:bg-emerald-soft disabled:opacity-60"
          >
            {existingPred ? "Confirm Update" : "Confirm Prediction"}
          </button>
        )}
      </form>

      {showCommunity && <CommunityChoices options={options.options} predictionType={predType} />}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="auth-panel-motion w-full max-w-md rounded-2xl border border-white/10 bg-turf-900 p-6 text-xs font-semibold text-ivory-dim shadow-2xl">
            <h3 className="mb-4 flex items-center gap-2 font-display text-xl font-medium text-ivory">
              <CheckCircle2 className="h-5 w-5 text-emerald-soft" />
              Confirm Prediction
            </h3>

            <ul className="mb-6 space-y-3 rounded-xl border border-white/8 bg-turf-950 p-4">
              <li className="flex justify-between border-b border-white/8 pb-2">
                <span>Type</span>
                <span className="font-data uppercase text-ivory">{predType === "WINNER" ? "Winner Pick" : "Top 3 Pick"}</span>
              </li>
              <li>
                <p className="mb-1 text-ivory-faint">Selected horses</p>
                <p className="font-semibold leading-relaxed text-ivory">
                  <span className="font-data text-gold-300">1st</span> {getHorseNameById(winnerId)}
                </p>
                {predType === "TOP3" && (
                  <>
                    <p className="mt-1 font-semibold leading-relaxed text-ivory">
                      <span className="font-data text-gold-300">2nd</span> {getHorseNameById(secondId)}
                    </p>
                    <p className="mt-1 font-semibold leading-relaxed text-ivory">
                      <span className="font-data text-gold-300">3rd</span> {getHorseNameById(thirdId)}
                    </p>
                  </>
                )}
              </li>
              <li className="flex justify-between border-t border-white/8 pt-2">
                <span>Entry cost</span>
                <span className="font-data text-ivory">{existingPred ? "0" : cost} points</span>
              </li>
              {!existingPred && (
                <li className="flex justify-between text-emerald-soft">
                  <span>Balance after</span>
                  <span className="font-data">{pointBalance - cost} points</span>
                </li>
              )}
            </ul>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="min-h-12 flex-1 cursor-pointer rounded-lg border border-white/15 font-bold uppercase tracking-[0.12em] text-ivory transition-colors hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="min-h-12 flex-1 cursor-pointer rounded-lg bg-emerald-glow font-bold uppercase tracking-[0.12em] text-turf-950 transition-colors hover:bg-emerald-soft disabled:opacity-50"
              >
                {isSubmitting ? "Processing…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
