import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CheckCircle2, ChevronRight, Clock, Megaphone, Trophy, Undo2, X } from "lucide-react";

import {
  confirmOrganizerRaceResults,
  getMyOrganizerTournaments,
  getOrganizerRaces,
  getOrganizerRaceResults,
  publishOrganizerRaceResults,
  reopenOrganizerRaceResults,
} from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useSelectedTournamentId } from "../../hooks/useSelectedTournamentId";
import type { PublicRaceResult, Race, Tournament } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFinishTime(seconds?: number | null) {
  if (seconds == null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds - mins * 60;
  return mins > 0 ? `${mins}:${secs.toFixed(2).padStart(5, "0")}` : `${secs.toFixed(2)}s`;
}

const AWAITING = new Set(["SCHEDULED", "CHECKING", "READY", "ONGOING", "FINISHED"]);

type StatusChip = { label: string; className: string };

function statusChip(status: string): StatusChip {
  switch (status) {
    case "RESULT_SUBMITTED":
      return { label: "Awaiting your confirmation", className: "bg-indigo-100 text-indigo-800" };
    case "RESULT_CONFIRMED":
      return { label: "Confirmed · ready to publish", className: "bg-[#f3ead6] text-[#8a6a1c]" };
    case "PUBLISHED":
      return { label: "Official", className: "bg-emerald-100 text-emerald-800" };
    case "CANCELLED":
      return { label: "Cancelled", className: "bg-rose-100 text-rose-700" };
    default:
      return {
        label: AWAITING.has(status) ? "Awaiting referee" : status.replace(/_/g, " "),
        className: "bg-[#efe9dd] text-[#8a8276]",
      };
  }
}

const POSITION_TONE: Record<number, string> = {
  1: "bg-[#bb8a3c] text-[#1c1816]",
  2: "bg-[#c9c2b2] text-[#1c1816]",
  3: "bg-[#cd8b5e] text-white",
};

export function OrganizerResultsPage() {
  useDocumentTitle("Results | Organizer");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useSelectedTournamentId();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailRace, setDetailRace] = useState<Race | null>(null);

  useEffect(() => {
    let active = true;
    getMyOrganizerTournaments()
      .then((data) => {
        if (!active) return;
        setTournaments(data);
        setSelectedId((prev) => (prev != null && data.some((t) => t.id === prev) ? prev : data[0]?.id ?? null));
      })
      .catch((err) => active && setError(getApiErrorMessage(err, "Could not load your championships.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const loadRaces = async (tournamentId: number) => {
    setLoadingRaces(true);
    try {
      const data = await getOrganizerRaces(tournamentId);
      setRaces(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load races."));
    } finally {
      setLoadingRaces(false);
    }
  };

  useEffect(() => {
    if (selectedId != null) void loadRaces(selectedId);
    else setRaces([]);
  }, [selectedId]);

  const sortedRaces = useMemo(
    () => [...races].sort((a, b) => (a.raceDateTime ?? "").localeCompare(b.raceDateTime ?? "")),
    [races],
  );

  const pendingCount = useMemo(() => races.filter((r) => r.status === "RESULT_SUBMITTED").length, [races]);

  // Confirm / publish run from inside the detail modal — no native window.confirm().
  const runConfirm = async (race: Race) => {
    if (selectedId == null) return;
    setBusyId(race.id);
    setError(null);
    try {
      const updated = await confirmOrganizerRaceResults(race.id);
      setDetailRace(updated);
      await loadRaces(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not confirm the results."));
    } finally {
      setBusyId(null);
    }
  };

  const runPublish = async (race: Race) => {
    if (selectedId == null) return;
    setBusyId(race.id);
    setError(null);
    try {
      const updated = await publishOrganizerRaceResults(race.id);
      setDetailRace(updated);
      await loadRaces(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not publish the results."));
    } finally {
      setBusyId(null);
    }
  };

  // Send a submitted (not-yet-confirmed) result back to the referee for correction.
  const runReopen = async (race: Race, reason: string) => {
    if (selectedId == null) return;
    setBusyId(race.id);
    setError(null);
    try {
      const updated = await reopenOrganizerRaceResults(race.id, reason);
      setDetailRace(updated);
      await loadRaces(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send the results back."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-7">
      {/* Title Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#bb8a3c]">
            Workspace
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Results
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Referees submit each round&apos;s result; you ratify it. Open a round to review the finishing order, then{" "}
            <span className="font-bold text-slate-700">Confirm</span> to settle predictions and{" "}
            <span className="font-bold text-slate-700">Publish</span> to award championship points.
          </p>
        </div>
      </div>

      {/* Operations Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Championship:</span>
          <select
            className="block min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#bb8a3c] focus:ring-2 focus:ring-[#bb8a3c]/20 cursor-pointer"
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
          >
            {tournaments.length === 0 && <option value="">No championships</option>}
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl border border-[#e7e0d3] bg-white" />
      ) : tournaments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d8cfbd] bg-white/60 px-8 py-16 text-center">
          <p className="font-display text-2xl font-light text-[#211d1a]">No championships yet</p>
          <p className="mt-2 text-sm text-[#6f665b]">Results appear here once your races have run.</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl border border-[#e7e0d3] bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-[#efe9dd] px-6 py-5">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#bb8a3c]" />
              <h2 className="font-display text-xl font-light tracking-tight text-[#211d1a]">Rounds &amp; results</h2>
            </div>
            {pendingCount > 0 && (
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-indigo-800">
                {pendingCount} awaiting your confirmation
              </span>
            )}
          </div>

          {loadingRaces ? (
            <div className="h-40 animate-pulse bg-[#faf7f0]" />
          ) : sortedRaces.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-[#6f665b]">No races scheduled for this championship yet.</p>
          ) : (
            <ul className="divide-y divide-[#efe9dd]">
              {sortedRaces.map((race) => {
                const chip = statusChip(String(race.status));
                return (
                  <li key={race.id}>
                    <button
                      type="button"
                      onClick={() => setDetailRace(race)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-[#faf7f0] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#bb8a3c]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#211d1a]">{race.name}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[#8a8276]">
                          <span className="font-mono">{race.code}</span>
                          <span>· {formatDateTime(race.raceDateTime)}</span>
                          <span>· {race.refereeName ?? "No referee"}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${chip.className}`}>
                          {chip.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#bdb3a0]" aria-hidden="true" />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {detailRace && (
        <RaceResultModal
          race={detailRace}
          busy={busyId === detailRace.id}
          onClose={() => setDetailRace(null)}
          onConfirm={() => runConfirm(detailRace)}
          onPublish={() => runPublish(detailRace)}
          onReopen={(reason) => runReopen(detailRace, reason)}
        />
      )}
    </div>
  );
}

type ModalProps = {
  race: Race;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onPublish: () => void;
  onReopen: (reason: string) => void;
};

function RaceResultModal({ race, busy, onClose, onConfirm, onPublish, onReopen }: ModalProps) {
  const [result, setResult] = useState<PublicRaceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // null = not sending back; string = reason being typed in the inline "send back" panel.
  const [reopenReason, setReopenReason] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Once the round leaves RESULT_SUBMITTED (sent back / confirmed), drop out of send-back mode.
  useEffect(() => {
    if (race.status !== "RESULT_SUBMITTED") setReopenReason(null);
  }, [race.status]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getOrganizerRaceResults(race.id)
      .then((data) => active && setResult(data))
      .catch((err) => active && setLoadError(getApiErrorMessage(err, "Could not load the finishing order.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [race.id, race.status]);

  const entries = useMemo(
    () => [...(result?.entries ?? [])].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)),
    [result],
  );
  const chip = statusChip(String(race.status));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#1c1816]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <section
        aria-labelledby="race-result-title"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[#e7e0d3] bg-[#fdfbf6] shadow-2xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#efe9dd] bg-white px-6 py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#bb8a3c]">Race result</p>
            <h2 id="race-result-title" className="mt-1.5 truncate font-black text-slate-950 text-xl">
              {race.name}
            </h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500 font-semibold">
              <span className="font-mono text-[#bb8a3c]">{race.code}</span>
              <span className="text-slate-300">•</span>
              <span>{formatDateTime(race.raceDateTime)}</span>
              <span className="text-slate-300">•</span>
              <span>{race.refereeName ?? "No referee"}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bb8a3c]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${chip.className}`}>
              {chip.label}
            </span>
            {result?.publishedAt && (
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#a99f8c]">
                Published {formatDateTime(result.publishedAt)}
              </span>
            )}
          </div>

          {loading ? (
            <div className="h-48 animate-pulse rounded-xl bg-[#f2ece0]" />
          ) : loadError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{loadError}</p>
          ) : entries.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-[#e7e0d3]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f6f1e7] text-[10px] font-black uppercase tracking-[0.14em] text-[#8a8276]">
                    <th className="px-4 py-2.5 text-left">Pos</th>
                    <th className="px-4 py-2.5 text-left">Horse</th>
                    <th className="hidden px-4 py-2.5 text-left sm:table-cell">Jockey</th>
                    <th className="px-4 py-2.5 text-right">Time</th>
                    <th className="px-4 py-2.5 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efe9dd]">
                  {entries.map((entry, idx) => {
                    const pos = entry.position ?? idx + 1;
                    const tone = POSITION_TONE[pos] ?? "bg-[#efe9dd] text-[#6f665b]";
                    const finished = entry.resultStatus === "FINISHED";
                    return (
                      <tr key={`${entry.horseName}-${idx}`} className="bg-white">
                        <td className="px-4 py-3">
                          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${tone}`}>
                            {finished ? pos : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#211d1a]">{entry.horseName}</p>
                          {!finished && (
                            <span className="text-[10px] font-black uppercase tracking-wide text-rose-600">
                              {entry.resultStatus.replace(/_/g, " ")}
                            </span>
                          )}
                          <p className="text-xs text-[#8a8276] sm:hidden">{entry.jockeyName ?? "—"}</p>
                        </td>
                        <td className="hidden px-4 py-3 text-[#6f665b] sm:table-cell">{entry.jockeyName ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#3a342d]">{formatFinishTime(entry.finishTimeSeconds)}</td>
                        <td className="px-4 py-3 text-right font-black text-[#211d1a]">{entry.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#d8cfbd] bg-white/60 px-6 py-12 text-center">
              <Clock className="mx-auto h-7 w-7 text-[#c4b89f]" />
              <p className="mt-3 font-display text-lg font-light text-[#211d1a]">
                {race.status === "RESULT_SUBMITTED"
                  ? "Referee has submitted this round"
                  : "No published finishing order yet"}
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-[#6f665b]">
                {race.status === "RESULT_SUBMITTED"
                  ? "Confirm the round to settle spectator predictions and reveal the official finishing order."
                  : "The finishing order appears here once the referee submits and you confirm the round."}
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {reopenReason !== null ? (
          <div className="border-t border-[#efe9dd] bg-[#faf7f0] px-6 py-4">
            <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#8a8276]">
              Reason — sent back to the referee
              <textarea
                autoFocus
                rows={2}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g. Places 2 and 3 look swapped — please re-check the photo finish."
                className="mt-2 block w-full rounded-lg border border-[#e2d9c8] bg-white px-3 py-2 text-sm font-medium text-[#3a342d] outline-none focus:border-[#bb8a3c]"
              />
            </label>
            <div className="mt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReopenReason(null)}
                className="min-h-10 rounded-lg border border-[#ddd3c0] bg-white px-4 text-sm font-black text-[#3a342d] transition hover:bg-[#f3ead6]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || reopenReason.trim().length === 0}
                onClick={() => onReopen(reopenReason.trim())}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#9a3412] px-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#7c2d12] disabled:opacity-50"
              >
                <Undo2 className="h-4 w-4" /> {busy ? "Sending…" : "Send back"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 border-t border-[#efe9dd] bg-[#faf7f0] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 rounded-lg border border-[#ddd3c0] bg-white px-4 text-sm font-black text-[#3a342d] transition hover:bg-[#f3ead6]"
            >
              Close
            </button>
            {race.status === "RESULT_SUBMITTED" ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setReopenReason("")}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d8b48a] bg-white px-4 text-sm font-black uppercase tracking-wide text-[#9a3412] transition hover:bg-[#fdf4ec] disabled:opacity-50"
                >
                  <Undo2 className="h-4 w-4" /> Send back
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onConfirm}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#0d4a37] px-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#0b5a41] disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" /> {busy ? "Confirming…" : "Confirm results"}
                </button>
              </>
            ) : race.status === "RESULT_CONFIRMED" ? (
              <button
                type="button"
                disabled={busy}
                onClick={onPublish}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#bb8a3c] px-4 text-sm font-black uppercase tracking-wide text-[#1c1816] transition hover:bg-[#cfa24f] disabled:opacity-50"
              >
                <Megaphone className="h-4 w-4" /> {busy ? "Publishing…" : "Publish to leaderboard"}
              </button>
            ) : race.status === "PUBLISHED" ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-emerald-700">
                <BadgeCheck className="h-4 w-4" /> Official
              </span>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
