import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ClipboardList, Lock, UserCheck, Users } from "lucide-react";

import {
  approveOrganizerJockeyApplication,
  approveOrganizerTournamentRegistration,
  getMyOrganizerTournaments,
  getOrganizerJockeyApplications,
  getOrganizerParticipants,
  getOrganizerTournamentRegistrations,
  lockOrganizerParticipants,
  rejectOrganizerJockeyApplication,
  rejectOrganizerTournamentRegistration,
} from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useSelectedTournamentId } from "../../hooks/useSelectedTournamentId";
import type {
  JockeyPoolApplication,
  Tournament,
  TournamentParticipant,
  TournamentRegistration,
} from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";
import { ConfirmDialog } from "../../components/organizer/ConfirmDialog";
import { RegistrationDetailDrawer, type RegistrationDetail } from "../../components/organizer/RegistrationDetailDrawer";

const statusBadge: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  APPROVED_FOR_POOL: "bg-emerald-100 text-emerald-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-700",
  DISQUALIFIED: "bg-rose-100 text-rose-700",
  WITHDRAWN: "bg-[#efe9dd] text-[#6f665b]",
};

type Tab = "horses" | "jockeys" | "participants";

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function prettyStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function OrganizerRegistrationsPage() {
  useDocumentTitle("Registrations | Organizer");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useSelectedTournamentId();
  const [tab, setTab] = useState<Tab>("horses");
  const [horses, setHorses] = useState<TournamentRegistration[]>([]);
  const [jockeys, setJockeys] = useState<JockeyPoolApplication[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [locking, setLocking] = useState(false);
  const [confirmLock, setConfirmLock] = useState(false);
  const [detail, setDetail] = useState<RegistrationDetail | null>(null);

  useEffect(() => {
    let active = true;
    getMyOrganizerTournaments()
      .then((data) => {
        if (!active) return;
        setTournaments(data);
        setSelectedId((prev) => (prev != null && data.some((t) => t.id === prev) ? prev : data[0]?.id ?? null));
      })
      .catch((err) => active && setError(getApiErrorMessage(err, "Could not load your tournaments.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const loadEntries = async (tournamentId: number) => {
    setLoadingRows(true);
    try {
      const [h, j, p] = await Promise.all([
        getOrganizerTournamentRegistrations(tournamentId),
        getOrganizerJockeyApplications(tournamentId),
        getOrganizerParticipants(tournamentId),
      ]);
      setHorses(Array.isArray(h) ? h : []);
      setJockeys(Array.isArray(j) ? j : []);
      setParticipants(Array.isArray(p) ? p : []);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load entries."));
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    setNotice(null);
    if (selectedId != null) void loadEntries(selectedId);
    else {
      setHorses([]);
      setJockeys([]);
      setParticipants([]);
    }
  }, [selectedId]);

  const horsePending = useMemo(() => horses.filter((h) => h.status === "PENDING").length, [horses]);
  const jockeyPending = useMemo(() => jockeys.filter((j) => j.status === "PENDING").length, [jockeys]);

  const sortedHorses = useMemo(
    () => [...horses].sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING")),
    [horses],
  );
  const sortedJockeys = useMemo(
    () => [...jockeys].sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING")),
    [jockeys],
  );
  const sortedParticipants = useMemo(
    () => [...participants].sort((a, b) => a.horseName.localeCompare(b.horseName)),
    [participants],
  );

  const detailBusyKey = detail ? `${detail.kind}-${detail.data.id}` : "";

  const approveFromDetail = async () => {
    if (!detail || selectedId == null) return;
    setBusyKey(detailBusyKey);
    setError(null);
    try {
      if (detail.kind === "horses") await approveOrganizerTournamentRegistration(detail.data.id);
      else await approveOrganizerJockeyApplication(selectedId, detail.data.id);
      setDetail(null);
      await loadEntries(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not approve the entry."));
    } finally {
      setBusyKey(null);
    }
  };

  const rejectFromDetail = async (reason: string) => {
    if (!detail || selectedId == null || reason.trim().length === 0) return;
    setBusyKey(detailBusyKey);
    setError(null);
    try {
      if (detail.kind === "horses") await rejectOrganizerTournamentRegistration(detail.data.id, reason.trim());
      else await rejectOrganizerJockeyApplication(selectedId, detail.data.id, reason.trim());
      setDetail(null);
      await loadEntries(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not reject the entry."));
    } finally {
      setBusyKey(null);
    }
  };

  const lockField = async () => {
    if (selectedId == null) return;
    setLocking(true);
    setError(null);
    setNotice(null);
    try {
      const res = await lockOrganizerParticipants(selectedId);
      setNotice(`Field locked — ${res.createdParticipants} official participant(s) created. You can now build the schedule.`);
      await loadEntries(selectedId);
      setTab("participants");
      setConfirmLock(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not lock the field."));
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a8801f]">Workspace</p>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight text-[#211d1a] md:text-4xl">Registrations</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6f665b]">
            Review who wants into your tournament — horses entered by owners and jockeys applying to your pool. Open a
            row to see the full detail and approve or reject. When contracts are accepted, lock the field to finalise the
            official roster.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
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
          {selectedId != null && (
            <button
              type="button"
              disabled={locking}
              onClick={() => setConfirmLock(true)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#1c1816] bg-[#1c1816] px-4 text-xs font-black uppercase tracking-wide text-[#f7f4ee] transition hover:bg-[#2a241f] disabled:opacity-50"
            >
              <Lock className="h-4 w-4" /> Lock the field
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800" role="status">
          {notice}
        </div>
      )}
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
          <p className="mt-2 text-sm text-[#6f665b]">Create a tournament and open registration to receive entries.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <TabButton active={tab === "horses"} onClick={() => setTab("horses")} icon={ClipboardList} label="Horse entries" count={horsePending} />
            <TabButton active={tab === "jockeys"} onClick={() => setTab("jockeys")} icon={Users} label="Jockey pool" count={jockeyPending} />
            <TabButton active={tab === "participants"} onClick={() => setTab("participants")} icon={UserCheck} label="Participants" count={0} total={participants.length} />
          </div>

          <section className="overflow-hidden rounded-xl border border-[#e7e0d3] bg-white">
            {loadingRows ? (
              <div className="h-40 animate-pulse bg-[#faf7f0]" />
            ) : tab === "horses" ? (
              sortedHorses.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-[#6f665b]">No horse entries yet.</p>
              ) : (
                <ul className="divide-y divide-[#efe9dd]">
                  {sortedHorses.map((r) => (
                    <li key={r.id}>
                      <RowButton onClick={() => setDetail({ kind: "horses", data: r })} status={r.status}>
                        {r.horseImageUrl ? (
                          <img src={r.horseImageUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f3ead6] text-sm font-black text-[#8a6a1c]">
                            {r.horseName?.[0] ?? "?"}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#211d1a]">{r.horseName}</p>
                          <p className="truncate text-xs text-[#8a8276]">
                            {r.ownerName ?? "Unknown owner"} · {formatDate(r.createdAt)}
                          </p>
                        </div>
                      </RowButton>
                    </li>
                  ))}
                </ul>
              )
            ) : tab === "jockeys" ? (
              sortedJockeys.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-[#6f665b]">No jockeys have applied to this pool yet.</p>
              ) : (
                <ul className="divide-y divide-[#efe9dd]">
                  {sortedJockeys.map((j) => (
                    <li key={j.id}>
                      <RowButton onClick={() => setDetail({ kind: "jockeys", data: j })} status={j.status}>
                        {j.jockeyAvatarUrl ? (
                          <img src={j.jockeyAvatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f3ead6] text-sm font-black text-[#8a6a1c]">
                            {j.jockeyName?.[0] ?? "?"}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#211d1a]">{j.jockeyName}</p>
                          <p className="truncate text-xs text-[#8a8276]">
                            {j.message ? j.message : j.jockeyEmail ?? "Applied"} · {formatDate(j.createdAt)}
                          </p>
                        </div>
                      </RowButton>
                    </li>
                  ))}
                </ul>
              )
            ) : sortedParticipants.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-[#6f665b]">No participants locked yet.</p>
                <p className="mt-1 text-xs text-[#a99f8c]">
                  Approve entries, wait for owners and jockeys to accept their contracts, then use <span className="font-bold">Lock the field</span>.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#efe9dd]">
                {sortedParticipants.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f3ead6] text-sm font-black text-[#8a6a1c]">
                        {p.horseName?.[0] ?? "?"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#211d1a]">
                          {p.horseName} <span className="font-normal text-[#a99f8c]">×</span> {p.jockeyName}
                        </p>
                        <p className="truncate text-xs text-[#8a8276]">
                          {p.ownerName} · {p.points} pts
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusBadge[p.status] ?? "bg-[#efe9dd] text-[#6f665b]"}`}>
                      {prettyStatus(p.status)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        open={confirmLock}
        title="Lock the field?"
        message="Every accepted horse + jockey contract becomes an official participant and the roster closes. You can’t add entries after this."
        confirmLabel={locking ? "Locking…" : "Lock field"}
        busy={locking}
        onConfirm={lockField}
        onClose={() => setConfirmLock(false)}
      />

      {detail && (
        <RegistrationDetailDrawer
          entry={detail}
          busy={busyKey === detailBusyKey}
          onClose={() => setDetail(null)}
          onApprove={approveFromDetail}
          onReject={rejectFromDetail}
        />
      )}
    </div>
  );
}

function RowButton({
  onClick,
  status,
  children,
}: {
  onClick: () => void;
  status: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-[#faf7f0] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#bb8a3c]"
    >
      <div className="flex min-w-0 items-center gap-3">{children}</div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusBadge[status] ?? "bg-[#efe9dd] text-[#6f665b]"}`}>
          {prettyStatus(status)}
        </span>
        <ChevronRight className="h-4 w-4 text-[#bdb3a0]" aria-hidden="true" />
      </div>
    </button>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  total,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Users;
  label: string;
  count: number;
  total?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-sm font-black tracking-tight transition ${
        active ? "border-[#bb8a3c] bg-[#bb8a3c] text-[#1c1816]" : "border-[#e2d9c8] bg-white text-[#6f665b] hover:border-[#cfa24f]"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {count > 0 && (
        <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-black/15" : "bg-amber-100 text-amber-800"}`}>{count}</span>
      )}
      {total != null && total > 0 && count === 0 && (
        <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-black/15" : "bg-[#efe9dd] text-[#6f665b]"}`}>{total}</span>
      )}
    </button>
  );
}
