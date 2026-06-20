import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Check, ShieldCheck, UserPlus, XCircle } from "lucide-react";

import {
  getLicensedReferees,
  getMyOrganizerTournaments,
  getTournamentRefereeContracts,
  inviteReferee,
  terminateRefereeContract,
} from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { RefereeContract, RefereeContractStatus, RefereeDirectoryEntry, Tournament } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

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

export function OrganizerOfficialsPage() {
  useDocumentTitle("Officials | Organizer");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [directory, setDirectory] = useState<RefereeDirectoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [contracts, setContracts] = useState<RefereeContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [busyRefereeId, setBusyRefereeId] = useState<number | null>(null);
  const [busyContractId, setBusyContractId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [tRes, dRes] = await Promise.allSettled([getMyOrganizerTournaments(), getLicensedReferees()]);
      if (!active) return;
      if (tRes.status === "fulfilled") {
        setTournaments(tRes.value);
        setSelectedId(tRes.value[0]?.id ?? null);
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

  const handleInvite = async (refereeId: number) => {
    if (selectedId == null) return;
    setBusyRefereeId(refereeId);
    setError(null);
    try {
      await inviteReferee(selectedId, { refereeId });
      await loadContracts(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send the invitation."));
    } finally {
      setBusyRefereeId(null);
    }
  };

  const handleTerminate = async (contractId: number) => {
    if (selectedId == null) return;
    setBusyContractId(contractId);
    setError(null);
    try {
      await terminateRefereeContract(contractId);
      await loadContracts(selectedId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not terminate the contract."));
    } finally {
      setBusyContractId(null);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a8801f]">Workspace</p>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight text-[#211d1a] md:text-4xl">Officials</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6f665b]">
            Hire platform-licensed referees for a tournament. Only referees with an active contract can be assigned to its races.
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
          <p className="font-display text-2xl font-light text-[#211d1a]">Create a tournament first</p>
          <p className="mt-2 text-sm text-[#6f665b]">You can hire officials once you have a tournament to staff.</p>
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
              <p className="px-6 py-12 text-center text-sm text-[#6f665b]">No officials engaged for this tournament yet.</p>
            ) : (
              <ul className="divide-y divide-[#efe9dd]">
                {contracts.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#211d1a]">{c.refereeName}</p>
                      <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${contractBadge[c.status]}`}>
                        {c.status}
                      </span>
                    </div>
                    {c.status === "ACTIVE" && (
                      <button
                        type="button"
                        disabled={busyContractId === c.id}
                        onClick={() => handleTerminate(c.id)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-xs font-black uppercase tracking-wide text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" /> Terminate
                      </button>
                    )}
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
                    <li key={r.refereeId} className="flex items-center justify-between gap-4 px-6 py-4">
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
                      {engaged ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                          <Check className="h-4 w-4" /> Engaged
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={busyRefereeId === r.refereeId || selectedId == null}
                          onClick={() => handleInvite(r.refereeId)}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#bb8a3c] px-3 text-xs font-black uppercase tracking-wide text-[#1c1816] transition hover:bg-[#cfa24f] disabled:opacity-50"
                        >
                          <UserPlus className="h-4 w-4" /> Invite
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
