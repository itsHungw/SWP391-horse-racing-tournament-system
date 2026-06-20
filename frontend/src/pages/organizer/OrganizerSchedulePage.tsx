import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Flag, Pencil, Plus, Send, ShieldCheck, Trash2, X } from "lucide-react";

import {
  assignOrganizerRaceReferee,
  createOrganizerRace,
  deleteOrganizerRace,
  getMyOrganizerTournaments,
  getOrganizerRaces,
  getTournamentRefereeContracts,
  updateOrganizerRace,
  updateOrganizerTournamentStatus,
} from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Race, RacePayload, Tournament } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

const raceBadge: Record<string, string> = {
  SCHEDULED: "bg-[#f3ead6] text-[#8a6a1c]",
  CHECKING: "bg-sky-100 text-sky-800",
  READY: "bg-sky-100 text-sky-800",
  ONGOING: "bg-amber-100 text-amber-800",
  FINISHED: "bg-indigo-100 text-indigo-800",
  RESULT_SUBMITTED: "bg-indigo-100 text-indigo-800",
  RESULT_CONFIRMED: "bg-emerald-100 text-emerald-800",
  PUBLISHED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-700",
};

const EMPTY_FORM = { name: "", code: "", raceDateTime: "", distanceMeters: "1600", maxParticipants: "12" };

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrganizerSchedulePage() {
  useDocumentTitle("Schedule | Organizer");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [activeReferees, setActiveReferees] = useState<Array<{ refereeId: number; refereeName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const [editor, setEditor] = useState<{ mode: "new" } | { mode: "edit"; race: Race } | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMyOrganizerTournaments()
      .then((data) => {
        if (!active) return;
        setTournaments(data);
        setSelectedId(data[0]?.id ?? null);
      })
      .catch((err) => active && setError(getApiErrorMessage(err, "Could not load your tournaments.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const loadRaces = async (tournamentId: number) => {
    setLoadingRaces(true);
    try {
      const [racesData, contracts] = await Promise.all([
        getOrganizerRaces(tournamentId),
        getTournamentRefereeContracts(tournamentId),
      ]);
      setRaces(Array.isArray(racesData) ? racesData : []);
      setActiveReferees(
        contracts
          .filter((c) => c.status === "ACTIVE")
          .map((c) => ({ refereeId: c.refereeId, refereeName: c.refereeName ?? `Referee #${c.refereeId}` })),
      );
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load the race schedule."));
    } finally {
      setLoadingRaces(false);
    }
  };

  useEffect(() => {
    if (selectedId != null) void loadRaces(selectedId);
    else {
      setRaces([]);
      setActiveReferees([]);
    }
  }, [selectedId]);

  const sortedRaces = useMemo(
    () => [...races].sort((a, b) => (a.raceDateTime ?? "").localeCompare(b.raceDateTime ?? "")),
    [races],
  );

  const selectedTournament = useMemo(
    () => tournaments.find((t) => t.id === selectedId) ?? null,
    [tournaments, selectedId],
  );
  const isLive = ["SCHEDULE_PUBLISHED", "ONGOING", "COMPLETED"].includes(selectedTournament?.status ?? "");
  const allRefereed = races.length > 0 && races.every((r) => r.refereeId != null);
  const canPublish = selectedTournament?.status === "PARTICIPANTS_LOCKED" && allRefereed;

  const refreshTournaments = async () => {
    try {
      setTournaments(await getMyOrganizerTournaments());
    } catch {
      /* keep existing list */
    }
  };

  const publishSchedule = async () => {
    if (selectedId == null) return;
    setPublishing(true);
    setError(null);
    try {
      await updateOrganizerTournamentStatus(selectedId, "SCHEDULE_PUBLISHED");
      await refreshTournaments();
      await loadRaces(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not publish the schedule."));
    } finally {
      setPublishing(false);
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditor({ mode: "new" });
  };

  const openEdit = (race: Race) => {
    setForm({
      name: race.name,
      code: race.code,
      raceDateTime: race.raceDateTime ? race.raceDateTime.slice(0, 16) : "",
      distanceMeters: String(race.distanceMeters ?? ""),
      maxParticipants: String(race.maxParticipants ?? ""),
    });
    setFormError(null);
    setEditor({ mode: "edit", race });
  };

  const saveRace = async () => {
    if (selectedId == null || !editor) return;
    if (!form.name.trim() || !form.code.trim() || !form.raceDateTime) {
      setFormError("Name, code and date/time are required.");
      return;
    }
    const distance = Number(form.distanceMeters);
    const maxParticipants = Number(form.maxParticipants);
    if (!Number.isFinite(distance) || distance < 1) {
      setFormError("Distance must be at least 1 metre.");
      return;
    }
    if (!Number.isFinite(maxParticipants) || maxParticipants < 2) {
      setFormError("A round needs at least 2 starters.");
      return;
    }
    const payload: RacePayload = {
      tournamentId: selectedId,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      raceDateTime: form.raceDateTime,
      distanceMeters: distance,
      maxParticipants,
    };
    setSaving(true);
    setFormError(null);
    try {
      if (editor.mode === "edit") await updateOrganizerRace(editor.race.id, payload);
      else await createOrganizerRace(payload);
      setEditor(null);
      await loadRaces(selectedId);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not save the round."));
    } finally {
      setSaving(false);
    }
  };

  const removeRace = async (race: Race) => {
    if (selectedId == null) return;
    if (!window.confirm(`Delete "${race.name}"? This cannot be undone.`)) return;
    setBusyId(race.id);
    setError(null);
    try {
      await deleteOrganizerRace(race.id);
      await loadRaces(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete the round."));
    } finally {
      setBusyId(null);
    }
  };

  const assignReferee = async (race: Race, refereeId: number) => {
    if (selectedId == null || !refereeId) return;
    setBusyId(race.id);
    setError(null);
    try {
      await assignOrganizerRaceReferee(race.id, refereeId);
      await loadRaces(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not assign the referee."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a8801f]">Workspace</p>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight text-[#211d1a] md:text-4xl">Schedule</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6f665b]">
            Build the race card — create each round and assign a contracted referee. Every round needs a referee before
            you can publish the schedule; the field is filled from your locked participants at publish time.
          </p>
        </div>
        <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8a8276]">
          Tournament
          <select
            className="mt-2 block min-h-11 w-64 rounded-lg border border-[#e2d9c8] bg-white px-3 text-sm font-bold text-[#3a342d] outline-none focus:border-[#bb8a3c]"
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
          >
            {tournaments.length === 0 && <option value="">No tournaments</option>}
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
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
          <p className="font-display text-2xl font-light text-[#211d1a]">No tournaments yet</p>
          <p className="mt-2 text-sm text-[#6f665b]">Create a tournament before building its race card.</p>
        </div>
      ) : (
        <>
          <div className={`rounded-xl border p-5 ${isLive ? "border-emerald-200 bg-emerald-50" : "border-[#e7e0d3] bg-[#fbf8f1]"}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-black text-[#211d1a]">{isLive ? "Schedule is live" : "How a race goes live"}</p>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#6f665b]">
                  {isLive
                    ? "Assigned referees can now run these rounds from their own workspace — pre-race checks, start, finish, then submit results. You ratify them under Results."
                    : "Races aren't started manually here. On race day the assigned referee runs each round from their workspace — but rounds only appear there once you publish the schedule."}
                </p>
              </div>
              {!isLive && (
                <button
                  type="button"
                  disabled={!canPublish || publishing}
                  onClick={publishSchedule}
                  className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[#bb8a3c] px-4 text-xs font-black uppercase tracking-wide text-[#1c1816] transition hover:bg-[#cfa24f] disabled:opacity-40"
                >
                  <Send className="h-4 w-4" /> {publishing ? "Publishing…" : "Publish schedule"}
                </button>
              )}
            </div>
            {!isLive && !canPublish && (
              <p className="mt-3 text-xs font-semibold text-[#a8801f]">
                {selectedTournament?.status !== "PARTICIPANTS_LOCKED"
                  ? "Before publishing: close registration, then lock the field (Registrations → Lock the field)."
                  : races.length === 0
                    ? "Add at least one round before publishing."
                    : "Assign a referee to every round before publishing."}
              </p>
            )}
          </div>

          <section className="overflow-hidden rounded-xl border border-[#e7e0d3] bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-[#efe9dd] px-6 py-5">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-[#bb8a3c]" />
              <h2 className="font-display text-xl font-light tracking-tight text-[#211d1a]">Rounds</h2>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#bb8a3c] px-4 text-sm font-black uppercase tracking-wide text-[#1c1816] transition hover:bg-[#cfa24f]"
            >
              <Plus className="h-4 w-4" /> Add round
            </button>
          </div>

          {activeReferees.length === 0 && (
            <p className="border-b border-[#efe9dd] bg-[#faf7f0] px-6 py-3 text-xs font-semibold text-[#8a6a1c]">
              No contracted referees yet — hire referees in <span className="font-black">Officials</span> before assigning
              them to rounds.
            </p>
          )}

          {loadingRaces ? (
            <div className="h-40 animate-pulse bg-[#faf7f0]" />
          ) : sortedRaces.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-[#6f665b]">No rounds yet. Add the first round to start the card.</p>
          ) : (
            <ul className="divide-y divide-[#efe9dd]">
              {sortedRaces.map((race) => {
                const editable = race.status === "SCHEDULED";
                return (
                  <li key={race.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-[#211d1a]">{race.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${raceBadge[race.status] ?? "bg-[#efe9dd] text-[#6f665b]"}`}>
                          {String(race.status).replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[#8a8276]">
                        <span className="font-mono">{race.code}</span>
                        <span>· {formatDateTime(race.raceDateTime)}</span>
                        <span>· {race.distanceMeters} m</span>
                        <span>· max {race.maxParticipants}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className={`h-4 w-4 ${race.refereeId ? "text-[#0d4a37]" : "text-[#c4b79b]"}`} />
                        {editable ? (
                          <select
                            disabled={busyId === race.id || activeReferees.length === 0}
                            value={race.refereeId ?? ""}
                            onChange={(e) => assignReferee(race, Number(e.target.value))}
                            className="min-h-9 rounded-lg border border-[#e2d9c8] bg-white px-2 text-xs font-bold text-[#3a342d] outline-none focus:border-[#bb8a3c] disabled:opacity-50"
                          >
                            <option value="">Assign referee…</option>
                            {activeReferees.map((ref) => (
                              <option key={ref.refereeId} value={ref.refereeId}>
                                {ref.refereeName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-bold text-[#3a342d]">{race.refereeName ?? "Unassigned"}</span>
                        )}
                      </div>

                      {editable && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(race)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#e2d9c8] px-3 text-xs font-black uppercase tracking-wide text-[#6f665b] transition hover:border-[#cfa24f] hover:text-[#211d1a]"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            disabled={busyId === race.id}
                            onClick={() => removeRace(race)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-xs font-black uppercase tracking-wide text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        </>
      )}

      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1816]/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl border border-[#e7e0d3] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-[#bb8a3c]" />
                <h3 className="font-display text-xl font-light text-[#211d1a]">
                  {editor.mode === "edit" ? "Edit round" : "New round"}
                </h3>
              </div>
              <button type="button" onClick={() => setEditor(null)} className="text-[#8a8276] hover:text-[#211d1a]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700">
                {formError}
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#8a8276]">
                Round name
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Heritage Mile — Final"
                  className="mt-2 block w-full rounded-lg border border-[#e2d9c8] bg-white px-3 py-2 text-sm font-medium text-[#3a342d] outline-none focus:border-[#bb8a3c]"
                />
              </label>
              <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8a8276]">
                Code
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="HERITAGE_FINAL"
                  className="mt-2 block w-full rounded-lg border border-[#e2d9c8] bg-white px-3 py-2 font-mono text-sm uppercase text-[#3a342d] outline-none focus:border-[#bb8a3c]"
                />
              </label>
              <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8a8276]">
                Date &amp; time
                <input
                  type="datetime-local"
                  value={form.raceDateTime}
                  onChange={(e) => setForm((f) => ({ ...f, raceDateTime: e.target.value }))}
                  className="mt-2 block w-full rounded-lg border border-[#e2d9c8] bg-white px-3 py-2 text-sm font-medium text-[#3a342d] outline-none focus:border-[#bb8a3c]"
                />
              </label>
              <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8a8276]">
                Distance (m)
                <input
                  type="number"
                  min={1}
                  value={form.distanceMeters}
                  onChange={(e) => setForm((f) => ({ ...f, distanceMeters: e.target.value }))}
                  className="mt-2 block w-full rounded-lg border border-[#e2d9c8] bg-white px-3 py-2 text-sm font-medium text-[#3a342d] outline-none focus:border-[#bb8a3c]"
                />
              </label>
              <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8a8276]">
                Max starters
                <input
                  type="number"
                  min={2}
                  value={form.maxParticipants}
                  onChange={(e) => setForm((f) => ({ ...f, maxParticipants: e.target.value }))}
                  className="mt-2 block w-full rounded-lg border border-[#e2d9c8] bg-white px-3 py-2 text-sm font-medium text-[#3a342d] outline-none focus:border-[#bb8a3c]"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="inline-flex min-h-10 items-center rounded-lg border border-[#e2d9c8] px-4 text-sm font-bold text-[#6f665b] transition hover:bg-[#faf7f0]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveRace}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#bb8a3c] px-4 text-sm font-black uppercase tracking-wide text-[#1c1816] transition hover:bg-[#cfa24f] disabled:opacity-50"
              >
                {editor.mode === "edit" ? "Save changes" : "Create round"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
