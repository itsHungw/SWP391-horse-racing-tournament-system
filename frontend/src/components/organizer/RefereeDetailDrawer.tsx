import { useState, type ReactNode } from "react";
import { Award, BadgeCheck, Mail, ShieldCheck, UserPlus, XCircle } from "lucide-react";

import type { RefereeContract, RefereeDirectoryEntry } from "../../types/racing";
import { Drawer, StatusPill } from "../office";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function Row({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-office-sand text-office-gilt">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-office-faint">{label}</p>
        <div className="mt-0.5 break-words text-sm font-semibold text-office-ink-soft">{children}</div>
      </div>
    </div>
  );
}

/**
 * Detail drawer for a licensed referee — profile (licence, experience, certification) plus their
 * contract status for the selected tournament. Invite / Terminate live inside (terminate behind
 * an inline confirm). Built on the shared <Drawer> + <StatusPill> primitives.
 */
export function RefereeDetailDrawer({
  referee,
  contract,
  busy,
  canInvite,
  onClose,
  onInvite,
  onTerminate,
}: {
  referee: RefereeDirectoryEntry;
  contract: RefereeContract | null;
  busy: boolean;
  canInvite: boolean;
  onClose: () => void;
  onInvite: () => void;
  onTerminate: () => void;
}) {
  const [confirmTerminate, setConfirmTerminate] = useState(false);

  const engaged = contract != null && (contract.status === "PENDING" || contract.status === "ACTIVE");
  const meta = [
    referee.licenseNumber && `Lic. ${referee.licenseNumber}`,
    referee.experienceYears != null && `${referee.experienceYears} yrs`,
  ]
    .filter(Boolean)
    .join(" · ");

  const footer = confirmTerminate ? (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <span className="mr-auto text-sm font-bold text-[#9a3412]">Terminate this contract?</span>
      <button
        type="button"
        onClick={() => setConfirmTerminate(false)}
        className="min-h-10 rounded-lg border border-office-line-strong bg-white px-4 text-sm font-black text-office-ink-soft transition hover:bg-office-sand"
      >
        Keep
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onTerminate}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-rose-700 disabled:opacity-50"
      >
        <XCircle className="h-4 w-4" /> {busy ? "Terminating…" : "Terminate"}
      </button>
    </div>
  ) : (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="min-h-10 rounded-lg border border-office-line-strong bg-white px-4 text-sm font-black text-office-ink-soft transition hover:bg-office-sand"
      >
        Close
      </button>
      {contract?.status === "ACTIVE" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmTerminate(true)}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-black uppercase tracking-wide text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" /> Terminate
        </button>
      ) : contract?.status === "PENDING" ? (
        <span className="inline-flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-amber-700">
          Invitation pending
        </span>
      ) : engaged ? null : (
        <button
          type="button"
          disabled={busy || !canInvite}
          onClick={onInvite}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-office-brass px-4 text-sm font-black uppercase tracking-wide text-office-charcoal transition hover:bg-office-brass-bright disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" /> {busy ? "Inviting…" : "Invite to championship"}
        </button>
      )}
    </div>
  );

  return (
    <Drawer
      onClose={onClose}
      busy={busy}
      labelledById="ref-detail-title"
      eyebrow="Licensed referee"
      title={referee.fullName}
      visual={
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-office-brass text-lg font-black uppercase text-office-charcoal">
          {initials(referee.fullName)}
        </span>
      }
      headerMeta={meta ? <span className="text-xs text-white/55">{meta}</span> : undefined}
      footer={footer}
    >
      <div className="space-y-5">
        <Row icon={Mail} label="Email">{referee.email || "—"}</Row>
        <Row icon={ShieldCheck} label="Licence number">{referee.licenseNumber || "—"}</Row>
        <Row icon={Award} label="Experience">
          {referee.experienceYears != null ? `${referee.experienceYears} years` : "—"}
        </Row>
        <Row icon={BadgeCheck} label="Certification">{referee.certification || "—"}</Row>

        <div className="rounded-xl border border-office-line bg-office-bg-soft px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-office-faint">Contract · this championship</p>
            {contract ? (
              <StatusPill status={contract.status} />
            ) : (
              <StatusPill status="NOT_ENGAGED" tone="neutral" label="Not engaged" />
            )}
          </div>
          {contract && (
            <p className="mt-2 text-xs text-office-muted">
              Invited {formatDate(contract.createdAt)}
              {contract.respondedAt ? ` · responded ${formatDate(contract.respondedAt)}` : ""}
              {contract.terminatedAt ? ` · terminated ${formatDate(contract.terminatedAt)}` : ""}
            </p>
          )}
        </div>
      </div>
    </Drawer>
  );
}
