import { useCallback, useEffect, useState } from "react";

import { approveAdminHorse, getAdminHorses, rejectAdminHorse } from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { AdminLayout } from "../../layouts/AdminLayout";
import type { Horse, HorseStatus } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

const statusOptions: Array<"ALL" | HorseStatus> = ["PENDING", "APPROVED", "REJECTED", "ALL"];

export function AdminHorsesPage() {
  useDocumentTitle("Admin horse approvals");

  const [horses, setHorses] = useState<Horse[]>([]);
  const [status, setStatus] = useState<"ALL" | HorseStatus>("PENDING");
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
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
      await loadHorses();
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
      setRejectReasons((current) => ({ ...current, [horse.id]: "" }));
      await loadHorses();
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not reject this horse."), "error");
    } finally {
      setProcessingId(null);
    }
  };

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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b3193a]">
              Stable review queue
            </p>
            <h1 id="admin-horses-title" className="mt-2 text-3xl font-black tracking-tight text-[#070f4f]">
              Horse Approvals
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review owner-submitted horse profiles, evidence files, and approval status before tournament entry.
            </p>
          </div>

          <label className="w-full max-w-xs text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Status
            <select
              className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 focus:border-[#b3193a] focus:outline-none"
              onChange={(event) => setStatus(event.target.value as "ALL" | HorseStatus)}
              value={status}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All Statuses" : option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#d8d8d8] bg-white">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm font-bold text-slate-500">
              Loading horse approvals...
            </div>
          ) : horses.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-500">
              <p className="font-bold">No horses match this filter.</p>
              <p className="text-sm">New owner submissions will appear here.</p>
            </div>
          ) : (
            <table className="min-w-[980px] text-left text-sm">
              <thead className="bg-[#f7f7f7] text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Horse</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Evidence</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {horses.map((horse) => {
                  const isPending = horse.status === "PENDING";
                  return (
                    <tr className="hover:bg-[#fafafa]" key={horse.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {horse.imageUrl && (
                            <img
                              alt=""
                              className="h-12 w-12 rounded-md border border-slate-200 object-cover"
                              src={horse.imageUrl}
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
                          <a
                            className="font-black text-[#b3193a] underline"
                            href={horse.evidenceUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Evidence
                          </a>
                        ) : (
                          <span className="text-slate-500">Missing</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#f1f1f1] px-3 py-1 text-xs font-black text-slate-700">
                          {horse.status}
                        </span>
                        {horse.rejectionReason && (
                          <p className="mt-2 max-w-xs text-xs font-bold text-rose-700">{horse.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-[300px] flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              aria-label={`Approve ${horse.name}`}
                              className="min-h-11 rounded-md bg-[#a6ff3f] px-4 text-xs font-black text-[#07110d] hover:bg-[#c4ff72] disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={!isPending || processingId === horse.id}
                              onClick={() => handleApprove(horse)}
                              type="button"
                            >
                              Approve
                            </button>
                            <button
                              aria-label={`Reject ${horse.name}`}
                              className="min-h-11 rounded-md border border-[#b3193a] px-4 text-xs font-black text-[#b3193a] hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={!isPending || processingId === horse.id}
                              onClick={() => handleReject(horse)}
                              type="button"
                            >
                              Reject
                            </button>
                          </div>
                          <label className="text-xs font-bold text-slate-600">
                            Rejection reason
                            <input
                              className="mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-[#b3193a] focus:outline-none"
                              disabled={!isPending}
                              onChange={(event) =>
                                setRejectReasons((current) => ({ ...current, [horse.id]: event.target.value }))
                              }
                              value={rejectReasons[horse.id] || ""}
                            />
                          </label>
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
    </AdminLayout>
  );
}
