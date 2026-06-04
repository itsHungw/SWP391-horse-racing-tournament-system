import {
  ClipboardList,
  Gauge,
  LogOut,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useClientSession } from "../hooks/useClientSession";

const refereeNavSections = [
  {
    label: "Command",
    items: [
      {
        label: "Dashboard",
        href: "/referee/dashboard",
        icon: Gauge,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Assigned Races",
        href: "/referee/assigned-races",
        icon: ClipboardList,
      },
      {
        label: "Result Packages",
        href: "/referee/result-history",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Profile",
        href: "/referee/profile",
        icon: UserRound,
      },
    ],
  },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RF";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function RefereeLayout() {
  const { session } = useClientSession();
  const displayName = session?.fullName || "Assigned official";

  return (
    <div className="min-h-[100dvh] bg-[#eef3f4] font-sans text-slate-950 antialiased">
      <header
        aria-label="Referee workspace header"
        className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/86 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-md sm:px-6 lg:px-8 lg:py-4"
      >
        <div className="mx-auto grid max-w-[1560px] gap-3 md:grid-cols-[minmax(240px,300px)_minmax(320px,760px)_auto] md:items-center">
          <Link
            to="/referee/dashboard"
            className="flex w-fit items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#007a68]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-sm font-black text-[#005f51] sm:h-12 sm:w-12">
              RC
            </div>
            <div>
              <p className="text-lg font-black leading-none tracking-tight text-slate-950 sm:text-xl">
                Race Control
              </p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#007a68] sm:text-[11px] sm:tracking-[0.28em]">
                Referee Workspace
              </p>
            </div>
          </Link>

          <form className="relative hidden md:block" role="search">
            <label className="sr-only" htmlFor="referee-workspace-search">
              Search referee workspace
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            />
            <input
              className="h-12 w-full rounded-lg border border-slate-300 bg-white/80 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20"
              id="referee-workspace-search"
              placeholder="Search races, result packages, incidents..."
              type="search"
            />
          </form>

          <div className="absolute right-4 top-3 flex items-center gap-2 md:static md:justify-end">
            <div className="hidden min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 shadow-sm sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#e8fbf4] text-xs text-[#006f5f]">
                {getInitials(displayName)}
              </span>
              <span className="max-w-44 truncate">{displayName}</span>
            </div>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#06145f] px-3 text-sm font-black text-white shadow-sm transition hover:bg-[#091b7c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68] sm:min-h-12 sm:px-5"
            >
              <LogOut aria-hidden="true" className="h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] lg:grid-cols-[318px_minmax(0,1fr)]">
        <aside className="hidden bg-[#062f2b] text-white lg:sticky lg:top-[81px] lg:block lg:h-[calc(100dvh-81px)] lg:border-r lg:border-emerald-950/40">
          <div className="hidden border-b border-white/10 p-5 lg:block">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-100">
                On Duty
              </p>
              <p className="mt-3 text-lg font-black text-white">{displayName}</p>
              <p className="mt-1 text-sm font-semibold text-emerald-100">Race Day Official</p>
            </div>
          </div>

          <nav aria-label="Referee workspace" className="space-y-7 p-5">
            {refereeNavSections.map((section) => (
              <div key={section.label}>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200/70">
                  {section.label}
                </p>
                <div className="mt-3 space-y-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        to={item.href}
                        key={item.href}
                        className={({ isActive }) =>
                          [
                            "flex min-h-12 items-center gap-3 rounded-lg px-4 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200",
                            isActive
                              ? "bg-[#00806d] text-white shadow-sm"
                              : "text-emerald-50/85 hover:bg-white/10 hover:text-white",
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
        </aside>

        <main className="min-w-0 bg-[#eef3f4] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Referee mobile navigation"
        className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-emerald-950/15 bg-[#062f2b]/96 p-2 shadow-[0_18px_60px_rgba(2,44,34,0.28)] backdrop-blur-md lg:hidden"
      >
        <div className="grid grid-cols-4 gap-1">
          {refereeNavSections.flatMap((section) => section.items).map((item) => {
            const Icon = item.icon;
            const mobileLabel = item.label === "Assigned Races" ? "Races" : item.label === "Result Packages" ? "Packages" : item.label;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  [
                    "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200",
                    isActive ? "bg-[#00806d] text-white shadow-sm" : "text-emerald-50/80 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                <span className="truncate">{mobileLabel}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
