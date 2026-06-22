import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";

import {
  getMyOrganizerTournaments,
  lockOrganizerParticipants,
  submitTournamentForApproval,
  updateOrganizerTournamentStatus,
} from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Tournament } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

// Lifecycle steps the organizer drives directly (after admin approval).
const LIFECYCLE: Record<string, { label: string; target: string }> = {
  APPROVED: { label: "Open registration", target: "OPEN_REGISTRATION" },
  OPEN_REGISTRATION: { label: "Close registration", target: "CLOSED_REGISTRATION" },
  CLOSED_REGISTRATION: { label: "Lock participants", target: "PARTICIPANTS_LOCKED" },
  PARTICIPANTS_LOCKED: { label: "Publish schedule", target: "SCHEDULE_PUBLISHED" },
  SCHEDULE_PUBLISHED: { label: "Start championship", target: "ONGOING" },
  ONGOING: { label: "Mark completed", target: "COMPLETED" },
};

const statusBadge: Record<string, string> = {
  DRAFT: "bg-[#efe9dd] text-[#6f665b]",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  OPEN_REGISTRATION: "bg-emerald-100 text-emerald-800",
  CLOSED_REGISTRATION: "bg-amber-100 text-amber-800",
  PARTICIPANTS_LOCKED: "bg-amber-100 text-amber-800",
  SCHEDULE_PUBLISHED: "bg-sky-100 text-sky-800",
  ONGOING: "bg-[#1c1816] text-[#cfa24f]",
  COMPLETED: "bg-[#efe9dd] text-[#6f665b]",
  POSTPONED: "bg-rose-100 text-rose-700",
};

function formatDate(value?: string) {
  if (!value) return "TBD";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "TBD" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function OrganizerTournamentsPage() {
  useDocumentTitle("My Tournaments | Organizer");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const visible = query
    ? tournaments.filter((t) => `${t.name} ${t.code} ${t.location ?? ""}`.toLowerCase().includes(query))
    : tournaments;

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyOrganizerTournaments();
      setTournaments(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load your tournaments."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runStatus = async (id: number, action: () => Promise<unknown>) => {
    setProcessingId(id);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Action failed."));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a8801f]">Workspace</p>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight text-[#211d1a] md:text-4xl">My Tournaments</h1>
        </div>
        <Link
          to="/organizer/tournaments/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1c1816] px-5 text-xs font-black uppercase tracking-[0.14em] text-[#f7f4ee] transition hover:bg-[#2a241f]"
        >
          <Plus className="h-4 w-4" /> Create
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700" role="alert">
          {error}
        </div>
      )}

      {query && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e7e0d3] bg-[#fbf8f1] px-4 py-2.5 text-sm">
          <span className="text-[#6f665b]">
            Showing tournaments matching <span className="font-black text-[#211d1a]">“{searchParams.get("q")}”</span>
          </span>
          <Link to="/organizer/tournaments" className="ml-auto text-xs font-black uppercase tracking-wide text-[#8a6a1c] transition hover:text-[#bb8a3c]">
            Clear
          </Link>
        </div>
      )}

      {loading ? (
        <div className="h-56 animate-pulse rounded-xl border border-[#e7e0d3] bg-white" />
      ) : tournaments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d8cfbd] bg-white/60 px-8 py-16 text-center">
          <p className="font-display text-2xl font-light text-[#211d1a]">No tournaments yet</p>
          <p className="mt-2 text-sm text-[#6f665b]">Create your first championship to get started.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d8cfbd] bg-white/60 px-8 py-16 text-center">
          <p className="font-display text-2xl font-light text-[#211d1a]">No matches</p>
          <p className="mt-2 text-sm text-[#6f665b]">No tournaments match “{searchParams.get("q")}”.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((t) => {
            const next = LIFECYCLE[t.status];
            const busy = processingId === t.id;
            return (
              <article key={t.id} className="rounded-xl border border-[#e7e0d3] bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl font-light tracking-tight text-[#211d1a]">{t.name}</h2>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${statusBadge[t.status] ?? "bg-[#efe9dd] text-[#6f665b]"}`}>
                        {t.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[#8a8276]">
                      {t.code} · {t.location ?? "—"} · {formatDate(t.startDate)} – {formatDate(t.endDate)}
                    </p>
                    {t.status === "PENDING_APPROVAL" && (
                      <p className="mt-3 text-sm font-semibold text-amber-700">Awaiting admin approval (Gate 2).</p>
                    )}
                    {t.status === "DRAFT" && t.rejectionReason && (
                      <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                        <span className="font-black">Rejected:</span> {t.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    {t.status === "DRAFT" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => runStatus(t.id, () => submitTournamentForApproval(t.id))}
                        className="min-h-10 rounded-lg bg-[#bb8a3c] px-5 text-xs font-black uppercase tracking-[0.12em] text-[#1c1816] transition hover:bg-[#cfa24f] disabled:opacity-40"
                      >
                        Submit for approval
                      </button>
                    )}
                    {next && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          runStatus(t.id, () =>
                            // BR-09: "Lock participants" must materialise horse+jockey contracts into
                            // official participants (not just flip the status flag), else schedule
                            // publication later fails for lack of participants.
                            t.status === "CLOSED_REGISTRATION"
                              ? lockOrganizerParticipants(t.id)
                              : updateOrganizerTournamentStatus(t.id, next.target),
                          )
                        }
                        className="min-h-10 rounded-lg bg-[#bb8a3c] px-5 text-xs font-black uppercase tracking-[0.12em] text-[#1c1816] transition hover:bg-[#cfa24f] disabled:opacity-40"
                      >
                        {next.label}
                      </button>
                    )}
                    <Link
                      to={`/championships/${t.id}`}
                      className="min-h-10 rounded-lg border border-[#e2d9c8] px-5 text-center text-xs font-black uppercase tracking-[0.12em] leading-10 text-[#6f665b] transition hover:border-[#bb8a3c] hover:text-[#211d1a]"
                    >
                      View public page
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
