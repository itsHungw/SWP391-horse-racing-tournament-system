import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Loader2,
  Search,
  X,
  XCircle,
} from "lucide-react";

import {
  acceptJockeyContract,
  getJockeyContracts,
  rejectJockeyContract,
} from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { JockeyLayout } from "../../layouts/JockeyLayout";
import type { JockeyInvitation, JockeyInvitationStatus } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

type ContractFilter = "PENDING" | "ACCEPTED" | "REJECTED";

const FILTERS: { label: string; value: ContractFilter }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Rejected", value: "REJECTED" },
];

function contractInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusLabel(status: JockeyInvitationStatus) {
  if (status === "ACCEPTED") return "Accepted";
  if (status === "REJECTED") return "Rejected";
  if (status === "EXPIRED") return "Expired";
  return "Pending";
}

function statusClasses(status: JockeyInvitationStatus) {
  if (status === "ACCEPTED") return "border-emerald-200 bg-emerald-50 text-[#006d5b]";
  if (status === "REJECTED") return "border-red-200 bg-red-50 text-red-700";
  if (status === "EXPIRED") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

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

function activityLabel(contract: JockeyInvitation) {
  if (contract.status === "ACCEPTED") return `Accepted ${formatDateTime(contract.acceptedAt)}`;
  if (contract.status === "REJECTED") return `Rejected ${formatDateTime(contract.rejectedAt)}`;
  if (contract.status === "EXPIRED") return "Expired";
  return `Received ${formatDateTime(contract.createdAt)}`;
}

function matchesSearch(contract: JockeyInvitation, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [contract.ownerName, contract.horseName, contract.championshipName]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

function defaultAgreementName(contract: JockeyInvitation) {
  return contract.agreementFileName || `${contract.championshipName.toLowerCase().replaceAll(" ", "-")}-agreement.pdf`;
}

export function JockeyContractsPage() {
  useDocumentTitle("Jockey contracts");

  const [contracts, setContracts] = useState<JockeyInvitation[]>([]);
  const [activeFilter, setActiveFilter] = useState<ContractFilter>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [previewContractId, setPreviewContractId] = useState<number | null>(null);
  const [readContractIds, setReadContractIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<JockeyInvitation | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState("");

  const loadContracts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getJockeyContracts();
      setContracts(Array.isArray(data) ? data : []);
      setSelectedContractId((current) => {
        if (current && data.some((contract) => contract.id === current)) return current;
        return data.find((contract) => contract.status === "PENDING")?.id ?? data[0]?.id ?? null;
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load assignment contracts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadContracts();
  }, []);

  const filteredContracts = useMemo(
    () => contracts.filter((contract) => contract.status === activeFilter && matchesSearch(contract, searchQuery)),
    [activeFilter, contracts, searchQuery],
  );

  const selectedContract =
    contracts.find((contract) => contract.id === selectedContractId) ?? filteredContracts[0] ?? contracts[0] ?? null;

  const pendingCount = contracts.filter((contract) => contract.status === "PENDING").length;
  const acceptedCount = contracts.filter((contract) => contract.status === "ACCEPTED").length;
  const rejectedCount = contracts.filter((contract) => contract.status === "REJECTED").length;

  const selectContract = (contract: JockeyInvitation) => {
    setSelectedContractId(contract.id);
    setPreviewContractId(null);
    setActionError("");
    setReadContractIds((current) => {
      const next = new Set(current);
      next.add(contract.id);
      return next;
    });
  };

  const handleFilterChange = (filter: ContractFilter) => {
    setActiveFilter(filter);
    setPreviewContractId(null);
    setActionError("");
    const firstContract = contracts.find((contract) => contract.status === filter && matchesSearch(contract, searchQuery));
    if (firstContract) setSelectedContractId(firstContract.id);
  };

  const updateContract = (updatedContract: JockeyInvitation) => {
    setContracts((current) =>
      current.map((contract) => (contract.id === updatedContract.id ? updatedContract : contract)),
    );
    setSelectedContractId(updatedContract.id);
    setReadContractIds((current) => new Set(current).add(updatedContract.id));
  };

  const handleAccept = async (contract: JockeyInvitation) => {
    setActionLoading(true);
    setActionError("");
    try {
      const updatedContract = await acceptJockeyContract(contract.id);
      updateContract(updatedContract);
      setActiveFilter("ACCEPTED");
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Could not accept this contract."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;

    setActionLoading(true);
    setActionError("");
    try {
      const updatedContract = await rejectJockeyContract(rejectTarget.id, rejectReason.trim());
      updateContract(updatedContract);
      setRejectTarget(null);
      setRejectReason("");
      setActiveFilter("REJECTED");
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Could not reject this contract."));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <JockeyLayout>
      <section aria-labelledby="contracts-title" className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Tournament Assignment Contract</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 id="contracts-title" className="text-4xl font-black tracking-tight text-slate-950">
                Contracts
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
                Review championship assignment contracts. Accepting confirms terms, while admin lock still creates the
                official participant pair.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                <dt className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">Pending</dt>
                <dd className="mt-1 text-2xl font-black text-slate-950">{pendingCount}</dd>
              </div>
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#006d5b]">Accepted</dt>
                <dd className="mt-1 text-2xl font-black text-slate-950">{acceptedCount}</dd>
              </div>
            </dl>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
            <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white" />
            <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <FileText className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black text-slate-950">No assignment contracts yet</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
              Contracts appear after a horse owner selects you from an approved championship jockey pool.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
            <section aria-labelledby="contract-list-title" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h2 id="contract-list-title" className="text-lg font-black text-slate-950">
                    Contract Inbox
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">Review championship assignment contracts.</p>
                </div>
                <FileText className="h-5 w-5 text-[#006d5b]" aria-hidden="true" />
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <div aria-label="Contract filters" className="grid grid-cols-3 rounded-md border border-slate-200 bg-slate-50 p-1" role="tablist">
                  {FILTERS.map((filter) => {
                    const count =
                      filter.value === "PENDING" ? pendingCount : filter.value === "ACCEPTED" ? acceptedCount : rejectedCount;
                    const isActive = activeFilter === filter.value;

                    return (
                      <button
                        aria-selected={isActive}
                        className={[
                          "min-h-10 rounded-md px-3 text-xs font-black uppercase tracking-[0.08em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]",
                          isActive ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950",
                        ].join(" ")}
                        key={filter.value}
                        onClick={() => handleFilterChange(filter.value)}
                        role="tab"
                        type="button"
                      >
                        {filter.label} {count}
                      </button>
                    );
                  })}
                </div>

                <label className="relative block">
                  <span className="sr-only">Search contracts</span>
                  <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <input
                    className="min-h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search owner, horse, championship..."
                    type="search"
                    value={searchQuery}
                  />
                </label>
              </div>

              <ul aria-label="Contract list" className="mt-4 space-y-3">
                {filteredContracts.map((contract) => {
                  const isSelected = selectedContract?.id === contract.id;
                  const isUnread = contract.status === "PENDING" && !contract.readAt && !readContractIds.has(contract.id);
                  return (
                    <li key={contract.id}>
                      <button
                        aria-current={isSelected ? "true" : undefined}
                        className={[
                          "relative w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:border-[#006d5b]/40 hover:bg-emerald-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]",
                          isSelected ? "border-[#006d5b] bg-emerald-50/70 shadow-sm" : "border-slate-200 bg-white",
                        ].join(" ")}
                        onClick={() => selectContract(contract)}
                        type="button"
                      >
                        {isUnread && (
                          <span className="absolute left-2 top-5 h-2.5 w-2.5 rounded-full bg-red-600">
                            <span className="sr-only">Unread contract</span>
                          </span>
                        )}
                        <span className="flex items-start gap-3 pl-1">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#006d5b]/20 bg-white text-sm font-black text-[#006d5b]">
                            {contractInitials(contract.ownerName)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={[
                                "inline-flex rounded-md border px-2 py-1 text-xs font-black uppercase tracking-[0.12em]",
                                statusClasses(contract.status),
                              ].join(" ")}
                            >
                              {statusLabel(contract.status)}
                            </span>
                            <span className={["mt-2 block text-base text-slate-950", isUnread ? "font-black" : "font-extrabold"].join(" ")}>
                              Contract from {contract.ownerName}
                            </span>
                            <span className="mt-1 block text-sm font-bold text-slate-500">
                              {contract.horseName} - {contract.championshipName}
                            </span>
                            <span className="mt-2 block text-xs font-bold text-slate-400">{activityLabel(contract)}</span>
                          </span>
                          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {filteredContracts.length === 0 && (
                <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500" role="status">
                  No contracts match this inbox view.
                </p>
              )}
            </section>

            {selectedContract && (
              <section
                aria-label="Contract Detail"
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-28 xl:self-start"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#006d5b]/20 bg-emerald-50 text-lg font-black text-[#006d5b]">
                      {contractInitials(selectedContract.ownerName)}
                    </span>
                    <div>
                      <span
                        className={[
                          "inline-flex rounded-md border px-2 py-1 text-xs font-black uppercase tracking-[0.12em]",
                          statusClasses(selectedContract.status),
                        ].join(" ")}
                      >
                        {statusLabel(selectedContract.status)}
                      </span>
                      <h2 className="mt-3 text-2xl font-black text-slate-950">Contract Detail</h2>
                      <p className="mt-1 text-sm font-bold text-slate-500">{selectedContract.ownerName}</p>
                    </div>
                  </div>
                  <FileText className="h-6 w-6 text-[#006d5b]" aria-hidden="true" />
                </div>

                <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                  <DetailItem label="Horse" value={selectedContract.horseName} />
                  <DetailItem label="Championship" value={selectedContract.championshipName} />
                  <DetailItem label="Received" value={formatDateTime(selectedContract.createdAt)} />
                  <DetailItem label="Status" value={statusLabel(selectedContract.status)} />
                </dl>

                <section className="mt-4 rounded-md border border-slate-200 bg-white p-4" aria-label="Owner message">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Owner Message</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                    {selectedContract.message || "No owner message was included."}
                  </p>
                </section>

                <section className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4" aria-label="Assignment terms">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Assignment Terms</p>
                  <ul className="mt-3 space-y-2 text-sm font-bold text-slate-700">
                    {[
                      "Assignment applies to the whole championship, not a single race.",
                      "Accepted contract waits for admin participant lock.",
                      "Official participant pair is created only after admin lock.",
                    ].map((term) => (
                      <li className="flex gap-2" key={term}>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#006d5b]" aria-hidden="true" />
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-label="Assignment agreement">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#006d5b]">
                        <FileText className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-black text-slate-950">Assignment Agreement</p>
                        <p className="mt-1 text-sm font-black text-slate-700">{defaultAgreementName(selectedContract)}</p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                          Uploaded by {selectedContract.ownerName}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {selectedContract.agreementUrl ? "Linked PDF document" : "No agreement URL attached"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#006d5b] px-4 text-sm font-black text-white hover:bg-[#004d3d] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                        disabled={!selectedContract.agreementUrl}
                        onClick={() => setPreviewContractId(selectedContract.id)}
                        type="button"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Preview PDF
                      </button>
                      <a
                        className={[
                          "inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]",
                          !selectedContract.agreementUrl ? "pointer-events-none opacity-50" : "",
                        ].join(" ")}
                        href={selectedContract.agreementUrl || "#"}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Download
                      </a>
                    </div>
                  </div>

                  {previewContractId === selectedContract.id && (
                    <div
                      aria-label="PDF Preview"
                      className="mt-4 rounded-md border border-slate-300 bg-white p-4 shadow-inner"
                      role="region"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]">Assignment Agreement Preview</p>
                      <p className="mt-3 text-xl font-black text-slate-950">{selectedContract.championshipName}</p>
                      <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                        The attached document opens in a new browser tab. This inline preview summarizes the contract context
                        before you accept or reject.
                      </p>
                    </div>
                  )}
                </section>

                {selectedContract.status === "REJECTED" && selectedContract.rejectionReason && (
                  <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
                    Reason: {selectedContract.rejectionReason}
                  </p>
                )}

                {actionError && (
                  <p className="mt-4 flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black leading-6 text-amber-900" role="alert">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{actionError}</span>
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                    disabled={selectedContract.status !== "PENDING" || actionLoading}
                    onClick={() => handleAccept(selectedContract)}
                    type="button"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                    Accept Contract
                  </button>
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-red-200 bg-white px-5 text-sm font-black text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                    disabled={selectedContract.status !== "PENDING" || actionLoading}
                    onClick={() => {
                      setRejectTarget(selectedContract);
                      setRejectReason("");
                      setActionError("");
                    }}
                    type="button"
                  >
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    Reject
                  </button>
                </div>
              </section>
            )}
          </div>
        )}

        {rejectTarget && (
          <div
            aria-label="Reject contract"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 sm:items-center"
            role="dialog"
          >
            <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-red-700">Reject Contract</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">{rejectTarget.horseName}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">{rejectTarget.championshipName}</p>
                </div>
                <button
                  aria-label="Close reject contract"
                  className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                  onClick={() => setRejectTarget(null)}
                  type="button"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="p-5">
                <label className="block">
                  <span className="text-sm font-black text-slate-800">Rejection reason</span>
                  <textarea
                    className="mt-2 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Explain why you cannot accept this assignment."
                    value={rejectReason}
                  />
                </label>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5">
                <button
                  className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-100"
                  onClick={() => setRejectTarget(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-red-700 px-5 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  disabled={!rejectReason.trim() || actionLoading}
                  onClick={handleReject}
                  type="button"
                >
                  {actionLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  Reject Contract
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </JockeyLayout>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <dt className="font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 font-black text-slate-950">{value}</dd>
    </div>
  );
}
