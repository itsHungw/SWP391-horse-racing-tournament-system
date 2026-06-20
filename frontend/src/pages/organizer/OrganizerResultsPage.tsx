import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CheckCircle2, Clock, Megaphone, Trophy } from "lucide-react";

import {
  confirmOrganizerRaceResults,
  getMyOrganizerTournaments,
  getOrganizerRaces,
  publishOrganizerRaceResults,
} from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Race, Tournament } from "../../types/racing";
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

const AWAITING = new Set(["SCHEDULED", "CHECKING", "READY", "ONGOING", "FINISHED"]);

export function OrganizerResultsPage() {
  useDocumentTitle("Results | Organizer");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const confirm = async (race: Race) => {
    if (selectedId == null) return;
    if (!window.confirm(`Confirm results for "${race.name}"? This settles spectator predictions for the round.`)) return;
    setBusyId(race.id);
    setError(null);
    try {
      await confirmOrganizerRaceResults(race.id);
      await loadRaces(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not confirm the results."));
    } finally {
      setBusyId(null);
    }
  };

  const publish = async (race: Race) => {
    if (selectedId == null) return;
    if (!window.confirm(`Publish "${race.name}" to the public leaderboard? Championship points will be awarded.`)) return;
    setBusyId(race.id);
    setError(null);
    try {
      await publishOrganizerRaceResults(race.id);
      await loadRaces(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not publish the results."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a8801f]">Workspace</p>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight text-[#211d1a] md:text-4xl">Results</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6f665b]">
            Referees submit each round&apos;s result; you ratify it. <span className="font-bold text-[#3a342d]">Confirm</span>{" "}
            settles predictions, then <span className="font-bold text-[#3a342d]">Publish</span> awards championship points and
            shows the result publicly.
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
            <p className="px-6 py-12 text-center text-sm text-[#6f665b]">No races scheduled for this tournament yet.</p>
          ) : (
            <ul className="divide-y divide-[#efe9dd]">
              {sortedRaces.map((race) => (
                <li key={race.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#211d1a]">{race.name}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[#8a8276]">
                      <span className="font-mono">{race.code}</span>
                      <span>· {formatDateTime(race.raceDateTime)}</span>
                      <span>· {race.refereeName ?? "No referee"}</span>
                    </p>
                  </div>

                  <div>
                    {race.status === "RESULT_SUBMITTED" ? (
                      <button
                        type="button"
                        disabled={busyId === race.id}
                        onClick={() => confirm(race)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#0d4a37] px-3.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-[#0b5a41] disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Confirm results
                      </button>
                    ) : race.status === "RESULT_CONFIRMED" ? (
                      <button
                        type="button"
                        disabled={busyId === race.id}
                        onClick={() => publish(race)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#bb8a3c] px-3.5 text-xs font-black uppercase tracking-wide text-[#1c1816] transition hover:bg-[#cfa24f] disabled:opacity-50"
                      >
                        <Megaphone className="h-4 w-4" /> Publish
                      </button>
                    ) : race.status === "PUBLISHED" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-700">
                        <BadgeCheck className="h-4 w-4" /> Official
                      </span>
                    ) : race.status === "CANCELLED" ? (
                      <span className="text-xs font-black uppercase tracking-wide text-rose-600">Cancelled</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#a99f8c]">
                        <Clock className="h-4 w-4" />
                        {AWAITING.has(race.status as string) ? "Awaiting referee" : String(race.status).replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
