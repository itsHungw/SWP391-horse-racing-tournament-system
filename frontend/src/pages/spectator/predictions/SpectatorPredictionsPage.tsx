import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, History, ShieldCheck } from "lucide-react";
import { ClientHeader } from "../../../components/client/ClientHeader";
import { ClientFooter } from "../../../components/client/ClientFooter";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSpectatorPredictions } from "./hooks/useSpectatorPredictions";
import { PredictionArenaHeader } from "./components/PredictionArenaHeader";
import { ActiveRacesList } from "./components/ActiveRacesList";
import { StepRail } from "./components/StepRail";
import { HorsePickPanel, EMPTY_PICKS, type Picks } from "./components/HorsePickPanel";
import { TicketReview } from "./components/TicketReview";
import { CommunityChoices } from "./components/CommunityChoices";
import { MyPredictionsList } from "./components/MyPredictionsList";
import type { PredictionType, UserPrediction } from "./types/prediction.types";

const EASE = [0.22, 1, 0.36, 1] as const;

type WizardStep = 1 | 2 | 3;

export function SpectatorPredictionsPage() {
  useDocumentTitle("Prediction Arena | Night at the Races");

  const {
    pointAccount,
    openRaces,
    selectedRace,
    predictionOptions,
    myPredictions,
    loading,
    error,
    selectRace,
    submitPrediction,
    updatePrediction,
  } = useSpectatorPredictions();

  const [activeTab, setActiveTab] = useState<"open" | "my">("open");
  const [step, setStep] = useState<WizardStep>(1);
  const [predType, setPredType] = useState<PredictionType>("WINNER");
  const [picks, setPicks] = useState<Picks>(EMPTY_PICKS);
  const [stepError, setStepError] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);

  const [searchParams] = useSearchParams();
  const deepLinkApplied = useRef(false);

  useEffect(() => {
    if (!loading) setBooted(true);
  }, [loading]);

  /* Deep link: /spectator/predictions?raceId=N preselects the race. */
  useEffect(() => {
    if (deepLinkApplied.current || loading) return;
    const raw = searchParams.get("raceId");
    if (!raw) {
      deepLinkApplied.current = true;
      return;
    }
    deepLinkApplied.current = true;
    const target = openRaces.find((r) => r.raceId === Number(raw));
    if (target) {
      selectRace(target);
      setStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, openRaces, searchParams]);

  const existingPred = predictionOptions?.myPredictions?.find((p) => p.predictionType === predType);
  const pointBalance = pointAccount?.pointBalance ?? 0;

  /* Prefill picks from an already-submitted prediction of the current type. */
  useEffect(() => {
    if (existingPred) {
      setPicks({
        winnerId: existingPred.predictedWinnerId,
        secondId: existingPred.predictedSecondId ?? null,
        thirdId: existingPred.predictedThirdId ?? null,
      });
    } else {
      setPicks(EMPTY_PICKS);
    }
    setStepError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingPred?.id, predType, predictionOptions?.raceId]);

  const handleSelectRace = (race: (typeof openRaces)[number]) => {
    selectRace(race);
    setStep(2);
    setStepError(null);
  };

  const handleEdit = (pred: UserPrediction) => {
    const matchingRace = openRaces.find((r) => r.raceId === pred.raceId);
    if (!matchingRace) {
      setActiveTab("open");
      setStep(1);
      setStepError("That race is no longer open, so its prediction can't be edited.");
      return;
    }
    setPredType(pred.predictionType);
    selectRace(matchingRace);
    setActiveTab("open");
    setStep(2);
    setStepError(null);
  };

  const validateAndReview = () => {
    setStepError(null);
    const cost = predType === "WINNER"
      ? predictionOptions?.entryCost.winner ?? 0
      : predictionOptions?.entryCost.top3 ?? 0;

    if (!picks.winnerId) {
      setStepError("Pick a horse for 1st place first.");
      return;
    }
    if (predType === "TOP3") {
      if (!picks.secondId || !picks.thirdId) {
        setStepError("A Top 3 ticket needs all three places filled.");
        return;
      }
      const ids = [picks.winnerId, picks.secondId, picks.thirdId];
      if (new Set(ids).size !== 3) {
        setStepError("Pick three different horses for 1st, 2nd, and 3rd.");
        return;
      }
    }
    if (!existingPred && pointBalance < cost) {
      setStepError(`Not enough points — you need ${cost - pointBalance} more. Read stories in the Newsroom to earn points.`);
      return;
    }
    setStep(3);
  };

  const handleConfirm = async () => {
    if (!selectedRace || !picks.winnerId) return;
    const payload = {
      raceId: selectedRace.raceId,
      predictionType: predType,
      predictedWinnerId: picks.winnerId,
      predictedSecondId: predType === "TOP3" ? picks.secondId : null,
      predictedThirdId: predType === "TOP3" ? picks.thirdId : null,
    };
    if (existingPred) {
      await updatePrediction(existingPred.id, payload);
    } else {
      await submitPrediction(payload);
    }
  };

  const handleDone = () => {
    setPicks(EMPTY_PICKS);
    setStep(1);
    setActiveTab("my");
  };

  const stepVariants = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
    exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
  };

  const tabs = [
    { key: "open" as const, label: "Make a Prediction", Icon: Compass },
    { key: "my" as const, label: `My Predictions (${myPredictions.length})`, Icon: History },
  ];

  const showCommunity =
    predictionOptions != null &&
    (predType === "WINNER"
      ? predictionOptions.winnerDistributionVisible
      : predictionOptions.top3DistributionVisible);

  return (
    <div className="client-theme min-h-screen bg-turf-950 text-ivory">
      <ClientHeader />

      <main className="mx-auto max-w-[1400px] px-5 py-10 sm:px-7 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <PredictionArenaHeader pointBalance={pointBalance} />
        </motion.div>

        {/* Disclaimer — always visible */}
        <div className="mt-5 flex items-center justify-center gap-2.5 rounded-xl border border-gold-600/25 bg-turf-900/60 px-4 py-3 text-center">
          <ShieldCheck size={16} className="shrink-0 text-gold-400" />
          <p className="eyebrow text-gold-300">Virtual points only — no real-money betting</p>
        </div>

        {!booted && (
          <div className="mt-8 rounded-2xl border border-white/8 bg-turf-900 p-12 text-center">
            <div className="flex items-center justify-center gap-3 font-data text-sm uppercase tracking-[0.16em] text-ivory-dim">
              <span className="h-2 w-2 rounded-full bg-emerald-soft live-pulse" />
              Loading the prediction arena…
            </div>
          </div>
        )}

        {error && (
          <div
            className="mt-6 rounded-xl border-l-4 border-nyraRed bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-300"
            role="alert"
          >
            {error}
          </div>
        )}

        {booted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]"
          >
            {/* Sidebar tabs */}
            <div className="flex h-fit shrink-0 flex-col gap-2 rounded-2xl border border-white/8 bg-turf-900 p-4 sm:flex-row lg:flex-col">
              {tabs.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                    activeTab === key
                      ? "bg-emerald-glow text-turf-950 shadow-[0_12px_30px_-12px_rgba(31,157,118,0.7)]"
                      : "text-ivory-dim hover:bg-white/5 hover:text-ivory"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* Active content */}
            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                {activeTab === "open" ? (
                  <motion.div
                    key="open-tab"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {/* Step rail */}
                    <div className="rounded-2xl border border-white/8 bg-turf-900 px-5 py-4 sm:px-7">
                      <StepRail
                        current={step}
                        onGo={(s) => {
                          setStep(s);
                          setStepError(null);
                        }}
                      />
                    </div>

                    {stepError && (
                      <div
                        className="mt-4 rounded-xl border border-nyraRed/40 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300"
                        role="alert"
                      >
                        {stepError}
                      </div>
                    )}

                    <div className="mt-6">
                      <AnimatePresence mode="wait">
                        {step === 1 && (
                          <motion.div
                            key="step-1"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            <ActiveRacesList
                              races={openRaces}
                              selectedRace={selectedRace}
                              onSelectRace={handleSelectRace}
                            />
                          </motion.div>
                        )}

                        {step === 2 && (
                          <motion.div
                            key="step-2"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            {!selectedRace || !predictionOptions || loading ? (
                              <div
                                className="h-72 animate-pulse rounded-2xl border border-white/8 bg-turf-900"
                                aria-label="Loading race options"
                              />
                            ) : (
                              <>
                                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                                  <h2 className="font-display text-2xl font-medium tracking-tight text-ivory">
                                    {selectedRace.raceName}
                                  </h2>
                                  <p className="font-data text-[11px] uppercase tracking-[0.16em] text-ivory-faint">
                                    {selectedRace.tournamentName}
                                  </p>
                                </div>
                                <HorsePickPanel
                                  options={predictionOptions}
                                  predType={predType}
                                  onPredType={setPredType}
                                  picks={picks}
                                  onPicksChange={setPicks}
                                />
                                {existingPred && (
                                  <p className="mt-3 text-[11px] font-semibold text-emerald-soft">
                                    * You already hold a {predType === "WINNER" ? "Winner" : "Top 3"} ticket for
                                    this race — editing it costs no extra points.
                                  </p>
                                )}
                                {predictionOptions.predictionOpen && (
                                  <button
                                    type="button"
                                    onClick={validateAndReview}
                                    className="mt-6 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-lg bg-emerald-glow px-8 text-sm font-bold uppercase tracking-[0.12em] text-turf-950 shadow-[0_16px_40px_-16px_rgba(31,157,118,0.8)] transition-colors hover:bg-emerald-soft"
                                  >
                                    Review ticket
                                  </button>
                                )}
                                {showCommunity && predictionOptions && (
                                  <CommunityChoices options={predictionOptions.options} predictionType={predType} />
                                )}
                              </>
                            )}
                          </motion.div>
                        )}

                        {step === 3 && selectedRace && predictionOptions && (
                          <motion.div
                            key="step-3"
                            variants={stepVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="mx-auto max-w-xl"
                          >
                            <TicketReview
                              race={selectedRace}
                              options={predictionOptions}
                              predType={predType}
                              picks={picks}
                              pointBalance={pointBalance}
                              isUpdate={Boolean(existingPred)}
                              onConfirm={handleConfirm}
                              onBack={() => setStep(2)}
                              onDone={handleDone}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="my-tab"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="max-w-3xl"
                  >
                    <MyPredictionsList predictions={myPredictions} onEditPrediction={handleEdit} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </main>

      <ClientFooter />
    </div>
  );
}
