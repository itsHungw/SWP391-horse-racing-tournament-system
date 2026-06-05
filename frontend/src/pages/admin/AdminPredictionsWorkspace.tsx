import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Calendar, ChevronRight, Filter, Compass } from "lucide-react";
import { getAdminPredictionRaces } from "../../api/adminPredictionApi";

// Mock data matching backend API contract for local fallback
const mockRaces = [
  {
    raceId: 101,
    raceName: "Spring Championship Qualifier",
    roundName: "Round 1",
    tournamentId: 1,
    tournamentName: "Spring Cup 2026",
    raceAt: "2026-06-10T14:30:00",
    raceStatus: "SCHEDULED",
    predictionStatus: "OPEN",
    totalPredictions: 120,
    winnerPickCount: 80,
    top3PickCount: 40,
    correctWinnerCount: 0,
    exactTop3Count: 0,
    partialTop3Count: 0,
    incorrectCount: 0,
    settlementJobStatus: null
  },
  {
    raceId: 102,
    raceName: "Summer Derby Main",
    roundName: "Round 2",
    tournamentId: 2,
    tournamentName: "Golden Horseshoe Cup",
    raceAt: "2026-06-03T18:00:00",
    raceStatus: "ONGOING",
    predictionStatus: "LOCKED",
    totalPredictions: 250,
    winnerPickCount: 150,
    top3PickCount: 100,
    correctWinnerCount: 0,
    exactTop3Count: 0,
    partialTop3Count: 0,
    incorrectCount: 0,
    settlementJobStatus: null
  },
  {
    raceId: 103,
    raceName: "Classic Sprint Final",
    roundName: "Final",
    tournamentId: 3,
    tournamentName: "NYRA Aqueduct Classic",
    raceAt: "2026-06-02T15:00:00",
    raceStatus: "PUBLISHED",
    predictionStatus: "COMPLETED",
    totalPredictions: 430,
    winnerPickCount: 280,
    top3PickCount: 150,
    correctWinnerCount: 120,
    exactTop3Count: 40,
    partialTop3Count: 30,
    incorrectCount: 240,
    settlementJobStatus: "COMPLETED"
  },
  {
    raceId: 104,
    raceName: "Novice Turf Run",
    roundName: "Round 1",
    tournamentId: 1,
    tournamentName: "Spring Cup 2026",
    raceAt: "2026-06-01T10:00:00",
    raceStatus: "RESULT_CONFIRMED",
    predictionStatus: "FAILED",
    totalPredictions: 85,
    winnerPickCount: 50,
    top3PickCount: 35,
    correctWinnerCount: 0,
    exactTop3Count: 0,
    partialTop3Count: 0,
    incorrectCount: 0,
    settlementJobStatus: "FAILED"
  },
  {
    raceId: 105,
    raceName: "Pony Club Exhibition",
    roundName: "Exhibition",
    tournamentId: 2,
    tournamentName: "Golden Horseshoe Cup",
    raceAt: "2026-05-28T09:00:00",
    raceStatus: "CANCELLED",
    predictionStatus: "REFUNDED",
    totalPredictions: 64,
    winnerPickCount: 44,
    top3PickCount: 20,
    correctWinnerCount: 0,
    exactTop3Count: 0,
    partialTop3Count: 0,
    incorrectCount: 0,
    settlementJobStatus: null
  }
];

export function AdminPredictionsWorkspace() {
  useDocumentTitle("Race predictions monitor");

  const [races, setRaces] = useState<any[]>(mockRaces);
  const [loading, setLoading] = useState(false);
  const [filterTournament, setFilterTournament] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    getAdminPredictionRaces()
      .then((data) => {
        setRaces(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Using mock prediction races data:", err.message);
        setRaces(mockRaces);
        setLoading(false);
      });
  }, []);

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
    const matchesTournament = !filterTournament || race.tournamentName.toLowerCase().includes(filterTournament.toLowerCase());
    const matchesStatus = !filterStatus || race.predictionStatus === filterStatus;
    const matchesSearch = !searchQuery || race.raceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTournament && matchesStatus && matchesSearch;
  });

  return (
    <AdminLayout>
      <section aria-labelledby="prediction-monitor-title" className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b3193a]">
              Game economy controls
            </p>
            <h1 id="prediction-monitor-title" className="mt-2 text-4xl font-black tracking-tight flex items-center gap-2">
              <Compass className="h-9 w-9 text-[#b3193a]" />
              Predictions Monitor
            </h1>
            <p className="mt-2 max-w-3xl text-base text-slate-600">
              Manage and monitor spectator predictions for each race. Audit point reward transactions and handle resolution jobs.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="rounded-lg border border-[#d8d8d8] bg-white p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <select
                className="h-10 pl-9 pr-6 rounded-md border border-[#ccc] bg-white text-sm font-medium outline-none focus:border-[#b3193a]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Prediction Statuses</option>
                <option value="OPEN">Open</option>
                <option value="LOCKED">Locked</option>
                <option value="SETTLEMENT_PENDING">Settlement Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <input
              className="h-10 px-4 rounded-md border border-[#ccc] bg-white text-sm outline-none focus:border-[#b3193a]"
              placeholder="Tournament..."
              type="text"
              value={filterTournament}
              onChange={(e) => setFilterTournament(e.target.value)}
            />
          </div>

          <input
            className="h-10 w-full md:max-w-xs px-4 rounded-md border border-[#ccc] bg-white text-sm outline-none focus:border-[#b3193a]"
            placeholder="Search race..."
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Races table */}
        <div className="rounded-lg border border-[#d8d8d8] bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b3193a]"></div>
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
                            {race.winnerPickCount} Win / {race.top3PickCount} Top3
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold">
                          {race.predictionStatus === "COMPLETED" ? (
                            <div>
                              <p className="text-emerald-700 font-bold">
                                +{race.correctWinnerCount + race.exactTop3Count + race.partialTop3Count} correct
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
