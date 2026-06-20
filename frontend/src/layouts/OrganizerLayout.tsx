import { useEffect, useState } from "react";
import {
  Building2,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Medal,
  Plus,
  Search,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { getMyOrganization } from "../api/racingApi";
import { useClientSession } from "../hooks/useClientSession";
import type { Organization } from "../types/racing";

/**
 * Organizer ("Race Office") workspace shell. Warm brass-on-charcoal identity to
 * distinguish the host/promoter role from Admin (navy) and Referee (teal).
 * Structure mirrors the other role workspaces: header + dark sidebar + Outlet.
 */
const navSections: Array<{
  label: string;
  items: Array<{ label: string; href: string; icon: typeof Trophy; end?: boolean }>;
}> = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/organizer", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Tournaments",
    items: [
      { label: "My Tournaments", href: "/organizer/tournaments", icon: Trophy },
      { label: "Create", href: "/organizer/tournaments/new", icon: Plus },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Registrations", href: "/organizer/registrations", icon: ClipboardList },
      { label: "Schedule", href: "/organizer/schedule", icon: CalendarClock },
      { label: "Officials", href: "/organizer/officials", icon: ShieldCheck },
      { label: "Results", href: "/organizer/results", icon: Medal },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Organization", href: "/organizer/register", icon: Building2 }],
  },
];

const statusTone: Record<string, string> = {
  PENDING: "text-amber-300",
  ACTIVE: "text-emerald-300",
  SUSPENDED: "text-rose-300",
  REJECTED: "text-rose-300",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "OP";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function OrganizerLayout() {
  const { session, logout } = useClientSession();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Organization | null>(null);
  const displayName = session?.fullName || "Organizer";

  useEffect(() => {
    let active = true;
    getMyOrganization()
      .then((data) => active && setOrg(data))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] bg-[#f7f4ee] font-sans text-[#211d1a] antialiased">
      {/* ── Header ───────────────────────────────────────────── */}
      <header
        aria-label="Organizer workspace header"
        className="sticky top-0 z-30 border-b border-[#e7e0d3] bg-[#fdfbf6]/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8 lg:py-4"
      >
        <div className="mx-auto grid max-w-[1560px] gap-3 md:grid-cols-[minmax(240px,300px)_minmax(280px,1fr)_auto] md:items-center">
          <Link
            to="/organizer"
            className="flex w-fit items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#bb8a3c]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1c1816] font-display text-lg font-semibold text-[#cfa24f] sm:h-12 sm:w-12">
              ◆
            </div>
            <div>
              <p className="font-display text-lg font-semibold leading-none tracking-tight text-[#211d1a] sm:text-xl">
                Race Office
              </p>
              <p className="mt-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#a8801f] sm:text-[11px]">
                Organizer Workspace
              </p>
            </div>
          </Link>

          <form className="relative hidden md:block" role="search">
            <label className="sr-only" htmlFor="organizer-search">
              Search the workspace
            </label>
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b3a892]" />
            <input
              className="h-12 w-full rounded-lg border border-[#e2d9c8] bg-white pl-12 pr-4 text-sm font-semibold text-[#3a342d] outline-none transition placeholder:text-[#b3a892] focus:border-[#bb8a3c] focus:ring-2 focus:ring-[#bb8a3c]/20"
              id="organizer-search"
              placeholder="Search your tournaments..."
              type="search"
            />
          </form>

          <div className="absolute right-4 top-3 flex items-center gap-2 md:static md:justify-end">
            <div className="hidden min-h-12 items-center gap-3 rounded-lg border border-[#e7e0d3] bg-white px-4 text-sm font-black text-[#3a342d] sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f3ead6] text-xs text-[#8a6a1c]">
                {getInitials(displayName)}
              </span>
              <span className="max-w-44 truncate">{displayName}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1c1816] px-3 text-sm font-black text-[#f7f4ee] transition hover:bg-[#2a241f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bb8a3c] sm:min-h-12 sm:px-5"
            >
              <LogOut aria-hidden="true" className="h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside className="hidden bg-[#1c1816] text-[#efe9df] lg:sticky lg:top-[81px] lg:block lg:h-[calc(100dvh-81px)] lg:border-r lg:border-black/30">
          <div className="border-b border-white/10 p-5">
            <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#cfa24f]">Organization</p>
              <p className="mt-3 truncate font-display text-lg font-semibold text-white">
                {org?.name ?? displayName}
              </p>
              <p className={`mt-1 text-xs font-bold uppercase tracking-[0.12em] ${org ? statusTone[org.status] ?? "text-white/60" : "text-white/40"}`}>
                {org ? org.status : "Loading…"}
              </p>
            </div>
          </div>

          <nav aria-label="Organizer workspace" className="space-y-7 p-5">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">{section.label}</p>
                <div className="mt-3 space-y-1.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        to={item.href}
                        key={item.href}
                        end={item.end}
                        className={({ isActive }) =>
                          [
                            "flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cfa24f]",
                            isActive
                              ? "bg-[#bb8a3c] text-[#1c1816] shadow-sm"
                              : "text-white/70 hover:bg-white/[0.07] hover:text-white",
                          ].join(" ")
                        }
                      >
                        <Icon aria-hidden="true" className="h-5 w-5" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto p-5">
            <Link to="/" className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 transition hover:text-white/70">
              ← Back to public site
            </Link>
          </div>
        </aside>

        {/* ── Content ───────────────────────────────────────── */}
        <main className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:py-9">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile nav ────────────────────────────────────────── */}
      <nav
        aria-label="Organizer mobile navigation"
        className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-black/20 bg-[#1c1816]/96 p-2 shadow-[0_18px_60px_rgba(28,24,22,0.3)] backdrop-blur-md lg:hidden"
      >
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navSections.flatMap((section) => section.items).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "flex min-h-[58px] min-w-[64px] flex-1 shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-black transition",
                    isActive ? "bg-[#bb8a3c] text-[#1c1816]" : "text-white/70 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
