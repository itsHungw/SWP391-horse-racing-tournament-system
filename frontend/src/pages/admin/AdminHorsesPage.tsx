import { useCallback, useEffect, useState } from "react";
import { resolveFileUrl } from "../../utils/fileUrl";
import { X, Check, Eye, Inbox, FileText, Search } from "lucide-react";

import { approveAdminHorse, getAdminHorses, rejectAdminHorse } from "../../api/racingApi";
import { AuthenticatedFileLink } from "../../components/AuthenticatedFileLink";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { AdminLayout } from "../../layouts/AdminLayout";
import type { Horse, HorseStatus } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

function HorseDetailsModal({ horse, onClose }: { horse: Horse; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="text-xl font-black text-slate-950">Horse Details: {horse.name}</h2>
          <button
            aria-label="Close modal"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              {horse.imageUrl ? (
                <img
                  alt={horse.name}
                  className="h-48 w-full rounded-lg border border-slate-200 object-cover shadow-sm"
                  src={resolveFileUrl(horse.imageUrl)}
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-400">
                  No Image Available
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Basic Info</p>
                <div className="mt-2 grid grid-cols-2 gap-y-2 text-sm">
                  <span className="font-semibold text-slate-600">Gender:</span>
                  <span className="font-bold text-slate-950">{horse.gender}</span>
                  <span className="font-semibold text-slate-600">Breed:</span>
                  <span className="font-bold text-slate-950">{horse.breed || "N/A"}</span>
                  <span className="font-semibold text-slate-600">Color:</span>
                  <span className="font-bold text-slate-950">{horse.color || "N/A"}</span>
                  <span className="font-semibold text-slate-600">D.O.B:</span>
                  <span className="font-bold text-slate-950">{horse.dateOfBirth || "N/A"}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Physical</p>
                <div className="mt-2 grid grid-cols-2 gap-y-2 text-sm">
                  <span className="font-semibold text-slate-600">Height:</span>
                  <span className="font-bold text-slate-950">{horse.heightCm ? `${horse.heightCm} cm` : "N/A"}</span>
                  <span className="font-semibold text-slate-600">Weight:</span>
                  <span className="font-bold text-slate-950">{horse.weightKg ? `${horse.weightKg} kg` : "N/A"}</span>
                  <span className="font-semibold text-slate-600">Health:</span>
                  <span className="font-bold text-slate-950">{horse.healthStatus || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
          {(horse.description || horse.medicalNote) && (
            <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
              {horse.description && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Description</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{horse.description}</p>
                </div>
              )}
              {horse.medicalNote && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Medical Note</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{horse.medicalNote}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const statusOptions: Array<"ALL" | HorseStatus> = ["PENDING", "APPROVED", "REJECTED", "ALL"];

export function AdminHorsesPage() {
  useDocumentTitle("Admin horse approvals");

  const [horses, setHorses] = useState<Horse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | HorseStatus>("ALL");
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const loadHorses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminHorses(status === "ALL" ? undefined : status);
      setHorses(Array.isArray(data) ? data : []);
    } catch (error) {
      setHorses([]);
      showToast(getApiErrorMessage(error, "Could not load horse approvals."), "error");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void loadHorses();
  }, [loadHorses]);

  const handleApprove = async (horse: Horse) => {
    setProcessingId(horse.id);
    try {
      await approveAdminHorse(horse.id);
      showToast(`${horse.name} approved.`);
      setHorses((prev) =>
        prev.map((h) => (h.id === horse.id ? { ...h, status: "APPROVED", rejectionReason: undefined } : h))
      );
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not approve this horse."), "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (horse: Horse) => {
    const reason = rejectReasons[horse.id]?.trim();
    if (!reason) {
      showToast("Enter a rejection reason before rejecting.", "error");
      return;
    }
    setProcessingId(horse.id);
    try {
      await rejectAdminHorse(horse.id, reason);
      showToast(`${horse.name} rejected.`);
      setHorses((prev) =>
        prev.map((h) => (h.id === horse.id ? { ...h, status: "REJECTED", rejectionReason: reason } : h))
      );
      setRejectReasons((current) => ({ ...current, [horse.id]: "" }));
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not reject this horse."), "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredHorses = horses
    .filter(
      (horse) =>
        horse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (horse.ownerName && horse.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (horse.registrationCode && horse.registrationCode.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      // PENDING at the top
      if (a.status === "PENDING" && b.status !== "PENDING") return -1;
      if (a.status !== "PENDING" && b.status === "PENDING") return 1;
      // Then descending by ID (newest first)
      return b.id - a.id;
    });

  return (
    <AdminLayout>
      <section aria-labelledby="admin-horses-title" className="relative space-y-6">
        {toast && (
          <div
            className="fixed right-4 top-4 z-50 flex items-center rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg"
            role="status"
          >
            <span
              className={`mr-2 h-2.5 w-2.5 rounded-full ${
                toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <p className="text-sm font-bold text-slate-800">{toast.text}</p>
          </div>
        )}

        {/* Title Header Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b3193a]">
            Stable review queue
          </p>
          <h1 id="admin-horses-title" className="mt-2 text-3xl font-black tracking-tight text-[#070f4f]">
            Horse Approvals
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Review owner-submitted horse profiles, evidence files, and approval status before tournament entry.
          </p>
        </div>

        {/* Operations Filter Bar */}
        <div className="grid gap-4 md:grid-cols-[1fr_245px] bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          {/* Search box */}
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Find horse or owner by name, code, etc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10"
            />
          </div>

          {/* Status Select */}
          <div>
            <select
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10"
              onChange={(event) => setStatus(event.target.value as "ALL" | HorseStatus)}
              value={status}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All Statuses" : option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#b3193a]"></div>
              <p className="mt-4 text-sm font-bold">Loading horse approvals...</p>
            </div>
          ) : filteredHorses.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-500">
              <Inbox className="mb-3 h-10 w-10 text-slate-300" strokeWidth={1.5} />
              <p className="text-base font-bold text-slate-700">No horses found</p>
              <p className="mt-1 text-sm text-slate-500">
                {searchQuery ? "No horses match your search query." : "There are no horses matching the current filter."}
              </p>
            </div>
          ) : (
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold font-sans">
                <tr>
                  <th className="px-5 py-3">Horse</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Evidence</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {filteredHorses.map((horse) => {
                  const isPending = horse.status === "PENDING";
                  return (
                    <tr className="hover:bg-[#fafafa]" key={horse.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {horse.imageUrl && (
                            <img
                              alt=""
                              className="h-12 w-12 rounded-md border border-slate-200 object-cover"
                              src={resolveFileUrl(horse.imageUrl)}
                            />
                          )}
                          <div>
                            <p className="font-black text-[#171717]">{horse.name}</p>
                            <p className="text-xs text-slate-500">
                              {horse.gender} {horse.registrationCode ? `- ${horse.registrationCode}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">{horse.ownerName || "Unknown owner"}</td>
                      <td className="px-5 py-4">
                        {horse.evidenceUrl ? (
                          <AuthenticatedFileLink
                            className="inline-flex items-center gap-1.5 text-sm font-black text-[#b3193a] transition-colors hover:text-[#8a132c]"
                            href={horse.evidenceUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <FileText className="h-4 w-4" />
                            Evidence
                          </AuthenticatedFileLink>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400">
                            <FileText className="h-4 w-4 opacity-50" />
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-black uppercase tracking-wider ${
                            horse.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : horse.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : horse.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {horse.status}
                        </span>
                        {horse.rejectionReason && (
                          <div className="mt-2 max-w-xs rounded-md bg-rose-50 p-2 text-xs font-medium text-rose-700 border border-rose-100">
                            <span className="font-bold">Reason:</span> {horse.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-[320px] flex-col gap-3">
                          <div className="flex gap-2">
                            <button
                              aria-label={`View details of ${horse.name}`}
                              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                              onClick={() => setSelectedHorse(horse)}
                              type="button"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Details
                            </button>
                            <button
                              aria-label={`Approve ${horse.name}`}
                              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-black text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={!isPending || processingId === horse.id}
                              onClick={() => handleApprove(horse)}
                              type="button"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approve
                            </button>
                            <button
                              aria-label={`Reject ${horse.name}`}
                              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-rose-600 px-3 text-xs font-black text-rose-600 shadow-sm transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={!isPending || processingId === horse.id}
                              onClick={() => handleReject(horse)}
                              type="button"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                          <div className="relative">
                            <label className="sr-only" htmlFor={`reject-reason-${horse.id}`}>
                              Rejection reason
                            </label>
                            <input
                              id={`reject-reason-${horse.id}`}
                              className="min-h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm transition-colors focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-60"
                              placeholder="Reason if rejecting..."
                              disabled={!isPending}
                              onChange={(event) =>
                                setRejectReasons((current) => ({ ...current, [horse.id]: event.target.value }))
                              }
                              value={rejectReasons[horse.id] || ""}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {selectedHorse && (
        <HorseDetailsModal horse={selectedHorse} onClose={() => setSelectedHorse(null)} />
      )}
    </AdminLayout>
  );
}
