import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, History, ShieldCheck } from "lucide-react";
import { ClientHeader } from "../../../components/client/ClientHeader";
import { ClientFooter } from "../../../components/client/ClientFooter";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSpectatorPredictions } from "./hooks/useSpectatorPredictions";
import { PredictionArenaHeader } from "./components/PredictionArenaHeader";
import { ActiveRacesList } from "./components/ActiveRacesList";
import { PredictionFormPanel } from "./components/PredictionFormPanel";
import { MyPredictionsList } from "./components/MyPredictionsList";
import { UserPrediction } from "./types/prediction.types";

const EASE = [0.22, 1, 0.36, 1] as const;

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

  const handleEdit = (pred: UserPrediction) => {
    const matchingRace = openRaces.find((r) => r.raceId === pred.raceId);
    if (matchingRace) {
      selectRace(matchingRace);
      setActiveTab("open");
    } else {
      alert("This race is no longer open or has already started, cannot edit prediction.");
    }
  };

  const tabContentVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  const tabs = [
    { key: "open" as const, label: "Open Races", Icon: Compass },
    { key: "my" as const, label: `My Predictions (${myPredictions.length})`, Icon: History },
  ];

  return (
    <div className="client-theme min-h-screen bg-turf-950 text-ivory">
      <ClientHeader />

      <main className="mx-auto max-w-[1400px] px-5 py-10 sm:px-7 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <PredictionArenaHeader pointBalance={pointAccount?.pointBalance ?? 0} />
        </motion.div>

        {/* Disclaimer — always visible */}
        <div className="mt-5 flex items-center justify-center gap-2.5 rounded-xl border border-gold-600/25 bg-turf-900/60 px-4 py-3 text-center">
          <ShieldCheck size={16} className="shrink-0 text-gold-400" />
          <p className="eyebrow text-gold-300">Virtual points only — no real-money betting</p>
        </div>

        {loading && openRaces.length === 0 && (
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

        {!loading && (
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
                    variants={tabContentVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="grid gap-8 lg:grid-cols-[380px_1fr]"
                  >
                    <ActiveRacesList races={openRaces} selectedRace={selectedRace} onSelectRace={selectRace} />
                    <div className="h-fit">
                      <PredictionFormPanel
                        race={selectedRace}
                        options={predictionOptions}
                        pointBalance={pointAccount?.pointBalance ?? 0}
                        onSubmit={submitPrediction}
                        onUpdate={updatePrediction}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="my-tab"
                    variants={tabContentVariants}
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
