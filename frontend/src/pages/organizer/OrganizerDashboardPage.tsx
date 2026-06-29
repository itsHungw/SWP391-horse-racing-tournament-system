import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarClock, CheckCircle2, Clock3, Plus, Trophy } from "lucide-react";

import { getMyOrganization, getMyOrganizerTournaments } from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Organization, Tournament } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

const LIVE_STATUSES = ["OPEN_REGISTRATION", "CLOSED_REGISTRATION", "PARTICIPANTS_LOCKED", "SCHEDULE_PUBLISHED", "ONGOING"];

const statusBadge: Record<string, string> = {
  DRAFT: "bg-[#efe9dd] text-[#6f665b]",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  OPEN_REGISTRATION: "bg-emerald-100 text-emerald-800",
  CLOSED_REGISTRATION: "bg-amber-100 text-amber-800",
  PARTICIPANTS_LOCKED: "bg-amber-100 text-amber-800",
  SCHEDULE_PUBLISHED: "bg-sky-100 text-sky-800",
  ONGOING: "bg-[#fbf8f1] text-[#bb8a3c] border border-[#bb8a3c]/30",
  COMPLETED: "bg-[#efe9dd] text-[#6f665b]",
  POSTPONED: "bg-rose-100 text-rose-700",
};

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function OrganizerDashboardPage() {
  useDocumentTitle("Dashboard | Organizer");

  const [org, setOrg] = useState<Organization | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [orgRes, listRes] = await Promise.allSettled([getMyOrganization(), getMyOrganizerTournaments()]);
      if (!active) return;
      if (orgRes.status === "fulfilled") setOrg(orgRes.value);
      if (listRes.status === "fulfilled") setTournaments(listRes.value);
      else setError(getApiErrorMessage(listRes.reason, "Could not load your championships."));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const by = (pred: (t: Tournament) => boolean) => tournaments.filter(pred).length;
    return [
      { label: "Total championships", value: tournaments.length, icon: Trophy, accent: "#bb8a3c" },
      { label: "Awaiting approval", value: by((t) => t.status === "PENDING_APPROVAL"), icon: Clock3, accent: "#b45309" },
      { label: "Live now", value: by((t) => LIVE_STATUSES.includes(t.status)), icon: CalendarClock, accent: "#0d4a37" },
      { label: "Completed", value: by((t) => t.status === "COMPLETED"), icon: CheckCircle2, accent: "#6f665b" },
    ];
  }, [tournaments]);

  const recent = tournaments.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#bb8a3c]">
            Race Office
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {org ? org.name : "Welcome back"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Stage your championships, manage entries, and hire officials — all from one desk.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700" role="alert">
          {error}
        </div>
      )}

      {/* Stat tiles */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="relative overflow-hidden rounded-xl border border-[#e7e0d3] bg-white p-6">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: s.accent }} />
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8276]">{s.label}</p>
                <Icon className="h-5 w-5" style={{ color: s.accent }} aria-hidden="true" />
              </div>
              <p className="mt-4 text-5xl font-black leading-none text-slate-950">
                {loading ? "—" : s.value}
              </p>
            </div>
          );
        })}
      </section>

      {/* Recent tournaments */}
      <section className="rounded-xl border border-[#e7e0d3] bg-white">
        <div className="flex items-center justify-between border-b border-[#efe9dd] px-6 py-5">
          <h2 className="text-xl font-bold tracking-tight text-slate-950">Recent championships</h2>
          <Link to="/organizer/tournaments" className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.12em] text-[#8a6a1c] transition hover:text-[#bb8a3c]">
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="h-40 animate-pulse bg-[#faf7f0]" />
        ) : recent.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-display text-2xl font-light text-[#211d1a]">No championships yet</p>
            <p className="mt-2 text-sm text-[#6f665b]">Create your first championship to get started.</p>
            <Link to="/organizer/tournaments" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1c1816] px-6 text-xs font-black uppercase tracking-[0.14em] text-[#f7f4ee] transition hover:bg-[#2a241f]">
              Go to Championships
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[#efe9dd]">
            {recent.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="text-lg font-bold tracking-tight text-slate-950">{t.name}</p>
                  <p className="mt-0.5 font-mono text-xs uppercase tracking-[0.12em] text-[#8a8276]">
                    {t.code} · {formatDate(t.startDate)} – {formatDate(t.endDate)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${statusBadge[t.status] ?? "bg-[#efe9dd] text-[#6f665b]"}`}>
                  {t.status.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
