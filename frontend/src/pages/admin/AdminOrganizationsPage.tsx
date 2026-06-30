import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  User,
  XCircle,
} from "lucide-react";

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
  PENDING: "bg-amber-50 text-amber-800 border border-amber-200/50",
  ACTIVE: "bg-emerald-50 text-emerald-800 border border-emerald-200/50",
  SUSPENDED: "bg-rose-50 text-rose-800 border border-rose-200/50",
  REJECTED: "bg-slate-100 text-slate-700 border border-slate-200/50",
};

export function AdminOrganizationsPage() {
  useDocumentTitle("Admin organizations");

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [status, setStatus] = useState<"ALL" | OrganizationStatus>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const filteredOrganizations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return organizations;

    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(q) ||
        org.code.toLowerCase().includes(q) ||
        (org.ownerName && org.ownerName.toLowerCase().includes(q)) ||
        (org.licenseNumber && org.licenseNumber.toLowerCase().includes(q)) ||
        (org.contactEmail && org.contactEmail.toLowerCase().includes(q))
    );
  }, [organizations, searchTerm]);

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

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b3193a]">
            Gate 1 - Organizer onboarding
          </p>
          <h1 id="admin-organizations-title" className="mt-2 text-3xl font-black tracking-tight text-[#070f4f]">
            Organizations
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Vet organization applications before granting tournament-hosting access. Approving grants the owner the
            <strong className="text-slate-800"> ORGANIZER</strong> role; suspending locks their unfinished tournaments.
          </p>
        </div>

        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_245px]">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search organizations by name, code, owner, license..."
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10"
            />
          </div>

          <select
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10"
            onChange={(event) => setStatus(event.target.value as "ALL" | OrganizationStatus)}
            value={status}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All Statuses" : option === "PENDING" ? "Pending Approval" : option}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading organizations">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-8 py-16 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-400" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-black text-slate-900">No matching organizations</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              No organization applications match your search query or chosen status filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrganizations.map((org) => {
              const busy = processingId === org.id;

              return (
                <article
                  key={org.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black text-slate-900" title={org.name}>
                          {org.name}
                        </h3>
                        <p className="mt-0.5 font-mono text-xs text-slate-400">Code: {org.code}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusBadge[org.status]}`}
                      >
                        {org.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                      {org.licenseNumber && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                          <span>
                            License: <strong className="text-slate-800">{org.licenseNumber}</strong>
                          </span>
                        </div>
                      )}

                      <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{org.ownerName || "Unknown Owner"}</span>
                        </div>
                        {org.contactEmail && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <a
                              href={`mailto:${org.contactEmail}`}
                              className="truncate font-semibold text-slate-600 hover:underline"
                            >
                              {org.contactEmail}
                            </a>
                          </div>
                        )}
                        {org.contactPhone && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="font-semibold text-slate-600">{org.contactPhone}</span>
                          </div>
                        )}
                      </div>

                      {org.applicationNote && (
                        <div className="mt-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Application Note
                          </p>
                          <p className="mt-1 rounded-lg border border-amber-100/50 bg-amber-50/40 p-2.5 text-xs italic leading-relaxed text-slate-600">
                            "{org.applicationNote}"
                          </p>
                        </div>
                      )}

                      {org.status === "REJECTED" && org.rejectionReason && (
                        <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50 p-2.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-rose-800">
                            Rejection Reason
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-rose-700">{org.rejectionReason}</p>
                        </div>
                      )}

                      {org.evidenceUrl && (
                        <div className="mt-4">
                          <AuthenticatedFileLink
                            href={org.evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                          >
                            Credentials <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </AuthenticatedFileLink>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    {org.status === "PENDING" && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => runAction(org.id, () => approveOrganization(org.id), `${org.name} approved.`)}
                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Approve
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleReject(org)}
                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 text-xs font-black uppercase tracking-wider text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" aria-hidden="true" /> Reject
                          </button>
                        </div>
                        <input
                          type="text"
                          value={rejectReasons[org.id] ?? ""}
                          onChange={(event) =>
                            setRejectReasons((current) => ({ ...current, [org.id]: event.target.value }))
                          }
                          placeholder="Rejection reason (required to reject)"
                          className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                        />
                      </div>
                    )}

                    {org.status === "ACTIVE" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runAction(org.id, () => suspendOrganization(org.id), `${org.name} suspended.`)}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 text-xs font-black uppercase tracking-wider text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        <ShieldAlert className="h-4 w-4" aria-hidden="true" /> Suspend Workspace
                      </button>
                    )}

                    {org.status === "SUSPENDED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          runAction(org.id, () => reactivateOrganization(org.id), `${org.name} reactivated.`)
                        }
                        className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#070f4f] text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-[#101a70] disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Reactivate Workspace
                      </button>
                    )}

                    {org.status === "REJECTED" && (
                      <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-400">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        <span>No action - applicant may resubmit</span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
