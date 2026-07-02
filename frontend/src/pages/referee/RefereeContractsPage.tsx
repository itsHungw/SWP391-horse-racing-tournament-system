import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, FileText, Loader2, Search, X, XCircle } from "lucide-react";

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
  ACTIVE: "border-emerald-200 bg-emerald-50 text-[#007a68]",
  DECLINED: "border-red-200 bg-red-50 text-red-700",
  TERMINATED: "border-slate-200 bg-slate-100 text-slate-600",
};

function formatDateTime(value?: string) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function contractInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function RefereeContractsPage() {
  useDocumentTitle("Referee contracts");

  const [contracts, setContracts] = useState<RefereeContract[]>([]);
  const [activeFilter, setActiveFilter] = useState<RefereeContractStatus>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
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
      const loadedContracts = Array.isArray(data) ? data : [];
      setContracts(loadedContracts);
      setSelectedContractId((current) => {
        if (current && loadedContracts.some((c) => c.id === current)) return current;
        return loadedContracts.find((c) => c.status === "PENDING")?.id ?? loadedContracts[0]?.id ?? null;
      });
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

  const filtered = useMemo(() => {
    return contracts.filter(
      (c) =>
        c.status === activeFilter &&
        (c.tournamentName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contracts, activeFilter, searchQuery]);

  const selectedContract = useMemo(() => {
    return contracts.find((c) => c.id === selectedContractId) ?? filtered[0] ?? null;
  }, [contracts, selectedContractId, filtered]);

  const handleFilterChange = (filter: RefereeContractStatus) => {
    setActiveFilter(filter);
    const firstContract = contracts.find(
      (c) => c.status === filter && (c.tournamentName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (firstContract) {
      setSelectedContractId(firstContract.id);
    } else {
      setSelectedContractId(null);
    }
  };

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
    <section aria-labelledby="referee-contracts-title" className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm border-t-4 border-t-[#007a68]">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#007a68]">Officiating Workspace</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 id="referee-contracts-title" className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Tournament Contracts
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Organizers invite licensed referees per tournament. Accepting an invitation makes you eligible to be assigned to that tournament's races.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Pending</span>
              <p className="mt-1 text-2xl font-black text-slate-950">{counts["PENDING"] ?? 0}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#007a68]">Active</span>
              <p className="mt-1 text-2xl font-black text-slate-950">{counts["ACTIVE"] ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 flex gap-3 items-center" role="alert">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-black text-slate-950">No officiating contracts yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500 leading-relaxed">
            Tournament invitations appear here when organizers select you from the certified steward registry.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          {/* Left Column: Inbox List */}
          <section aria-labelledby="contract-list-title" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <h2 id="contract-list-title" className="text-lg font-black text-slate-950">Contract Inbox</h2>
              <p className="text-xs font-semibold text-slate-500">Manage and filter your invitations</p>
            </div>

            <div aria-label="Contract filters" className="grid grid-cols-4 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1" role="tablist">
              {FILTERS.map((filter) => {
                const isActive = activeFilter === filter.value;
                const count = counts[filter.value] ?? 0;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleFilterChange(filter.value)}
                    className={`min-h-10 rounded-md px-1 text-[10px] font-black uppercase tracking-wider transition focus:outline-none ${
                      isActive ? "bg-white text-slate-950 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {filter.label} {count}
                  </button>
                );
              })}
            </div>

            <label className="relative block">
              <span className="sr-only">Search tournament</span>
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tournament..."
                type="search"
                value={searchQuery}
              />
            </label>

            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
                <p className="mt-4 text-sm font-black text-slate-900">No {activeFilter.toLowerCase()} contracts</p>
                <p className="mx-auto mt-1 max-w-[200px] text-xs font-semibold text-slate-500 leading-relaxed">
                  No matching invitations were found in this tab.
                </p>
              </div>
            ) : (
              <ul aria-label="Contract list" className="space-y-3">
                {filtered.map((contract) => {
                  const isSelected = selectedContract?.id === contract.id;
                  return (
                    <li key={contract.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedContractId(contract.id)}
                        className={`relative w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:border-[#007a68]/40 hover:bg-[#007a68]/5 focus:outline-none ${
                          isSelected ? "border-[#007a68] bg-[#007a68]/5 shadow-sm" : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-black text-[#007a68]">
                            {contractInitials(contract.tournamentName || "Tournament")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className={`inline-flex rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${statusClasses[contract.status]}`}>
                              {contract.status}
                            </span>
                            <h3 className="mt-2 text-sm font-black text-slate-950 truncate">{contract.tournamentName}</h3>
                            <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                              Invited {formatDateTime(contract.createdAt)}
                            </span>
                          </div>
                          <ChevronRight className="mt-1 h-4 w-4 text-slate-400" aria-hidden="true" />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Right Column: Selected Contract Detail Panel */}
          {selectedContract ? (
            <section aria-label="Contract Detail" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 border-t-4 border-t-[#007a68]">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-base font-black text-[#007a68]">
                    {contractInitials(selectedContract.tournamentName || "Tournament")}
                  </div>
                  <div>
                    <span className={`inline-flex rounded px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${statusClasses[selectedContract.status]}`}>
                      {selectedContract.status}
                    </span>
                    <h2 className="mt-3 text-2xl font-black text-slate-950">Contract Detail</h2>
                    <p className="mt-1.5 text-xs font-semibold text-slate-450 text-slate-500">
                      Invitation received on {formatDateTime(selectedContract.createdAt)}
                    </p>
                  </div>
                </div>
                <FileText className="h-6 w-6 text-[#007a68]" aria-hidden="true" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tournament Name</span>
                  <p className="mt-1 text-sm font-black text-slate-950">{selectedContract.tournamentName}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Contract Status</span>
                  <p className="mt-1 text-sm font-black text-slate-950">{selectedContract.status}</p>
                </div>
              </div>

              {selectedContract.reason && selectedContract.status !== "PENDING" && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Declined Reason</span>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{selectedContract.reason}</p>
                </div>
              )}

              <div className="rounded-lg border border-[#007a68]/20 bg-[#007a68]/5 p-5 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-[#007a68]">Stewardship Terms & Conditions</p>
                <ul className="space-y-2 text-sm font-semibold text-slate-700">
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#007a68]" aria-hidden="true" />
                    <span>Accepting this invitation registers you as an active tournament official.</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#007a68]" aria-hidden="true" />
                    <span>You will be eligible for race scheduling and direct assignment checklists.</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#007a68]" aria-hidden="true" />
                    <span>Officials must abide by race regulations and record all incidents.</span>
                  </li>
                </ul>
              </div>

              {selectedContract.status === "PENDING" && (
                <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAccept(selectedContract)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#007a68] px-5 text-sm font-black text-white hover:bg-[#006f5f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Accept Contract
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => { setDeclineTarget(selectedContract); setDeclineReason(""); }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 bg-white px-5 text-sm font-black text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                  >
                    <XCircle className="h-4 w-4" />
                    Decline
                  </button>
                </div>
              )}
            </section>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center flex flex-col justify-center items-center">
              <FileText className="h-10 w-10 text-slate-300" aria-hidden="true" />
              <h3 className="mt-4 text-base font-black text-slate-900">No contract selected</h3>
              <p className="mt-1 max-w-[240px] text-xs font-semibold text-slate-500 leading-relaxed">
                Select an invitation from the inbox list on the left to review its details and take action.
              </p>
            </div>
          )}
        </div>
      )}

      {declineTarget && (
        <div
          aria-label="Decline contract"
          aria-modal="true"
          role="dialog"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-sm p-4 sm:items-center"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-red-700">Decline Contract</p>
                <h2 className="mt-2 text-xl font-black text-slate-950">{declineTarget.tournamentName}</h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setDeclineTarget(null)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <label className="block">
                <span className="text-sm font-black text-slate-800">Reason (optional)</span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Explain why you cannot accept this tournament contract."
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5">
              <button
                type="button"
                onClick={() => setDeclineTarget(null)}
                className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-100 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDecline}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-700 px-5 text-sm font-black text-white hover:bg-red-800 focus:outline-none disabled:opacity-50"
              >
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
