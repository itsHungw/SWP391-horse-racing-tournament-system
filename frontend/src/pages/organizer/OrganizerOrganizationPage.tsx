import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, CalendarDays, FileCheck2, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";

import { getMyOrganization } from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Organization } from "../../types/racing";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "OR";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" });
}

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  SUSPENDED: "bg-rose-100 text-rose-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const STATUS_NOTE: Record<string, string> = {
  PENDING: "Your application is under platform review (Gate 1). You’ll receive ORGANIZER access once approved.",
  ACTIVE: "Approved and licensed to host championships on the platform.",
  SUSPENDED: "Operations are paused by the platform. Draft and pending tournaments are locked until reinstated.",
  REJECTED: "This application was rejected. Update your details and resubmit.",
};

function Field({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3ead6] text-[#8a6a1c]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a99f8c]">{label}</p>
        <p className="mt-0.5 break-words text-sm font-bold text-[#3a342d]">{value}</p>
      </div>
    </div>
  );
}

export function OrganizerOrganizationPage() {
  useDocumentTitle("Organization | Organizer");

  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let active = true;
    getMyOrganization()
      .then((data) => active && setOrg(data))
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const showLogo = Boolean(org?.logoUrl) && !imgError;

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a8801f]">Workspace · Account</p>
        <h1 className="mt-2 font-display text-3xl font-light tracking-tight text-[#211d1a] md:text-4xl">Organization</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6f665b]">
          The licensed entity you operate under. Every tournament you host is published in this organization’s name.
        </p>
      </div>

      {loading ? (
        <div className="h-72 animate-pulse rounded-xl border border-[#e7e0d3] bg-white" />
      ) : !org ? (
        <div className="rounded-xl border border-dashed border-[#d8cfbd] bg-white/60 px-8 py-16 text-center">
          <p className="font-display text-2xl font-light text-[#211d1a]">No organization yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#6f665b]">
            Register your organization and pass the KYB review to start hosting championships.
          </p>
          <Link
            to="/organizer/register"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#bb8a3c] px-5 text-sm font-black uppercase tracking-wide text-[#1c1816] transition hover:bg-[#cfa24f]"
          >
            Register organization <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Identity ─────────────────────────────────── */}
          <section className="overflow-hidden rounded-xl border border-[#e7e0d3] bg-[#1c1816] text-[#efe9df]">
            <div className="flex flex-wrap items-center gap-5 px-6 py-7 sm:px-8">
              <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#bb8a3c] font-display text-2xl font-semibold text-[#1c1816]">
                {showLogo ? (
                  <img src={org.logoUrl} alt={org.name} className="h-full w-full object-cover" onError={() => setImgError(true)} />
                ) : (
                  getInitials(org.name)
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#cfa24f]">Race office</p>
                <h2 className="mt-1 truncate font-display text-2xl font-light text-white">{org.name}</h2>
                <p className="mt-1 font-mono text-xs uppercase tracking-wide text-white/45">{org.code}</p>
              </div>
              <span className={`ml-auto rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${STATUS_TONE[org.status] ?? "bg-white/10 text-white/70"}`}>
                {org.status}
              </span>
            </div>
            <div className="border-t border-white/10 px-6 py-4 text-sm text-white/70 sm:px-8">{STATUS_NOTE[org.status]}</div>
          </section>

          {/* Details ──────────────────────────────────── */}
          <section className="overflow-hidden rounded-xl border border-[#e7e0d3] bg-white">
            <div className="border-b border-[#efe9dd] px-6 py-5 sm:px-8">
              <h2 className="font-display text-xl font-light tracking-tight text-[#211d1a]">Details</h2>
            </div>
            <div className="px-6 py-6 sm:px-8">
              {org.description && <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[#6f665b]">{org.description}</p>}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field icon={ShieldCheck} label="License number" value={org.licenseNumber || "—"} />
                <Field icon={FileCheck2} label="KYB document" value={org.evidenceUrl ? "On file · verified" : "—"} />
                <Field icon={Mail} label="Contact email" value={org.contactEmail || "—"} />
                <Field icon={Phone} label="Contact phone" value={org.contactPhone || "—"} />
                <Field icon={UserRound} label="Owner" value={org.ownerName || "—"} />
                <Field icon={CalendarDays} label="On platform since" value={formatDate(org.approvedAt || org.createdAt)} />
              </div>

              {org.status === "REJECTED" && org.rejectionReason && (
                <div className="mt-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <p className="text-sm text-rose-700">
                    <span className="font-black">Rejected:</span> {org.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            {org.status === "REJECTED" && (
              <div className="flex justify-end border-t border-[#efe9dd] bg-[#faf7f0] px-6 py-4 sm:px-8">
                <Link
                  to="/organizer/register"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#bb8a3c] px-4 text-sm font-black uppercase tracking-wide text-[#1c1816] transition hover:bg-[#cfa24f]"
                >
                  Update & resubmit <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
