import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { ClientHeader } from "../../../components/client/ClientHeader";
import { ClientFooter } from "../../../components/client/ClientFooter";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSpectatorPredictions } from "./hooks/useSpectatorPredictions";
import { RaceTimeline } from "./components/RaceTimeline";
import { RaceCockpitHeader } from "./components/RaceCockpitHeader";
import { PredictionModeSelector } from "./components/PredictionModeSelector";
import { HeadToHeadSelector } from "./components/HeadToHeadSelector";
import { RunnerTable } from "./components/RunnerTable";
import { PredictionSlip } from "./components/PredictionSlip";
import { StreakSlip } from "./components/StreakSlip";
import { MyPredictionsList } from "./components/MyPredictionsList";
import { X } from "lucide-react";
import { spectatorPredictionApi } from "./services/spectatorPredictionApi";
import {
  EMPTY_PICKS,
  derivePredictionValidation,
  getEntryCost,
  pickRunnerForMode,
  setPickSlot,
  type Picks,
  type PickSlot,
} from "./predictionCockpitUtils";
import type { PredictionType, UserPrediction, StreakPredictionLeg } from "./types/prediction.types";

const EASE = [0.22, 1, 0.36, 1] as const;

export function SpectatorPredictionsPage() {
  useDocumentTitle("Prediction Arena | Night at the Races");

  const {
    pointAccount,
    openRaces,
    selectedRace,
    predictionOptions,
    myPredictions,
    myStreaks,
    loading,
    error,
    selectRace,
    submitPrediction,
    updatePrediction,
    refreshAll,
  } = useSpectatorPredictions();

  const [predType, setPredType] = useState<PredictionType>("EXACT_POSITION");
  const [picks, setPicks] = useState<Picks>(EMPTY_PICKS);
  const [streakLegs, setStreakLegs] = useState<StreakPredictionLeg[]>([]);
  const [wagerAmount, setWagerAmount] = useState<number>(10000);
  const [isCustomWager, setIsCustomWager] = useState<boolean>(false);
  const [activeTop3Slot, setActiveTop3Slot] = useState<PickSlot | null>(null);
  const [editingPredictionId, setEditingPredictionId] = useState<number | null>(null);
  const [booted, setBooted] = useState(false);
  const [editNotice, setEditNotice] = useState<string | null>(null);
  const [cockpitSubmitting, setCockpitSubmitting] = useState(false);
  const [cockpitSubmitStatus, setCockpitSubmitStatus] = useState<string | null>(null);
  const [cockpitSubmitError, setCockpitSubmitError] = useState<string | null>(null);
  const [isAllPredictionsModalOpen, setIsAllPredictionsModalOpen] = useState(false);
  const [isAllStreaksModalOpen, setIsAllStreaksModalOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkApplied = useRef(false);

  useEffect(() => {
    if (!loading) setBooted(true);
  }, [loading]);

  useEffect(() => {
    if (deepLinkApplied.current || loading) return;
    const raw = searchParams.get("raceId");
    if (!raw) {
      deepLinkApplied.current = true;
      return;
    }
    deepLinkApplied.current = true;
    const target = openRaces.find((race) => race.raceId === Number(raw));
    if (target) selectRace(target);
    // selectRace is intentionally omitted because it is not memoized by the hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, openRaces, searchParams]);

  const existingPred = predictionOptions?.myPredictions?.find((prediction) => {
    if (editingPredictionId) return prediction.id === editingPredictionId;
    if (predType === "EXACT_POSITION" || predType === "HEAD_TO_HEAD") return false;
    return prediction.predictionType === predType;
  });
  const pointBalance = pointAccount?.pointBalance ?? 0;
  const cockpitValidation = selectedRace
    ? derivePredictionValidation({
        predType,
        picks,
        options: predictionOptions,
        pointBalance,
        isUpdate: Boolean(existingPred),
        wagerAmount,
      })
    : { canConfirm: false, message: "Select a race to continue." };

  const cockpitPointPresets = [10000, 20000, 50000, 100000, 200000, 500000];

  useEffect(() => {
    if (existingPred) {
      setPicks({
        winnerId: existingPred.predictedWinnerId,
        predictedPosition: existingPred.predictedPosition,
        secondId: existingPred.predictedSecondId ?? null,
        thirdId: existingPred.predictedThirdId ?? null,
      });
      if (existingPred.entryCostPoints) {
        setWagerAmount(existingPred.entryCostPoints);
        if (!cockpitPointPresets.includes(existingPred.entryCostPoints)) {
          setIsCustomWager(true);
        }
      }
    } else {
      setPicks(EMPTY_PICKS);
      setWagerAmount(10000);
      setIsCustomWager(false);
    }
    setActiveTop3Slot(null);
  }, [existingPred, predType, predictionOptions?.raceId]);

  const handleSelectRace = (race: (typeof openRaces)[number]) => {
    selectRace(race);
    setActiveTop3Slot(null);
    setEditNotice(null);
    setSearchParams({ raceId: String(race.raceId) }, { replace: true });
  };

  const handleModeChange = (nextType: PredictionType) => {
    setPredType(nextType);
    setActiveTop3Slot(null);
    setEditingPredictionId(null);
  };

  const handleSelectRunner = (participantId: number, position?: number) => {
    if (predType === "EXACT_POSITION") {
      // Toggle if already selected, otherwise select
      if (picks.winnerId === participantId && picks.predictedPosition === position) {
        setPicks(EMPTY_PICKS);
      } else {
        setPicks({ ...EMPTY_PICKS, winnerId: participantId, predictedPosition: position });
      }
      return;
    }

    if (predType === "WINNING_STREAK") {
      const runner = predictionOptions?.options.find((opt) => opt.raceParticipantId === participantId);
      const odds = predictionOptions?.positionOddsMatrix?.[participantId]?.[1];
      if (!runner || !odds || !selectedRace) return;

      setStreakLegs((prev) => {
        const existingIndex = prev.findIndex(leg => leg.raceId === selectedRace.raceId);
        const newLeg = {
          raceId: selectedRace.raceId,
          raceName: selectedRace.raceName,
          predictedWinnerId: participantId,
          horseName: runner.horseName,
          lockedOdds: odds,
          status: "PENDING"
        };
        if (existingIndex >= 0) {
          if (prev[existingIndex].predictedWinnerId === participantId) {
            // Deselect if already selected
            const next = [...prev];
            next.splice(existingIndex, 1);
            return next;
          }
          const next = [...prev];
          next[existingIndex] = newLeg;
          return next;
        }
        return [...prev, newLeg];
      });
      return;
    }

    setPicks((current) =>
      pickRunnerForMode({
        picks: current,
        predType,
        participantId,
        activeSlot: predType === "TOP3" ? activeTop3Slot : null,
      }),
    );
    if (predType === "TOP3") setActiveTop3Slot(null);
  };

  const handleClearSlot = (slot: PickSlot) => {
    setPicks((current) => setPickSlot(current, slot, null));
    setActiveTop3Slot(slot);
  };

  const handleClearSelections = () => {
    setPicks(EMPTY_PICKS);
    setActiveTop3Slot(null);
    setEditingPredictionId(null);
  };

  useEffect(() => {
    setCockpitSubmitStatus(null);
    setCockpitSubmitError(null);
  }, [selectedRace?.raceId, predictionOptions?.raceId, predType, picks.winnerId, picks.secondId, picks.thirdId]);

  const handleEdit = (prediction: UserPrediction) => {
    const matchingRace = openRaces.find((race) => race.raceId === prediction.raceId);
    if (!matchingRace) {
      setEditNotice("That race is no longer open for editing.");
      return;
    }
    setPredType(prediction.predictionType);
    if (prediction.predictionType === "EXACT_POSITION" || prediction.predictionType === "HEAD_TO_HEAD") {
      setEditingPredictionId(prediction.id);
    }
    selectRace(matchingRace);
    setSearchParams({ raceId: String(matchingRace.raceId) }, { replace: true });
    setActiveTop3Slot(null);
    setEditNotice(null);
  };

  const handleConfirm = async () => {
    if (!selectedRace || !picks.winnerId) return;
    const payload = {
      raceId: selectedRace.raceId,
      predictionType: predType,
      predictedWinnerId: picks.winnerId,
      predictedPosition: predType === "EXACT_POSITION" ? picks.predictedPosition : null,
      wagerAmount,
    };

    if (existingPred) {
      await updatePrediction(existingPred.id, payload);
    } else {
      await submitPrediction(payload);
    }
  };

  const handleCockpitConfirm = async () => {
    if (!cockpitValidation.canConfirm || cockpitSubmitting) return;

    setCockpitSubmitting(true);
    setCockpitSubmitError(null);
    setCockpitSubmitStatus(null);
    try {
      await handleConfirm();
      setCockpitSubmitStatus(existingPred ? "Prediction updated." : "Prediction confirmed.");
      if ((predType === "EXACT_POSITION" || predType === "HEAD_TO_HEAD") && !existingPred) {
        setPicks(EMPTY_PICKS);
      }
      setEditingPredictionId(null);
    } catch (err) {
      setCockpitSubmitError(err instanceof Error ? err.message : "Unable to confirm prediction.");
    } finally {
      setCockpitSubmitting(false);
    }
  };

  return (
    <div className="client-theme min-h-screen bg-turf-950 text-ivory">
      <ClientHeader />

      <main className="mx-auto max-w-[1240px] px-3 py-4 sm:px-4 lg:px-5">
        {!booted && (
          <div className="rounded-lg border border-turf-700 bg-turf-900 p-10 text-center">
            <div className="flex items-center justify-center gap-3 font-data text-sm uppercase tracking-[0.16em] text-ivory-dim">
              <span className="h-2 w-2 rounded-full bg-emerald-soft live-pulse" />
              Loading the prediction arena...
            </div>
          </div>
        )}

        {error && (
          <div
            className="rounded-lg border-l-4 border-nyraRed bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-300"
            role="alert"
          >
            {error}
          </div>
        )}

        {editNotice && (
          <div
            className="mt-3 rounded-lg border border-gold-600/30 bg-gold-400/5 px-5 py-4 text-sm font-semibold text-gold-200"
            role="alert"
          >
            {editNotice}
          </div>
        )}

        {booted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="space-y-3"
          >
            <RaceTimeline
              races={openRaces}
              selectedRace={selectedRace}
              selectedPredictionOpen={predictionOptions?.predictionOpen}
              onSelectRace={handleSelectRace}
            />

            {selectedRace ? (
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
                <section className="min-w-0 overflow-hidden rounded-lg border border-turf-800 bg-turf-900/95 shadow-[0_18px_70px_-36px_rgba(0,0,0,0.85)]">
                  <div className="border-b border-turf-800 p-3 sm:p-4">
                    <PredictionModeSelector
                      options={predictionOptions}
                      predType={predType}
                      onChange={handleModeChange}
                    />
                  </div>

                  <div className="grid gap-0 lg:grid-cols-[225px_minmax(0,1fr)]">
                    <RaceCockpitHeader race={selectedRace} options={predictionOptions} />

                    {!predictionOptions || loading ? (
                      <div
                        className="h-72 animate-pulse border-l border-turf-800 bg-turf-850"
                        aria-label="Loading race options"
                      />
                    ) : predType === "HEAD_TO_HEAD" ? (
                      <div className="border-l border-turf-800 bg-turf-850 p-3">
                        <HeadToHeadSelector
                          matchups={predictionOptions.h2hMatchups || []}
                          participants={predictionOptions.options}
                          selectedWinnerId={picks.winnerId}
                          onSelectWinner={(horseId) => setPicks({ ...EMPTY_PICKS, winnerId: horseId })}
                          disabled={!predictionOptions.predictionOpen || cockpitSubmitting}
                        />
                      </div>
                    ) : (
                      <RunnerTable
                        options={predictionOptions}
                        predType={predType}
                        picks={
                          predType === "WINNING_STREAK"
                            ? { ...EMPTY_PICKS, winnerId: streakLegs.find((l) => l.raceId === selectedRace?.raceId)?.predictedWinnerId ?? null }
                            : picks
                        }
                        disabled={!predictionOptions.predictionOpen || cockpitSubmitting}
                        onSelectRunner={handleSelectRunner}
                      />
                    )}
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="mt-3 grid gap-4 border-t border-turf-800 pt-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <div>
                        <p className="text-[12px] font-semibold text-ivory">Wager Amount</p>
                        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                          {cockpitPointPresets.map((points, index) => (
                            <button
                              key={`${points}-${index}`}
                              type="button"
                              onClick={() => {
                                setWagerAmount(points);
                                setIsCustomWager(false);
                              }}
                              className={`grid min-h-10 place-items-center rounded-md border px-2 font-data text-[13px] font-extrabold transition-colors ${
                                !isCustomWager && wagerAmount === points
                                  ? "border-gold-400 bg-turf-900 text-ivory shadow-[inset_0_0_0_1px_rgba(212,175,55,0.3)]"
                                  : "border-turf-600 bg-turf-850 text-ivory-dim hover:bg-turf-800"
                              }`}
                            >
                              {points > 0 ? (points / 1000) + "k" : "-"}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setIsCustomWager(true)}
                            className={`grid min-h-10 place-items-center rounded-md border px-2 text-[13px] font-semibold transition-colors ${
                              isCustomWager
                                ? "border-gold-400 bg-turf-900 text-ivory shadow-[inset_0_0_0_1px_rgba(212,175,55,0.3)]"
                                : "border-turf-600 bg-turf-850 text-ivory-dim hover:bg-turf-800"
                            }`}
                          >
                            Other
                          </button>
                        </div>
                        {isCustomWager && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[13px] text-ivory-dim font-medium">Custom Wager:</span>
                            <div className="flex items-center overflow-hidden rounded-lg border border-turf-600 bg-turf-900/50 p-1 transition-all focus-within:border-gold-400 focus-within:ring-1 focus-within:ring-gold-400">
                              <button
                                type="button"
                                onClick={() => setWagerAmount(Math.max(10000, wagerAmount - 10000))}
                                className="grid h-7 w-7 place-items-center rounded-md bg-turf-800 text-ivory-dim transition-colors hover:bg-turf-700 hover:text-ivory"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <input
                                type="number"
                                min={10000}
                                step={10000}
                                value={wagerAmount}
                                onChange={(e) => setWagerAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-24 bg-transparent px-2 text-center font-data text-[15px] font-bold text-gold-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                onClick={() => setWagerAmount(wagerAmount + 10000)}
                                className="grid h-7 w-7 place-items-center rounded-md bg-turf-800 text-ivory-dim transition-colors hover:bg-turf-700 hover:text-ivory"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="text-[12px] text-ivory-dim">VND</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-end">
                        <p className="text-[12px] font-semibold text-ivory-dim">Total Wager:</p>
                        <p className="mt-1 font-data text-[28px] font-extrabold leading-none text-gold-300">
                          {wagerAmount > 0 ? wagerAmount.toLocaleString("en-US") : "0"}{" "}
                          <span className="font-sans text-[18px] text-ivory">VND</span>
                        </p>
                      </div>
                    </div>

                  </div>
                </section>

                {predType === "WINNING_STREAK" ? (
                  <StreakSlip
                    legs={streakLegs}
                    wagerAmount={wagerAmount}
                    pointBalance={pointBalance}
                    myStreaks={myStreaks}
                    onClearAll={() => setStreakLegs([])}
                    onRemoveLeg={(id) => setStreakLegs(prev => prev.filter(l => l.raceId !== id))}
                    onWagerChange={setWagerAmount}
                    onViewAllStreaks={() => setIsAllStreaksModalOpen(true)}
                    onSubmit={async () => {
                      if (!selectedRace?.tournamentId) throw new Error("Tournament not found");
                      await spectatorPredictionApi.submitStreakPrediction({
                        tournamentId: selectedRace.tournamentId,
                        wagerAmount,
                        legs: streakLegs.map(l => ({
                          raceId: l.raceId,
                          predictedWinnerId: l.predictedWinnerId
                        }))
                      });
                      await refreshAll();
                    }}
                  />
                ) : (
                  <PredictionSlip
                    race={selectedRace}
                    options={predictionOptions}
                    predType={predType}
                    picks={picks}
                    wagerAmount={wagerAmount}
                    pointBalance={pointBalance}
                    isUpdate={Boolean(existingPred)}
                    myPredictions={myPredictions}
                    onClear={handleClearSelections}
                    onConfirm={handleCockpitConfirm}
                    onEditPrediction={handleEdit}
                    onViewAll={() => setIsAllPredictionsModalOpen(true)}
                  />
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </main>

      {/* All Predictions Modal */}
      {isAllPredictionsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-turf-950/80 backdrop-blur-sm"
            onClick={() => setIsAllPredictionsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative flex h-full max-h-[800px] w-full max-w-[800px] flex-col overflow-hidden rounded-2xl border border-turf-700 bg-turf-900 shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-turf-800 p-4 sm:p-6">
              <div>
                <h2 className="text-xl font-extrabold text-ivory">All Predictions</h2>
                <p className="mt-1 text-sm font-semibold text-ivory-dim">
                  Your complete betting history
                </p>
              </div>
              <button
                onClick={() => setIsAllPredictionsModalOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-turf-800 text-ivory-dim transition-colors hover:bg-turf-700 hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              <MyPredictionsList
                predictions={myPredictions}
                onEditPrediction={(pred) => {
                  setIsAllPredictionsModalOpen(false);
                  handleEdit(pred);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* All Streaks Modal */}
      {isAllStreaksModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-turf-950/80 backdrop-blur-sm"
            onClick={() => setIsAllStreaksModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative flex h-full max-h-[800px] w-full max-w-[800px] flex-col overflow-hidden rounded-2xl border border-turf-700 bg-turf-900 shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-turf-800 p-4 sm:p-6">
              <div>
                <h2 className="text-xl font-extrabold text-ivory">All Streaks</h2>
                <p className="mt-1 text-sm font-semibold text-ivory-dim">
                  Your complete streak history
                </p>
              </div>
              <button
                onClick={() => setIsAllStreaksModalOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-turf-800 text-ivory-dim transition-colors hover:bg-turf-700 hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-4">
              {myStreaks.length === 0 ? (
                <p className="text-center text-sm text-turf-400">No streaks found.</p>
              ) : (
                [...myStreaks].sort((a, b) => b.id - a.id).map(streak => (
                  <div key={streak.id} className="rounded-lg border border-turf-800 bg-turf-950 shadow-lg">
                    <div className="flex items-center justify-between border-b border-turf-800 bg-turf-900 px-4 py-3">
                      <span className="font-data text-sm font-bold text-turf-300">Ticket #{streak.id}</span>
                      <span className={`rounded px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        streak.status === 'WON' ? 'bg-green-500/20 text-green-400' :
                        streak.status === 'LOST' ? 'bg-red-500/20 text-red-400' :
                        'bg-gold-500/20 text-gold-400'
                      }`}>
                        {streak.status}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      {streak.legs.map((leg, idx) => (
                        <div key={leg.id} className="flex items-center justify-between text-base">
                          <span className="text-xs uppercase font-bold text-ivory-dim">Leg {idx + 1}</span>
                          <span className="font-semibold text-ivory">{leg.predictedWinnerName}</span>
                          <span className="font-data text-gold-300">x{leg.lockedOdds.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-turf-800 bg-turf-900/50 px-4 py-3 text-base">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase text-ivory-dim font-bold">Wager</span>
                        <span className="font-data font-semibold text-ivory">{streak.wagerAmount.toLocaleString()} VND</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-xs uppercase text-ivory-dim font-bold">Total Odds</span>
                        <span className="font-data font-bold text-gold-400">x{streak.totalOdds.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <ClientFooter />
    </div>
  );
}
