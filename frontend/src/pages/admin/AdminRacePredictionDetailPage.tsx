import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ArrowLeft, AlertCircle, RotateCw, Search, Award, CheckCircle2, XCircle, Info, Calendar } from "lucide-react";
import {
  getAdminPredictionRaceDetail,
  getAdminRacePredictions,
  retrySettlementJob,
} from "../../api/adminPredictionApi";

export function AdminRacePredictionDetailPage() {
  const { raceId: paramRaceId } = useParams();
  const raceId = Number(paramRaceId);
  useDocumentTitle("Race Prediction Details");

  const [raceDetail, setRaceDetail] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      getAdminPredictionRaceDetail(raceId),
      getAdminRacePredictions(raceId),
    ])
      .then(([detail, predictionRows]) => {
        setRaceDetail(detail);
        setPredictions(predictionRows);
      })
      .catch(() => {
        setRaceDetail(null);
        setPredictions([]);
        setError("Unable to load prediction race details. Check the API connection and try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [raceId]);

  const handleRetryJob = async (jobId: number) => {
    setRetrying(true);
    try {
      await retrySettlementJob(jobId);
      alert("Settlement Job retry requested successfully!");
      loadData();
    } catch (err) {
      setError("Unable to retry the settlement job. Check the API connection and try again.");
    } finally {
      setRetrying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Open</span>;
      case "LOCKED":
        return <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">Locked</span>;
      case "SETTLEMENT_PENDING":
        return <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 animate-pulse">Settlement Pending</span>;
      case "PROCESSING":
        return <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 animate-spin">Processing</span>;
      case "COMPLETED":
        return <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">Completed</span>;
      case "FAILED":
        return <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">Failed</span>;
      case "REFUNDED":
        return <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">Refunded</span>;
      default:
        return null;
    }
  };

  if (loading && !raceDetail) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b3193a]"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!raceDetail) {
    return (
      <AdminLayout>
        <div className="text-center py-20 space-y-4">
          <Info className="h-12 w-12 mx-auto text-slate-400" />
          <h2 className="text-xl font-bold text-slate-700">
            {error ?? "No prediction race found"}
          </h2>
          {error && (
            <button
              className="rounded bg-[#070f4f] px-4 py-2 text-xs font-bold text-white hover:bg-[#101a70]"
              onClick={loadData}
              type="button"
            >
              Retry
            </button>
          )}
          <Link className="text-[#b3193a] underline font-bold" to="/admin/predictions">Back to list</Link>
        </div>
      </AdminLayout>
    );
  }

  const isCompleted = raceDetail.predictionStatus === "COMPLETED" || raceDetail.predictionStatus === "FAILED";
  const isRefunded = raceDetail.predictionStatus === "REFUNDED";

  const filteredPredictions = predictions.filter((p) => {
    const matchesSearch = !searchQuery || p.spectatorName.toLowerCase().includes(searchQuery.toLowerCase()) || p.spectatorEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || p.predictionType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <AdminLayout>
      <section aria-labelledby="race-detail-title" className="space-y-6">
        <div className="flex items-center gap-2">
          <Link
            className="flex items-center gap-1.5 text-sm font-black text-[#070f4f] hover:text-[#b3193a] transition"
            to="/admin/predictions"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Predictions Monitor
          </Link>
        </div>

        {/* Header section */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-[#d8d8d8] pb-6">
          <div>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider">
              {raceDetail.roundName}
            </span>
            <h1 id="race-detail-title" className="mt-2 text-3xl font-black tracking-tight text-[#161616]">
              {raceDetail.raceName}
            </h1>
            <p className="mt-1 text-sm text-slate-600 font-bold uppercase tracking-wider">
              {raceDetail.tournamentName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(raceDetail.predictionStatus)}
          </div>
        </div>

        {/* Settlement failure alert banner */}
        {raceDetail.predictionStatus === "FAILED" && raceDetail.settlementJob && (
          <div className="rounded-lg border-2 border-rose-300 bg-rose-50 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-rose-700 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black text-rose-900 text-base">Settlement Job Failed</h3>
                <p className="text-sm text-rose-700 mt-1 font-semibold leading-relaxed">
                  Error: {raceDetail.settlementJob.errorMessage}
                </p>
                <p className="text-xs text-rose-500 mt-2 font-bold uppercase tracking-wider">
                  Retry attempts: {raceDetail.settlementJob.retryCount}
                </p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 rounded bg-rose-700 px-5 py-2.5 text-sm font-black text-white hover:bg-rose-800 transition disabled:opacity-60"
              disabled={retrying}
              onClick={() => handleRetryJob(raceDetail.settlementJob.id)}
            >
              <RotateCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
              Retry Settlement
            </button>
          </div>
        )}

        {/* Summary metrics cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-[#d8d8d8] bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Total Predictions</p>
            <p className="mt-2 text-3xl font-black text-[#070f4f]">{raceDetail.summary.totalPredictions}</p>
            <p className="mt-1 text-xs text-slate-500 font-bold">
              {raceDetail.summary.winnerPickCount} Winner / {raceDetail.summary.top3PickCount} Top3
            </p>
          </div>

          {!isCompleted && !isRefunded && (
            <>
              <div className="rounded-lg border border-[#d8d8d8] bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Winner Predictions</p>
                <p className="mt-2 text-3xl font-black text-slate-800">{raceDetail.summary.winnerPickCount}</p>
                <p className="mt-1 text-xs text-slate-500 font-bold">Cost: 5 pts / entry</p>
              </div>
              <div className="rounded-lg border border-[#d8d8d8] bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Top 3 Predictions</p>
                <p className="mt-2 text-3xl font-black text-slate-800">{raceDetail.summary.top3PickCount}</p>
                <p className="mt-1 text-xs text-slate-500 font-bold">Cost: 10 pts / entry</p>
              </div>
              <div className="rounded-lg border border-[#d8d8d8] bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Total Participation Points</p>
                <p className="mt-2 text-3xl font-black text-[#b3193a]">
                  {raceDetail.summary.winnerPickCount * 5 + raceDetail.summary.top3PickCount * 10} pts
                </p>
                <p className="mt-1 text-xs text-slate-500 font-bold">Participation fees deducted</p>
              </div>
            </>
          )}

          {isCompleted && (
            <>
              <div className="rounded-lg border border-[#d8d8d8] bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Correct Predictions</p>
                <p className="mt-2 text-3xl font-black text-emerald-700">
                  {raceDetail.summary.winnerCorrectCount + raceDetail.summary.exactTop3Count + raceDetail.summary.top3AnyOrderCount}
                </p>
                <p className="mt-1 text-xs text-slate-500 font-bold">
                  {raceDetail.summary.winnerCorrectCount} Winner / {raceDetail.summary.exactTop3Count + raceDetail.summary.top3AnyOrderCount} Top3
                </p>
              </div>
              <div className="rounded-lg border border-[#d8d8d8] bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Incorrect Predictions</p>
                <p className="mt-2 text-3xl font-black text-rose-700">{raceDetail.summary.incorrectCount}</p>
                <p className="mt-1 text-xs text-slate-500 font-bold">No correct matches</p>
              </div>
              <div className="rounded-lg border border-[#d8d8d8] bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Total Reward Points Paid</p>
                <p className="mt-2 text-3xl font-black text-indigo-700 flex items-center gap-1">
                  <Award className="h-7 w-7 text-indigo-600" />
                  {raceDetail.summary.rewardedPoints} pts
                </p>
                <p className="mt-1 text-xs text-slate-500 font-bold">Credited to user balances</p>
              </div>
            </>
          )}

          {isRefunded && (
            <div className="rounded-lg border border-[#d8d8d8] bg-white p-5 col-span-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Total Refunded Points</p>
              <p className="mt-2 text-3xl font-black text-orange-600">
                {raceDetail.summary.totalPredictions * 5} - {raceDetail.summary.totalPredictions * 10} pts
              </p>
              <p className="mt-1 text-sm text-orange-700 font-bold">
                Refunded 100% entry points for {raceDetail.summary.refundedCount} predictions due to race cancellation.
              </p>
            </div>
          )}
        </div>

        {/* Prediction Audit List Table */}
        <div className="rounded-lg border border-[#d8d8d8] bg-white overflow-hidden shadow-sm">
          <div className="border-b border-[#d8d8d8] p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#161616]">
                {raceDetail.predictionStatus === "OPEN" ? "Predictor List" : "Predictions Audit Ledger"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {raceDetail.predictionStatus === "OPEN" 
                  ? "Predictions are open. Correct/incorrect results are hidden."
                  : "Predictions are locked. Detailed result classification and rewards ledger are shown."}
              </p>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <select
                className="h-10 px-3 rounded-md border border-[#ccc] bg-white text-xs font-medium outline-none focus:border-[#b3193a]"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Prediction Types</option>
                <option value="WINNER">Winner</option>
                <option value="TOP3">Top 3</option>
              </select>

              <div className="relative flex-1 md:w-60">
                <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                <input
                  className="h-10 pl-9 pr-4 w-full rounded-md border border-[#ccc] bg-white text-xs outline-none focus:border-[#b3193a]"
                  placeholder="Search spectator (Name, Email)..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-[#f7f7f7] text-slate-500 uppercase tracking-[0.12em] font-bold border-b border-[#ececec]">
                <tr>
                  <th className="px-6 py-3.5">Spectator</th>
                  <th className="px-6 py-3.5">Prediction Type</th>
                  <th className="px-6 py-3.5">Selected Horses</th>
                  {isCompleted && <th className="px-6 py-3.5">Result Classification</th>}
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Entry Cost</th>
                  <th className="px-6 py-3.5 text-right">Reward Points</th>
                  <th className="px-6 py-3.5">Submission Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {filteredPredictions.length === 0 ? (
                  <tr>
                    <td colSpan={isCompleted ? 8 : 7} className="px-6 py-8 text-center text-slate-500 font-medium">
                      No predictions recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredPredictions.map((p) => (
                    <tr className="hover:bg-[#fafafa]" key={p.predictionId}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#171717]">{p.spectatorName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{p.spectatorEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          {p.predictionType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {p.selections.map((hName: string, index: number) => (
                            <span
                              className="inline-flex items-center rounded bg-slate-100 border border-slate-200 px-2 py-0.5 font-bold text-slate-800 text-[10px]"
                              key={index}
                            >
                              {p.predictionType === "TOP3" && `${index + 1}. `}
                              {hName}
                            </span>
                          ))}
                        </div>
                      </td>
                      {isCompleted && (
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase ${
                            p.resultCategory.includes("Correct") || p.resultCategory.includes("Top 3")
                              ? "text-emerald-700"
                              : "text-rose-700"
                          }`}>
                            {p.resultCategory.includes("Correct") || p.resultCategory.includes("Top 3") ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            {p.resultCategory}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold text-[10px] ${
                          p.displayStatus === "Won" 
                            ? "bg-emerald-50 text-emerald-700"
                            : p.displayStatus === "Lost"
                            ? "bg-rose-50 text-rose-700"
                            : p.displayStatus === "Refunded"
                            ? "bg-orange-50 text-orange-700"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {p.displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-700">{p.entryCostPoints} pts</td>
                      <td className="px-6 py-4 text-right font-black">
                        {p.displayStatus === "Won" ? (
                          <span className="text-emerald-700">+{p.rewardPoints} pts</span>
                        ) : p.displayStatus === "Refunded" ? (
                          <span className="text-orange-600">+{p.rewardPoints} pts</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-semibold flex items-center gap-1 border-0">
                        <Calendar className="h-3.5 w-3.5 opacity-60" />
                        {new Date(p.submittedAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })} - {new Date(p.submittedAt).toLocaleDateString("en-US")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
