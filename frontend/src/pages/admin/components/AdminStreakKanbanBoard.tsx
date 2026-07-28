import React, { useState } from "react";
import { AdminStreakPrediction, AdminStreakPredictionLeg } from "../../../api/adminPredictionApi";
import { formatVnd } from "../../spectator/predictions/predictionCockpitUtils";
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Trophy, Activity, Wallet, XOctagon } from "lucide-react";

interface AdminStreakKanbanBoardProps {
  streaks: AdminStreakPrediction[];
  onClose: () => void;
  tournamentName: string;
}

const TableRow = ({ streak }: { streak: AdminStreakPrediction }) => {
  const [expanded, setExpanded] = useState(false);

  const legs = streak.legs || [];
  const totalLegs = legs.length;
  const wonLegs = legs.filter((l) => l.status === "WON").length;
  
  // Potential Payout
  const potentialPayout = streak.wagerAmount * streak.totalOdds;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "WON":
        return <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 text-xs font-bold"><Wallet className="h-3 w-3" /> WIN</span>;
      case "LOST":
      case "REFUNDED":
        return <span className="inline-flex items-center gap-1 bg-rose-100 text-[#b3193a] px-2 py-0.5 rounded border border-rose-200 text-xs font-bold"><XOctagon className="h-3 w-3" /> {status}</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-indigo-100 text-[#070f4f] px-2 py-0.5 rounded border border-indigo-200 text-xs font-bold"><Activity className="h-3 w-3" /> ACTIVE</span>;
    }
  };

  const getLegStatusIcon = (status: string) => {
    switch (status) {
      case "WON":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "LOST":
      case "REFUNDED":
        return <XCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <>
      <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${expanded ? 'bg-slate-50' : ''}`}>
        <td className="px-4 py-3">
          <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-700 transition">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </td>
        <td className="px-4 py-3">
          <p className="font-bold text-slate-800 text-sm">{streak.spectatorName}</p>
          <p className="text-xs text-slate-500">{streak.spectatorEmail}</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-bold text-slate-700">{new Date(streak.createdAt).toLocaleDateString()}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(streak.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
        </td>
        <td className="px-4 py-3 font-bold text-slate-700">{formatVnd(streak.wagerAmount)}</td>
        <td className="px-4 py-3 font-black text-emerald-600">{formatVnd(potentialPayout)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">{wonLegs} / {totalLegs}</span>
            <div className="h-1.5 w-16 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${streak.status === 'LOST' ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                style={{ width: `${totalLegs > 0 ? (wonLegs / totalLegs) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          {getStatusBadge(streak.status)}
        </td>
      </tr>
      
      {/* Expanded Row */}
      {expanded && (
        <tr>
          <td colSpan={7} className="p-0 border-b border-slate-200">
            <div className="bg-slate-100 p-4 shadow-inner">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Leg Breakdown (x{streak.totalOdds.toFixed(2)} Total Odds)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {legs.map((leg, idx) => (
                  <div key={leg.id} className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400">Leg {idx + 1}</span>
                      <div className="flex items-center gap-1">
                        {getLegStatusIcon(leg.status)}
                        <span className="text-[10px] font-bold text-slate-600">{leg.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs font-bold text-slate-800 truncate pr-2">{leg.raceName}</p>
                      <span className="text-xs font-black text-slate-500 bg-slate-50 px-1.5 rounded">x{leg.lockedOdds.toFixed(2)}</span>
                    </div>
                    <div className="mt-auto pt-2">
                      <span className="inline-flex items-center text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 w-full">
                        🎯 Pick: {leg.predictedWinnerName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export const AdminStreakKanbanBoard: React.FC<AdminStreakKanbanBoardProps> = ({
  streaks,
  onClose,
  tournamentName,
}) => {
  return (
    <div id="streak-kanban-board" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-8">
      <div className="w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Streak Ledger</h2>
              <p className="text-xs font-bold text-slate-500">{tournamentName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200">
              {streaks.length} Total Tickets
            </div>
            <button
              onClick={onClose}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              Close Ledger
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto admin-sidebar-scrollbar bg-slate-50/50">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="w-12 px-4 py-3"></th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">Spectator</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">Submitted</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">Wager</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">To Win</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400">Progress</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {streaks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 font-bold">
                    No streak tickets found for this tournament.
                  </td>
                </tr>
              ) : (
                streaks.map((s) => <TableRow key={s.id} streak={s} />)
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
