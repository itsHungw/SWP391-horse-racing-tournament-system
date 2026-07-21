import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Calendar, ChevronRight, Search, Compass, Settings, Save, Check, RotateCw, ChevronDown, Trophy, Layers } from "lucide-react";
import { getAdminPredictionRaces, getPredictionSettings, updatePredictionSettings, getAdminStreakPredictions, AdminStreakPrediction } from "../../api/adminPredictionApi";
import { formatVnd } from "../spectator/predictions/predictionCockpitUtils";
import { AdminStreakKanbanBoard } from "./components/AdminStreakKanbanBoard";

export function AdminPredictionsWorkspace() {
  useDocumentTitle("Race predictions monitor");

  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterChampionship, setFilterChampionship] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

  // Kanban Board state
  const [streaks, setStreaks] = useState<AdminStreakPrediction[]>([]);
  const [showKanban, setShowKanban] = useState(false);
  const [kanbanLoading, setKanbanLoading] = useState(false);

  // Settings states
  const [displaySeedInput, setDisplaySeedInput] = useState<number | "">(40000000);
  const [takeoutRateInput, setTakeoutRateInput] = useState<number | "">(15);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string | null>(null);

  const loadRaces = () => {
    setLoading(true);
    setError(null);
    getAdminPredictionRaces()
      .then((data) => {
        setRaces(data);
        setLoading(false);
      })
      .catch(() => {
        setRaces([]);
        setError("Unable to load prediction races. Check the API connection and try again.");
        setLoading(false);
      });
  };

  const handleOpenKanban = () => {
    setShowKanban(true);
    setKanbanLoading(true);
    getAdminStreakPredictions()
      .then((data) => {
        setStreaks(data);
        setKanbanLoading(false);
      })
      .catch(() => {
        setKanbanLoading(false);
        // Handle error if needed
      });
  };

  const loadSettings = () => {
    setSettingsLoading(true);
    setSettingsError(null);
    getPredictionSettings()
      .then((data) => {
        setDisplaySeedInput(data.displaySeed);
        setTakeoutRateInput(Math.round(data.takeoutRate * 100));
        if (data.updatedAt) {
          setLastUpdated(new Date(data.updatedAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short"
          }));
        }
        setLastUpdatedBy(data.updatedByUserName || null);
        setSettingsLoading(false);
      })
      .catch(() => {
        setSettingsError("Unable to load prediction settings.");
        setSettingsLoading(false);
      });
  };

  useEffect(() => {
    loadRaces();
    loadSettings();
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsError(null);
    setSettingsSuccess(false);

    const payload = {
      displaySeed: displaySeedInput === "" ? 0 : displaySeedInput,
      takeoutRate: (takeoutRateInput === "" ? 0 : takeoutRateInput) / 100
    };

    updatePredictionSettings(payload)
      .then((data) => {
        setDisplaySeedInput(data.displaySeed);
        setTakeoutRateInput(Math.round(data.takeoutRate * 100));
        if (data.updatedAt) {
          setLastUpdated(new Date(data.updatedAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short"
          }));
        }
        setLastUpdatedBy(data.updatedByUserName || null);
        setSettingsSuccess(true);
        setSettingsLoading(false);
        setTimeout(() => setSettingsSuccess(false), 3000);
        loadRaces();
      })
      .catch(() => {
        setSettingsError("Failed to update prediction settings. Ensure values are valid.");
        setSettingsLoading(false);
      });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "LOCKED":
        return "bg-slate-200 text-slate-800 border-slate-300";
      case "SETTLEMENT_PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "PROCESSING":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "COMPLETED":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "FAILED":
        return "bg-rose-100 text-rose-800 border-rose-300 animate-pulse";
      case "REFUNDED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Open";
      case "LOCKED":
        return "Locked";
      case "SETTLEMENT_PENDING":
        return "Settlement Pending";
      case "PROCESSING":
        return "Processing";
      case "COMPLETED":
        return "Completed";
      case "FAILED":
        return "Failed";
      case "REFUNDED":
        return "Refunded";
      default:
        return status;
    }
  };

  const filteredRaces = races.filter((race) => {
    const matchesChampionship = !filterChampionship || 
      (race.tournamentName && race.tournamentName.toLowerCase().includes(filterChampionship.toLowerCase()));
    const matchesStatus = !filterStatus || race.predictionStatus === filterStatus;
    const matchesSearch = !searchQuery || 
      (race.raceName && race.raceName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesChampionship && matchesStatus && matchesSearch;
  });

  const groupedRaces = filteredRaces.reduce((acc, race) => {
    const tName = race.tournamentName || "Other Races";
    if (!acc[tName]) acc[tName] = [];
    acc[tName].push(race);
    return acc;
  }, {} as Record<string, typeof races>);

  const toggleTournament = (tName: string) => {
    setSelectedTournament(tName);
  };

  return (
    <AdminLayout>
      <section aria-labelledby="prediction-monitor-title" className="space-y-6">
        {/* Title Header Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b3193a]">
            Game economy controls
          </p>
          <h1 id="prediction-monitor-title" className="mt-2 text-3xl font-black tracking-tight text-[#070f4f] flex items-center gap-2">
            <Compass className="h-7 w-7 text-[#b3193a]" />
            Predictions Monitor
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Manage and monitor spectator predictions for each race. Audit point reward transactions and handle resolution jobs.
          </p>
          <div className="mt-4 flex">
            <button 
              onClick={loadRaces} 
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 transition disabled:opacity-50"
            >
              <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Dynamic Settings Panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#070f4f] flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-[#b3193a]" />
            Prediction & Odds Settings
          </h2>
          
          {settingsError && (
            <div className="mb-4 rounded-lg bg-rose-50 p-4 border border-rose-100 text-sm font-semibold text-rose-700">
              {settingsError}
            </div>
          )}

          {settingsSuccess && (
            <div className="mb-4 rounded-lg bg-emerald-50 p-4 border border-emerald-100 text-sm font-semibold text-emerald-700 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Prediction settings updated successfully!
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Display Seed */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block" htmlFor="display-seed-input">
                  Virtual Display Seed
                </label>
                <div className="relative">
                  <input
                    id="display-seed-input"
                    type="number"
                    min="0"
                    value={displaySeedInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDisplaySeedInput(val === "" ? "" : Number(val));
                    }}
                    className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-14 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10 no-spinners"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VND
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-semibold">
                  Virtual seed liquidity used to smooth initial odds display. The actual payout calculation does NOT use this virtual fund.
                </p>
              </div>

              {/* Takeout Rate */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block" htmlFor="takeout-rate-input">
                  House Takeout Rate (%)
                </label>
                <div className="relative">
                  <input
                    id="takeout-rate-input"
                    type="number"
                    min="0"
                    max="90"
                    value={takeoutRateInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTakeoutRateInput(val === "" ? "" : Number(val));
                    }}
                    className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10 no-spinners"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-semibold">
                  Percentage of the total pool kept by the house as commission fee (e.g. 15%).
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100 gap-4">
              <span className="text-xs text-slate-500 font-medium">
                {lastUpdated && (
                  <>
                    Last updated on <strong>{lastUpdated}</strong> by <strong>{lastUpdatedBy || "System"}</strong>
                  </>
                )}
              </span>
              <button
                type="submit"
                disabled={settingsLoading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#b3193a] px-6 text-sm font-bold text-white hover:bg-[#91122d] transition disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {settingsLoading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>

        {/* Operations Filter Bar */}
        <div className="grid gap-4 md:grid-cols-[1fr_240px_200px] bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          {/* Search box */}
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Find race name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10"
            />
          </div>

          {/* Championship Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter championship..."
              value={filterChampionship}
              onChange={(e) => setFilterChampionship(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10"
            />
          </div>

          {/* Status Select */}
          <div>
            <select
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10"
              onChange={(e) => setFilterStatus(e.target.value)}
              value={filterStatus}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="LOCKED">Locked</option>
              <option value="SETTLEMENT_PENDING">Settlement Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        {/* Grouped Races */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-12 rounded-xl border border-slate-200 bg-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b3193a]"></div>
            </div>
          ) : error ? (
            <div className="px-6 py-10 text-center rounded-xl border border-slate-200 bg-white">
              <p className="text-sm font-bold text-rose-700">{error}</p>
              <button
                className="mt-4 rounded bg-[#070f4f] px-4 py-2 text-xs font-bold text-white hover:bg-[#101a70]"
                onClick={loadRaces}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : Object.keys(groupedRaces).length === 0 ? (
            <div className="px-6 py-12 text-center rounded-xl border border-slate-200 bg-white text-slate-500 font-medium">
              No tournaments or races found matching filter criteria.
            </div>
          ) : selectedTournament === null ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(groupedRaces).map(([tName, tRaces]) => {
                const openRacesCount = tRaces.filter(r => r.predictionStatus === "OPEN").length;
                return (
                  <button
                    key={tName}
                    onClick={() => toggleTournament(tName)}
                    className="flex flex-col items-start p-6 rounded-xl border border-slate-200 bg-white hover:border-[#b3193a] hover:shadow-md transition-all text-left group"
                  >
                    <div className="h-12 w-12 rounded-lg bg-[#070f4f] text-white flex items-center justify-center shadow-inner mb-4 group-hover:scale-105 transition-transform">
                      <Trophy className="h-6 w-6 text-gold-400" />
                    </div>
                    <h3 className="font-black text-lg text-[#171717] line-clamp-2">{tName}</h3>
                    <div className="mt-3 w-full pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-bold">{tRaces.length} total races</span>
                      {openRacesCount > 0 ? (
                        <span className="text-xs text-emerald-600 font-black px-2 py-1 bg-emerald-50 rounded-full">{openRacesCount} OPEN</span>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold">Closed</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#070f4f] text-white flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Trophy className="h-5 w-5 text-gold-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-[#171717]">{selectedTournament}</h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                      {groupedRaces[selectedTournament]?.length || 0} races found
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTournament(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Back to Tournaments
                </button>
              </div>

              <div className="mb-6 flex">
                <button
                  onClick={handleOpenKanban}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#070f4f] to-[#1a237e] text-white px-6 py-3 rounded-xl font-black text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <Layers className="h-5 w-5 text-indigo-200" />
                  🏆 Open Tournament Streak Ledger
                  {kanbanLoading && (
                    <span className="ml-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  )}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groupedRaces[selectedTournament]?.map((race) => (
                  <Link
                    key={race.raceId}
                    to={`/admin/predictions/races/${race.raceId}`}
                    className="flex flex-col p-5 rounded-xl border border-slate-200 bg-white hover:border-[#b3193a] hover:shadow-md transition-all text-left group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-full -z-10 group-hover:bg-rose-50 transition-colors"></div>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider font-black whitespace-nowrap ${getStatusStyle(race.predictionStatus)}`}>
                        {getStatusLabel(race.predictionStatus)}
                      </span>
                      <p className="font-bold text-[10px] flex items-center gap-1 text-slate-400 whitespace-nowrap">
                        <Calendar className="h-3 w-3" />
                        {new Date(race.raceAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <h4 className="font-black text-[#171717] leading-tight mb-1">{race.raceName}</h4>
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-4">{race.roundName}</p>
                    
                    <div className="mt-auto w-full flex items-center justify-between pt-3 border-t border-slate-100">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Tickets</p>
                        <p className="font-black text-[#070f4f]">{race.totalPredictions}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Results</p>
                        {race.predictionStatus === "COMPLETED" ? (
                          <p className="text-emerald-700 font-black text-xs">+{race.correctWinnerCount} <span className="text-slate-300 font-normal">|</span> <span className="text-rose-600">{race.incorrectCount}</span></p>
                        ) : race.predictionStatus === "REFUNDED" ? (
                          <p className="text-orange-600 font-black text-[10px] uppercase tracking-wider">Refunded</p>
                        ) : (
                          <p className="text-slate-400 font-bold text-xs">-</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {showKanban && selectedTournament && (
        <AdminStreakKanbanBoard
          streaks={streaks.filter((s) => s.tournamentName === selectedTournament)}
          tournamentName={selectedTournament}
          onClose={() => setShowKanban(false)}
        />
      )}
    </AdminLayout>
  );
}
