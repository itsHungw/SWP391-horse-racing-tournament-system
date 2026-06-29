import { useCallback, useEffect, useState } from "react";

import {
  approveOrganization,
  getAdminOrganizations,
  reactivateOrganization,
  rejectOrganization,
  suspendOrganization,
} from "../../api/racingApi";
import { AuthenticatedFileLink } from "../../components/AuthenticatedFileLink";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { AdminLayout } from "../../layouts/AdminLayout";
import type { Organization, OrganizationStatus } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

const statusOptions: Array<"ALL" | OrganizationStatus> = ["PENDING", "ACTIVE", "SUSPENDED", "REJECTED", "ALL"];

const statusBadge: Record<OrganizationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  SUSPENDED: "bg-rose-100 text-rose-800",
  REJECTED: "bg-slate-200 text-slate-700",
};

export function AdminOrganizationsPage() {
  useDocumentTitle("Admin organizations");

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [status, setStatus] = useState<"ALL" | OrganizationStatus>("PENDING");
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminOrganizations(status === "ALL" ? undefined : status);
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (error) {
      setOrganizations([]);
      showToast(getApiErrorMessage(error, "Could not load organizations."), "error");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (id: number, fn: () => Promise<unknown>, ok: string) => {
    setProcessingId(id);
    try {
      await fn();
      showToast(ok);
      await load();
    } catch (error) {
      showToast(getApiErrorMessage(error, "Action failed."), "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (org: Organization) => {
    const reason = rejectReasons[org.id]?.trim();
    if (!reason) {
      showToast("Enter a rejection reason first.", "error");
      return;
    }
    await runAction(org.id, () => rejectOrganization(org.id, reason), `${org.name} rejected.`);
    setRejectReasons((current) => ({ ...current, [org.id]: "" }));
  };

  return (
    <AdminLayout>
      <section aria-labelledby="admin-organizations-title" className="relative space-y-6">
        {toast && (
          <div
            className="fixed right-4 top-4 z-50 flex items-center rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg"
            role="status"
          >
            <span
              className={`mr-2 h-2.5 w-2.5 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`}
            />
            <p className="text-sm font-bold text-slate-800">{toast.text}</p>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b3193a]">Gate 1 · Organizer onboarding</p>
            <h1 id="admin-organizations-title" className="mt-2 text-3xl font-black tracking-tight text-[#070f4f]">
              Organizations
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Vet organization applications before granting tournament-hosting access. Approving grants the owner the
              ORGANIZER role; suspending locks their unfinished tournaments.
            </p>
          </div>

          <label className="w-full max-w-xs text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            Status
            <select
              className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 focus:border-[#b3193a] focus:outline-none"
              onChange={(event) => setStatus(event.target.value as "ALL" | OrganizationStatus)}
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
              Loading organizations...
            </div>
          ) : organizations.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-500">
              <p className="font-bold">No organizations match this filter.</p>
              <p className="text-sm">Organizer applications will appear here.</p>
            </div>
          ) : (
            <table className="min-w-[1040px] text-left text-sm">
              <thead className="bg-[#f7f7f7] text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Organization</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {organizations.map((org) => {
                  const busy = processingId === org.id;
                  return (
                    <tr className="align-top hover:bg-[#fafafa]" key={org.id}>
                      <td className="px-5 py-4">
                        <p className="font-black text-[#171717]">{org.name}</p>
                        <p className="text-xs text-slate-500">{org.code}</p>
                        {org.licenseNumber && (
                          <p className="mt-1 text-xs text-slate-500">License: {org.licenseNumber}</p>
                        )}
                        {org.applicationNote && (
                          <p className="mt-2 max-w-md text-xs leading-5 text-slate-600">{org.applicationNote}</p>
                        )}
                        {org.evidenceUrl && (
                          <AuthenticatedFileLink
                            className="mt-1 inline-block text-xs font-black text-[#b3193a] underline"
                            href={org.evidenceUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Credentials
                          </AuthenticatedFileLink>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-700">{org.ownerName || "Unknown"}</p>
                        {org.contactEmail && <p className="text-xs text-slate-500">{org.contactEmail}</p>}
                        {org.contactPhone && <p className="text-xs text-slate-500">{org.contactPhone}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusBadge[org.status]}`}>
                          {org.status}
                        </span>
                        {org.rejectionReason && (
                          <p className="mt-2 max-w-xs text-xs font-bold text-rose-700">{org.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-[300px] flex-col gap-2">
                          {org.status === "PENDING" && (
                            <>
                              <div className="flex gap-2">
                                <button
                                  className="min-h-11 rounded-md bg-[#a6ff3f] px-4 text-xs font-black text-[#07110d] hover:bg-[#c4ff72] disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={busy}
                                  onClick={() => runAction(org.id, () => approveOrganization(org.id), `${org.name} approved.`)}
                                  type="button"
                                >
                                  Approve
                                </button>
                                <button
                                  className="min-h-11 rounded-md border border-rose-300 px-4 text-xs font-black text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={busy}
                                  onClick={() => handleReject(org)}
                                  type="button"
                                >
                                  Reject
                                </button>
                              </div>
                              <input
                                className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-[#b3193a] focus:outline-none"
                                onChange={(event) =>
                                  setRejectReasons((current) => ({ ...current, [org.id]: event.target.value }))
                                }
                                placeholder="Rejection reason (required to reject)"
                                value={rejectReasons[org.id] ?? ""}
                              />
                            </>
                          )}
                          {org.status === "ACTIVE" && (
                            <button
                              className="min-h-11 rounded-md border border-rose-300 px-4 text-xs font-black text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={busy}
                              onClick={() => runAction(org.id, () => suspendOrganization(org.id), `${org.name} suspended.`)}
                              type="button"
                            >
                              Suspend
                            </button>
                          )}
                          {org.status === "SUSPENDED" && (
                            <button
                              className="min-h-11 rounded-md bg-[#070f4f] px-4 text-xs font-black text-white hover:bg-[#0b1670] disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={busy}
                              onClick={() => runAction(org.id, () => reactivateOrganization(org.id), `${org.name} reactivated.`)}
                              type="button"
                            >
                              Reactivate
                            </button>
                          )}
                          {org.status === "REJECTED" && (
                            <span className="text-xs font-bold text-slate-400">No action — applicant may resubmit.</span>
                          )}
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
