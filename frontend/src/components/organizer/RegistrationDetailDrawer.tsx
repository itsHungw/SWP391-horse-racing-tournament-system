import { useState, type ReactNode } from "react";
import { Calendar, Check, FileText, Mail, MessageSquare, UserRound, XCircle } from "lucide-react";

import type { JockeyPoolApplication, TournamentRegistration } from "../../types/racing";
import { Drawer, StatusPill } from "../office";

export type RegistrationDetail =
  | { kind: "horses"; data: TournamentRegistration }
  | { kind: "jockeys"; data: JockeyPoolApplication };

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-office-sand text-office-gilt">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-office-faint">{label}</p>
        <div className="mt-0.5 break-words text-sm font-semibold leading-relaxed text-office-ink-soft">{children}</div>
      </div>
    </div>
  );
}

/**
 * Detail drawer for a tournament registration — horse entry (papers, owner note, timeline) or
 * jockey pool application (message, email). Approve/Reject live inside the drawer. Built on the
 * shared <Drawer> + <StatusPill> primitives.
 */
export function RegistrationDetailDrawer({
  entry,
  busy,
  onClose,
  onApprove,
  onReject,
}: {
  entry: RegistrationDetail;
  busy: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  // null = not rejecting; string = reason being typed in the inline reject panel.
  const [reason, setReason] = useState<string | null>(null);

  const isHorse = entry.kind === "horses";
  const status = entry.data.status;
  const pending = status === "PENDING";
  const name = entry.kind === "horses" ? entry.data.horseName : entry.data.jockeyName;
  const imageUrl = entry.kind === "horses" ? entry.data.horseImageUrl : entry.data.jockeyAvatarUrl;

  const visual = imageUrl ? (
    <img src={imageUrl} alt="" className={`h-14 w-14 shrink-0 object-cover ${isHorse ? "rounded-lg" : "rounded-full"}`} />
  ) : (
    <span
      className={`flex h-14 w-14 shrink-0 items-center justify-center bg-office-brass text-lg font-black text-office-charcoal ${
        isHorse ? "rounded-lg" : "rounded-full"
      }`}
    >
      {name?.[0] ?? "?"}
    </span>
  );

  const footer =
    pending && reason !== null ? (
      <>
        <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-office-muted-soft">
          Reason (sent to the applicant)
          <textarea
            autoFocus
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Roster is full for this division."
            className="mt-2 block w-full rounded-lg border border-office-line-strong bg-white px-3 py-2 text-sm font-medium text-office-ink-soft outline-none focus:border-office-brass"
          />
        </label>
        <div className="mt-3 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setReason(null)}
            className="min-h-10 rounded-lg border border-office-line-strong bg-white px-4 text-sm font-black text-office-ink-soft transition hover:bg-office-sand"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || reason.trim().length === 0}
            onClick={() => onReject(reason.trim())}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" /> {busy ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </>
    ) : (
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="min-h-10 rounded-lg border border-office-line-strong bg-white px-4 text-sm font-black text-office-ink-soft transition hover:bg-office-sand"
        >
          Close
        </button>
        {pending && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => setReason("")}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-black uppercase tracking-wide text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" /> Reject
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onApprove}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-office-go px-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-office-go-bright disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> {busy ? "Approving…" : "Approve"}
            </button>
          </>
        )}
      </div>
    );

  return (
    <Drawer
      onClose={onClose}
      busy={busy}
      labelledById="reg-detail-title"
      eyebrow={isHorse ? "Horse entry" : "Jockey application"}
      title={name}
      visual={visual}
      headerMeta={<StatusPill status={status} />}
      footer={footer}
    >
      <div className="space-y-5">
        {entry.kind === "horses" ? (
          <>
            <Row icon={UserRound} label="Owner">{entry.data.ownerName ?? "—"}</Row>
            {entry.data.note && <Row icon={MessageSquare} label="Owner note">{entry.data.note}</Row>}
            <Row icon={FileText} label="Horse papers">
              {entry.data.horseEvidenceUrl ? (
                <a
                  href={entry.data.horseEvidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-office-gilt underline underline-offset-2 hover:text-office-brass"
                >
                  View submitted document
                </a>
              ) : (
                "—"
              )}
            </Row>
          </>
        ) : (
          <>
            <Row icon={Mail} label="Email">{entry.data.jockeyEmail ?? "—"}</Row>
            {entry.data.message && <Row icon={MessageSquare} label="Application message">{entry.data.message}</Row>}
          </>
        )}
        <Row icon={Calendar} label="Submitted">{formatDateTime(entry.data.createdAt)}</Row>
        {entry.data.reviewedAt && <Row icon={Check} label="Reviewed">{formatDateTime(entry.data.reviewedAt)}</Row>}
        {status === "REJECTED" && entry.data.rejectionReason && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span className="font-black">Rejected:</span> {entry.data.rejectionReason}
          </div>
        )}
      </div>
    </Drawer>
  );
}
