import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Check, ChevronRight, ShieldCheck } from "lucide-react";

import {
  getLicensedReferees,
  getMyOrganizerTournaments,
  getTournamentRefereeContracts,
  inviteReferee,
  terminateRefereeContract,
} from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useSelectedTournamentId } from "../../hooks/useSelectedTournamentId";
import type { RefereeContract, RefereeContractStatus, RefereeDirectoryEntry, Tournament } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";
import { RefereeDetailDrawer } from "../../components/organizer/RefereeDetailDrawer";

const contractBadge: Record<RefereeContractStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  DECLINED: "bg-rose-100 text-rose-700",
  TERMINATED: "bg-[#efe9dd] text-[#6f665b]",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

type Detail = { referee: RefereeDirectoryEntry; contract: RefereeContract | null };

export function OrganizerOfficialsPage() {
  useDocumentTitle("Officials | Organizer");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [directory, setDirectory] = useState<RefereeDirectoryEntry[]>([]);
  const [selectedId, setSelectedId] = useSelectedTournamentId();
  const [contracts, setContracts] = useState<RefereeContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [busyRefereeId, setBusyRefereeId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [tRes, dRes] = await Promise.allSettled([getMyOrganizerTournaments(), getLicensedReferees()]);
      if (!active) return;
      if (tRes.status === "fulfilled") {
        setTournaments(tRes.value);
        setSelectedId((prev) => (prev != null && tRes.value.some((t) => t.id === prev) ? prev : tRes.value[0]?.id ?? null));
      }
      if (dRes.status === "fulfilled") setDirectory(dRes.value);
      else setError(getApiErrorMessage(dRes.reason, "Could not load the referee directory."));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const loadContracts = async (tournamentId: number) => {
    setLoadingContracts(true);
    try {
      const data = await getTournamentRefereeContracts(tournamentId);
      setContracts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load contracts."));
    } finally {
      setLoadingContracts(false);
    }
  };

  useEffect(() => {
    if (selectedId != null) void loadContracts(selectedId);
    else setContracts([]);
  }, [selectedId]);

  const engagedRefereeIds = useMemo(
    () => new Set(contracts.filter((c) => c.status === "PENDING" || c.status === "ACTIVE").map((c) => c.refereeId)),
    [contracts],
  );

  const directoryById = useMemo(
    () => new Map(directory.map((d) => [d.refereeId, d])),
    [directory],
  );

  const refereeFor = (id: number, fallbackName?: string): RefereeDirectoryEntry =>
    directoryById.get(id) ?? { refereeId: id, fullName: fallbackName ?? `Referee #${id}`, email: "" };

  const activeOrPendingFor = (refereeId: number): RefereeContract | null =>
    contracts.find((c) => c.refereeId === refereeId && (c.status === "ACTIVE" || c.status === "PENDING")) ?? null;

  const handleInvite = async () => {
    if (selectedId == null || !detail) return;
    setBusyRefereeId(detail.referee.refereeId);
    setError(null);
    try {
      await inviteReferee(selectedId, { refereeId: detail.referee.refereeId });
      setDetail(null);
      await loadContracts(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send the invitation."));
    } finally {
      setBusyRefereeId(null);
    }
  };

  const handleTerminate = async () => {
    if (selectedId == null || !detail?.contract) return;
    setBusyRefereeId(detail.referee.refereeId);
    setError(null);
    try {
      await terminateRefereeContract(detail.contract.id);
      setDetail(null);
      await loadContracts(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not terminate the contract."));
    } finally {
      setBusyRefereeId(null);
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
            Officials
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Hire platform-licensed referees for a championship. Open a referee to see their licence and experience, then
            invite or terminate. Only referees with an active contract can be assigned to its races.
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
          <p className="font-display text-2xl font-light text-[#211d1a]">Create a championship first</p>
          <p className="mt-2 text-sm text-[#6f665b]">You can hire officials once you have a championship to staff.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contracted officials */}
          <section className="rounded-xl border border-[#e7e0d3] bg-white">
            <div className="flex items-center gap-2 border-b border-[#efe9dd] px-6 py-5">
              <ShieldCheck className="h-5 w-5 text-[#0d4a37]" />
              <h2 className="font-display text-xl font-light tracking-tight text-[#211d1a]">Contracted officials</h2>
            </div>
            {loadingContracts ? (
              <div className="h-40 animate-pulse bg-[#faf7f0]" />
            ) : contracts.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-[#6f665b]">No officials engaged for this championship yet.</p>
            ) : (
              <ul className="divide-y divide-[#efe9dd]">
                {contracts.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setDetail({ referee: refereeFor(c.refereeId, c.refereeName), contract: c })}
                      className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-[#faf7f0] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#bb8a3c]"
                    >
                      <p className="min-w-0 truncate font-semibold text-[#211d1a]">{c.refereeName}</p>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${contractBadge[c.status]}`}>
                          {c.status}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#bdb3a0]" aria-hidden="true" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Licensed referee directory */}
          <section className="rounded-xl border border-[#e7e0d3] bg-white">
            <div className="flex items-center gap-2 border-b border-[#efe9dd] px-6 py-5">
              <BadgeCheck className="h-5 w-5 text-[#bb8a3c]" />
              <h2 className="font-display text-xl font-light tracking-tight text-[#211d1a]">Licensed referees</h2>
            </div>
            {directory.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-[#6f665b]">No licensed referees available yet.</p>
            ) : (
              <ul className="divide-y divide-[#efe9dd]">
                {directory.map((r) => {
                  const engaged = engagedRefereeIds.has(r.refereeId);
                  return (
                    <li key={r.refereeId}>
                      <button
                        type="button"
                        onClick={() => setDetail({ referee: r, contract: activeOrPendingFor(r.refereeId) })}
                        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-[#faf7f0] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#bb8a3c]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3ead6] text-xs font-black uppercase text-[#8a6a1c]">
                            {initials(r.fullName)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#211d1a]">{r.fullName}</p>
                            <p className="truncate text-xs text-[#8a8276]">
                              {[r.licenseNumber && `Lic. ${r.licenseNumber}`, r.experienceYears != null && `${r.experienceYears} yrs`]
                                .filter(Boolean)
                                .join(" · ") || r.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {engaged && (
                            <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                              <Check className="h-4 w-4" /> Engaged
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 text-[#bdb3a0]" aria-hidden="true" />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {detail && (
        <RefereeDetailDrawer
          referee={detail.referee}
          contract={detail.contract}
          busy={busyRefereeId === detail.referee.refereeId}
          canInvite={selectedId != null}
          onClose={() => setDetail(null)}
          onInvite={handleInvite}
          onTerminate={handleTerminate}
        />
      )}
    </div>
  );
}
