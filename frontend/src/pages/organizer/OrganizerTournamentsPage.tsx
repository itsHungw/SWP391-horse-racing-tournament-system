import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getMyOrganizerTournaments,
  submitTournamentForApproval,
  updateOrganizerTournamentStatus,
} from "../../api/racingApi";
import { ClientFooter } from "../../components/client/ClientFooter";
import { ClientHeader } from "../../components/client/ClientHeader";
import { Eyebrow, GoldRule, MotionReveal } from "../../components/client/primitives";
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

const statusTone: Record<string, string> = {
  DRAFT: "text-ivory-faint",
  PENDING_APPROVAL: "text-gold-300",
  APPROVED: "text-emerald-soft",
  OPEN_REGISTRATION: "text-emerald-soft",
  CLOSED_REGISTRATION: "text-gold-300",
  PARTICIPANTS_LOCKED: "text-gold-300",
  SCHEDULE_PUBLISHED: "text-emerald-soft",
  ONGOING: "text-emerald-soft",
  COMPLETED: "text-ivory-faint",
  POSTPONED: "text-rose-300",
};

function formatDate(value?: string) {
  if (!value) return "TBD";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "TBD" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function OrganizerTournamentsPage() {
  useDocumentTitle("My Tournaments | Organizer");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

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
    <div className="client-theme min-h-screen bg-turf-950 text-ivory">
      <ClientHeader />
      <main className="mx-auto max-w-[1100px] px-6 py-16 md:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow tone="gold">Organizer workspace</Eyebrow>
            <h1 className="mt-5 font-display text-5xl font-light tracking-tight">
              My Tournaments<span className="text-foil">.</span>
            </h1>
            <GoldRule className="mt-5 w-20" />
          </div>
          <Link
            to="/organizer/tournaments/new"
            className="inline-flex min-h-12 items-center justify-center bg-gold-400 px-7 text-xs font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-gold-300"
          >
            + Create Tournament
          </Link>
        </div>

        {error && (
          <div className="mt-8 border-l-2 border-nyraRed bg-turf-900 px-5 py-4 text-sm text-rose-300" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-10 h-64 animate-pulse border border-white/10 bg-turf-900" />
        ) : tournaments.length === 0 ? (
          <div className="mt-10 border border-dashed border-white/15 bg-turf-900/50 px-8 py-16 text-center">
            <p className="eyebrow text-ivory-faint">No tournaments yet</p>
            <p className="mt-3 text-sm text-ivory-dim">Create your first championship to get started.</p>
          </div>
        ) : (
          <div className="mt-10 space-y-px border border-white/10">
            {tournaments.map((t) => {
              const next = LIFECYCLE[t.status];
              const busy = processingId === t.id;
              return (
                <MotionReveal key={t.id}>
                  <article className="bg-turf-900 p-6 md:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <h2 className="font-display text-2xl font-light tracking-tight">{t.name}</h2>
                          <span className={`eyebrow ${statusTone[t.status] ?? "text-ivory-faint"}`}>
                            {t.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="mt-1 font-data text-xs uppercase tracking-[0.14em] text-ivory-faint">
                          {t.code} · {t.location ?? "—"} · {formatDate(t.startDate)} – {formatDate(t.endDate)}
                        </p>
                        {t.status === "PENDING_APPROVAL" && (
                          <p className="mt-3 text-sm text-gold-300">Awaiting admin approval (Gate 2).</p>
                        )}
                        {t.status === "DRAFT" && t.rejectionReason && (
                          <p className="mt-3 border-l-2 border-nyraRed bg-turf-950 px-4 py-2 text-sm text-rose-300">
                            Rejected: {t.rejectionReason}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col gap-2">
                        {t.status === "DRAFT" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => runStatus(t.id, () => submitTournamentForApproval(t.id))}
                            className="min-h-10 bg-gold-400 px-5 text-xs font-bold uppercase tracking-[0.12em] text-turf-950 transition-colors hover:bg-gold-300 disabled:opacity-40"
                          >
                            Submit for approval
                          </button>
                        )}
                        {next && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => runStatus(t.id, () => updateOrganizerTournamentStatus(t.id, next.target))}
                            className="min-h-10 bg-gold-400 px-5 text-xs font-bold uppercase tracking-[0.12em] text-turf-950 transition-colors hover:bg-gold-300 disabled:opacity-40"
                          >
                            {next.label}
                          </button>
                        )}
                        <Link
                          to={`/championships/${t.id}`}
                          className="min-h-10 border border-white/15 px-5 text-center text-xs font-bold uppercase tracking-[0.12em] leading-10 text-ivory-dim transition-colors hover:border-gold-400/50 hover:text-ivory"
                        >
                          View public page
                        </Link>
                      </div>
                    </div>
                  </article>
                </MotionReveal>
              );
            })}
          </div>
        )}
      </main>
      <ClientFooter />
    </div>
  );
}
