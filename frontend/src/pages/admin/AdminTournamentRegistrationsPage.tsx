import { useCallback, useEffect, useState } from "react";
import { resolveFileUrl } from "../../utils/fileUrl";

import {
  approveAdminTournamentRegistration,
  getAdminTournamentRegistrations,
  rejectAdminTournamentRegistration,
} from "../../api/racingApi";
import { AuthenticatedFileLink } from "../../components/AuthenticatedFileLink";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { AdminLayout } from "../../layouts/AdminLayout";
import type { TournamentRegistration, TournamentRegistrationStatus } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

const statusOptions: Array<"ALL" | TournamentRegistrationStatus> = ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN", "ALL"];

export function AdminTournamentRegistrationsPage() {
  useDocumentTitle("Admin tournament registrations");

  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [status, setStatus] = useState<"ALL" | TournamentRegistrationStatus>("PENDING");
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminTournamentRegistrations(status === "ALL" ? undefined : status);
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (error) {
      setRegistrations([]);
      showToast(getApiErrorMessage(error, "Could not load tournament registrations."), "error");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  const handleApprove = async (registration: TournamentRegistration) => {
    setProcessingId(registration.id);
    try {
      await approveAdminTournamentRegistration(registration.id);
      showToast(`${registration.horseName} approved for ${registration.tournamentName}.`);
      await loadRegistrations();
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not approve this registration."), "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (registration: TournamentRegistration) => {
    const reason = rejectReasons[registration.id]?.trim();
    if (!reason) {
      showToast("Enter a rejection reason before rejecting.", "error");
      return;
    }
    setProcessingId(registration.id);
    try {
      await rejectAdminTournamentRegistration(registration.id, reason);
      showToast(`${registration.horseName} registration rejected.`);
      setRejectReasons((current) => ({ ...current, [registration.id]: "" }));
      await loadRegistrations();
    } catch (error) {
      showToast(getApiErrorMessage(error, "Could not reject this registration."), "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout>
      <section aria-labelledby="admin-registrations-title" className="relative space-y-6">
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
              Tournament entry queue
            </p>
            <h1 id="admin-registrations-title" className="mt-2 text-3xl font-black tracking-tight text-[#070f4f]">
              Tournament Registrations
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Approve owner-submitted tournament entries only after the horse profile and registration context check out.
            </p>
          </div>

          <label className="w-full max-w-xs text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Status
            <select
              className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 focus:border-[#b3193a] focus:outline-none"
              onChange={(event) => setStatus(event.target.value as "ALL" | TournamentRegistrationStatus)}
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
              Loading tournament registrations...
            </div>
          ) : registrations.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-500">
              <p className="font-bold">No registrations match this filter.</p>
              <p className="text-sm">Owner tournament submissions will appear here.</p>
            </div>
          ) : (
            <table className="min-w-[1040px] text-left text-sm">
              <thead className="bg-[#f7f7f7] text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Tournament</th>
                  <th className="px-5 py-3">Horse</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {registrations.map((registration) => {
                  const isPending = registration.status === "PENDING";
                  return (
                    <tr className="hover:bg-[#fafafa]" key={registration.id}>
                      <td className="px-5 py-4">
                        <p className="font-black text-[#171717]">{registration.tournamentName}</p>
                        <p className="text-xs text-slate-500">{registration.note || "No owner note"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {registration.horseImageUrl && (
                            <img
                              alt=""
                              className="h-12 w-12 rounded-md border border-slate-200 object-cover"
                              src={resolveFileUrl(registration.horseImageUrl)}
                            />
                          )}
                          <div>
                            <p className="font-black text-[#171717]">{registration.horseName}</p>
                            {registration.horseEvidenceUrl && (
                              <AuthenticatedFileLink
                                className="text-xs font-black text-[#b3193a] underline"
                                href={registration.horseEvidenceUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Evidence
                              </AuthenticatedFileLink>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700">{registration.ownerName || "Unknown owner"}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#f1f1f1] px-3 py-1 text-xs font-black text-slate-700">
                          {registration.status}
                        </span>
                        {registration.rejectionReason && (
                          <p className="mt-2 max-w-xs text-xs font-bold text-rose-700">{registration.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-[320px] flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              aria-label={`Approve ${registration.tournamentName} registration`}
                              className="min-h-11 rounded-md bg-[#a6ff3f] px-4 text-xs font-black text-[#07110d] hover:bg-[#c4ff72] disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={!isPending || processingId === registration.id}
                              onClick={() => handleApprove(registration)}
                              type="button"
                            >
                              Approve
                            </button>
                            <button
                              aria-label={`Reject ${registration.tournamentName} registration`}
                              className="min-h-11 rounded-md border border-[#b3193a] px-4 text-xs font-black text-[#b3193a] hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={!isPending || processingId === registration.id}
                              onClick={() => handleReject(registration)}
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
                                setRejectReasons((current) => ({ ...current, [registration.id]: event.target.value }))
                              }
                              value={rejectReasons[registration.id] || ""}
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
