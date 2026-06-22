import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, Loader2, X, XCircle } from "lucide-react";

import {
  acceptRefereeContract,
  declineRefereeContract,
  getMyRefereeContracts,
} from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { RefereeContract, RefereeContractStatus } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

const FILTERS: { label: string; value: RefereeContractStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Declined", value: "DECLINED" },
  { label: "Terminated", value: "TERMINATED" },
];

const statusClasses: Record<RefereeContractStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  ACTIVE: "border-emerald-200 bg-emerald-50 text-[#006d5b]",
  DECLINED: "border-red-200 bg-red-50 text-red-700",
  TERMINATED: "border-slate-200 bg-slate-100 text-slate-600",
};

function formatDateTime(value?: string) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function RefereeContractsPage() {
  useDocumentTitle("Referee contracts");

  const [contracts, setContracts] = useState<RefereeContract[]>([]);
  const [activeFilter, setActiveFilter] = useState<RefereeContractStatus>("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [declineTarget, setDeclineTarget] = useState<RefereeContract | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyRefereeContracts();
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load your contracts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(() => {
    return FILTERS.reduce<Record<string, number>>((acc, f) => {
      acc[f.value] = contracts.filter((c) => c.status === f.value).length;
      return acc;
    }, {});
  }, [contracts]);

  const filtered = contracts.filter((c) => c.status === activeFilter);

  const handleAccept = async (contract: RefereeContract) => {
    setActionLoading(true);
    setError("");
    try {
      await acceptRefereeContract(contract.id);
      await load();
      setActiveFilter("ACTIVE");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not accept this contract."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!declineTarget) return;
    setActionLoading(true);
    setError("");
    try {
      await declineRefereeContract(declineTarget.id, declineReason.trim() || undefined);
      setDeclineTarget(null);
      setDeclineReason("");
      await load();
      setActiveFilter("DECLINED");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not decline this contract."));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section aria-labelledby="referee-contracts-title" className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-[#007a68]">Officiating contracts</p>
        <h1 id="referee-contracts-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Contracts
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
          Organizers invite licensed referees per tournament. Accepting a contract makes you eligible to be assigned to
          that tournament's races.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={[
                "min-h-11 rounded-md border px-3 text-xs font-black uppercase tracking-[0.08em] transition",
                isActive ? "border-[#007a68] bg-[#007a68] text-white" : "border-slate-200 bg-white text-slate-500 hover:text-slate-900",
              ].join(" ")}
            >
              {filter.label} {counts[filter.value] ?? 0}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-lg border border-slate-200 bg-white" />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="mt-4 text-lg font-black text-slate-900">No {activeFilter.toLowerCase()} contracts</p>
          <p className="mx-auto mt-1 max-w-md text-sm font-bold text-slate-500">
            Contracts appear here when an organizer invites you to officiate a tournament.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((contract) => (
            <li key={contract.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className={["inline-flex rounded-md border px-2 py-1 text-xs font-black uppercase tracking-[0.12em]", statusClasses[contract.status]].join(" ")}>
                    {contract.status}
                  </span>
                  <h2 className="mt-2 text-xl font-black text-slate-950">{contract.tournamentName}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">Invited {formatDateTime(contract.createdAt)}</p>
                  {contract.reason && contract.status !== "PENDING" && (
                    <p className="mt-2 text-sm font-bold text-slate-600">Note: {contract.reason}</p>
                  )}
                </div>
                {contract.status === "PENDING" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleAccept(contract)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#007a68] px-5 text-sm font-black text-white hover:bg-[#005f51] disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => { setDeclineTarget(contract); setDeclineReason(""); }}
                      className="inline-flex min-h-11 items-center gap-2 rounded-md border border-red-200 bg-white px-5 text-sm font-black text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {declineTarget && (
        <div aria-modal="true" role="dialog" className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-red-700">Decline Contract</p>
                <h2 className="mt-2 text-xl font-black text-slate-950">{declineTarget.tournamentName}</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setDeclineTarget(null)} className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <label className="block">
                <span className="text-sm font-black text-slate-800">Reason (optional)</span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Let the organizer know why you can't take this."
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5">
              <button type="button" onClick={() => setDeclineTarget(null)} className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-100">
                Cancel
              </button>
              <button type="button" disabled={actionLoading} onClick={handleDecline} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-red-700 px-5 text-sm font-black text-white hover:bg-red-800 disabled:opacity-50">
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Decline Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
