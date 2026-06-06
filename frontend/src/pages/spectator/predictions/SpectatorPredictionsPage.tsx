import { useState } from "react";
import { Compass, History } from "lucide-react";
import { ClientHeader } from "../../../components/client/ClientHeader";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSpectatorPredictions } from "./hooks/useSpectatorPredictions";
import { PredictionArenaHeader } from "./components/PredictionArenaHeader";
import { ActiveRacesList } from "./components/ActiveRacesList";
import { PredictionFormPanel } from "./components/PredictionFormPanel";
import { MyPredictionsList } from "./components/MyPredictionsList";
import { UserPrediction } from "./types/prediction.types";

export function SpectatorPredictionsPage() {
  useDocumentTitle("Prediction Arena | Equine Pro");
  
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
    const matchingRace = openRaces.find(r => r.raceId === pred.raceId);
    if (matchingRace) {
      selectRace(matchingRace);
      setActiveTab("open");
    } else {
      alert("This race is no longer open or has already started, cannot edit prediction.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6f4] text-slate-950">
      <ClientHeader />

      <main className="mx-auto max-w-[1536px] px-5 py-8 sm:px-7 lg:px-8">
        <PredictionArenaHeader pointBalance={pointAccount?.pointBalance ?? 0} />

        {loading && openRaces.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500 font-bold">
            Loading prediction arena data...
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800">
            {error}
          </div>
        )}

        {!loading && (
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            {/* Sidebar with Vertical Tabs */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 bg-white rounded-lg border border-slate-200 p-4 h-fit shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("open")}
                className={`flex items-center gap-3 w-full text-left py-3 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  activeTab === "open"
                    ? "bg-[#006d5b] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Compass className="h-4.5 w-4.5 shrink-0" />
                Open Races
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("my")}
                className={`flex items-center gap-3 w-full text-left py-3 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  activeTab === "my"
                    ? "bg-[#006d5b] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <History className="h-4.5 w-4.5 shrink-0" />
                My Predictions ({myPredictions.length})
              </button>
            </div>

            {/* Active Content Area */}
            <div className="flex-1 min-w-0">
              {activeTab === "open" ? (
                <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
                  <ActiveRacesList
                    races={openRaces}
                    selectedRace={selectedRace}
                    onSelectRace={selectRace}
                  />

                  <div className="h-fit">
                    <PredictionFormPanel
                      race={selectedRace}
                      options={predictionOptions}
                      pointBalance={pointAccount?.pointBalance ?? 0}
                      onSubmit={submitPrediction}
                      onUpdate={updatePrediction}
                    />
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl">
                  <MyPredictionsList
                    predictions={myPredictions}
                    onEditPrediction={handleEdit}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
