import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Calendar, ChevronRight, Search, Compass, Settings, Save, Check } from "lucide-react";
import { getAdminPredictionRaces, getPredictionSettings, updatePredictionSettings } from "../../api/adminPredictionApi";

export function AdminPredictionsWorkspace() {
  useDocumentTitle("Race predictions monitor");

  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterChampionship, setFilterChampionship] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
    const matchesChampionship = !filterChampionship || race.tournamentName.toLowerCase().includes(filterChampionship.toLowerCase());
    const matchesStatus = !filterStatus || race.predictionStatus === filterStatus;
    const matchesSearch = !searchQuery || race.raceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChampionship && matchesStatus && matchesSearch;
  });

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

        {/* Races table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b3193a]"></div>
            </div>
          ) : error ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-bold text-rose-700">{error}</p>
              <button
                className="mt-4 rounded bg-[#070f4f] px-4 py-2 text-xs font-bold text-white hover:bg-[#101a70]"
                onClick={loadRaces}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#f7f7f7] text-xs uppercase tracking-[0.14em] text-slate-500 border-b border-[#ececec]">
                  <tr>
                    <th className="px-6 py-4">Race & Tournament</th>
                    <th className="px-6 py-4">Race Time</th>
                    <th className="px-6 py-4 text-center">Prediction Status</th>
                    <th className="px-6 py-4 text-right">Total Predictions</th>
                    <th className="px-6 py-4 text-right">Results Stats (Won / Lost)</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec]">
                  {filteredRaces.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                        No races found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRaces.map((race) => (
                      <tr className="hover:bg-[#fafafa] transition-colors" key={race.raceId}>
                        <td className="px-6 py-4">
                          <p className="font-bold text-[#171717]">{race.raceName}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase text-[10px]">
                              {race.roundName}
                            </span>
                            {race.tournamentName}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <p className="font-semibold text-xs flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 opacity-60" />
                            {new Date(race.raceAt).toLocaleString("en-US", {
                              dateStyle: "short",
                              timeStyle: "short"
                            })}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getStatusStyle(race.predictionStatus)}`}>
                            {getStatusLabel(race.predictionStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-[#070f4f]">
                          <p>{race.totalPredictions}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {race.winnerPickCount} Win
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold">
                          {race.predictionStatus === "COMPLETED" ? (
                            <div>
                              <p className="text-emerald-700 font-bold">
                                +{race.correctWinnerCount} correct
                              </p>
                              <p className="text-slate-400 text-xs mt-0.5">
                                {race.incorrectCount} incorrect
                              </p>
                            </div>
                          ) : race.predictionStatus === "REFUNDED" ? (
                            <span className="text-orange-600 text-xs font-bold">Refunded</span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Unsettled</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            className="inline-flex items-center gap-1 rounded bg-[#070f4f] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#101a70] transition"
                            to={`/admin/predictions/races/${race.raceId}`}
                          >
                            Details
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
