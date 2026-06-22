import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Flag, Ruler, ShieldCheck, Users } from "lucide-react";

import { getOrganizerRaceParticipants } from "../../api/racingApi";
import type { Race, RaceParticipant } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";
import { Drawer, StatusPill } from "../office";

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Meta({ icon: Icon, label, value }: { icon: typeof Ruler; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-office-sand text-office-gilt">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-office-faint">{label}</p>
        <p className="truncate text-sm font-bold text-office-ink-soft">{value}</p>
      </div>
    </div>
  );
}

/** Read-only detail drawer for a race round — meta + the official field (participants). */
export function RaceDetailDrawer({ race, onClose }: { race: Race; onClose: () => void }) {
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getOrganizerRaceParticipants(race.id)
      .then((data) => active && setParticipants(Array.isArray(data) ? data : []))
      .catch((err) => active && setError(getApiErrorMessage(err, "Could not load the field.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [race.id]);

  const sorted = useMemo(
    () =>
      [...participants].sort(
        (a, b) => (a.startNumber ?? 99) - (b.startNumber ?? 99) || a.horseName.localeCompare(b.horseName),
      ),
    [participants],
  );

  return (
    <Drawer
      onClose={onClose}
      size="xl"
      labelledById="race-detail-title"
      eyebrow="Race round"
      title={race.name}
      headerMeta={
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-white/55">
          <span className="font-mono">{race.code}</span>
          <span>· {formatDateTime(race.raceDateTime)}</span>
          <StatusPill status={String(race.status)} />
        </p>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Meta icon={Ruler} label="Distance" value={`${race.distanceMeters} m`} />
        <Meta icon={Users} label="Max starters" value={String(race.maxParticipants)} />
        <Meta icon={CalendarClock} label="Off time" value={formatDateTime(race.raceDateTime)} />
        <Meta icon={ShieldCheck} label="Referee" value={race.refereeName ?? "Unassigned"} />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Flag className="h-4 w-4 text-office-brass" />
        <h3 className="font-display text-lg font-light text-office-ink">The field</h3>
        <span className="text-xs font-bold text-office-faint">{sorted.length} starter(s)</span>
      </div>

      {loading ? (
        <div className="mt-3 h-40 animate-pulse rounded-xl bg-[#f2ece0]" />
      ) : error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>
      ) : sorted.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-office-line-strong bg-white/60 px-6 py-10 text-center">
          <p className="font-display text-lg font-light text-office-ink">The field isn’t set yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-office-muted">
            Starters are filled from your locked participants when you publish the schedule.
          </p>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-office-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f1e7] text-[10px] font-black uppercase tracking-[0.14em] text-office-muted-soft">
                <th className="px-4 py-2.5 text-left">No.</th>
                <th className="px-4 py-2.5 text-left">Horse</th>
                <th className="hidden px-4 py-2.5 text-left sm:table-cell">Jockey</th>
                <th className="hidden px-4 py-2.5 text-left md:table-cell">Owner</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-office-line-soft">
              {sorted.map((p, idx) => (
                <tr key={p.id} className="bg-white">
                  <td className="px-4 py-3 font-mono text-office-muted">{p.startNumber ?? idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-office-ink">{p.horseName}</p>
                    <p className="text-xs text-office-muted sm:hidden">{p.jockeyName ?? "—"}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-office-muted sm:table-cell">{p.jockeyName ?? "—"}</td>
                  <td className="hidden px-4 py-3 text-office-muted md:table-cell">{p.ownerName}</td>
                  <td className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wide text-office-muted-soft">
                    {p.status?.replace(/_/g, " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Drawer>
  );
}
