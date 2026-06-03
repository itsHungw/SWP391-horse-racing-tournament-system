import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { CalendarDays, FileCheck2, Gauge, LogOut, Search, ShieldCheck, Trophy, UserRound } from "lucide-react";

import logo from "../assets/logo.png";
import racingImage from "../assets/slide.jpg";
import { getNextRound, jockeyChampionships } from "../pages/jockey/jockeyWorkspaceData";
import { useClientSession } from "../hooks/useClientSession";

type JockeyLayoutProps = {
  children: ReactNode;
};

const jockeyNavItems = [
  { label: "Dashboard", href: "/jockey/dashboard", icon: Gauge },
  { label: "Championships", href: "/jockey/championships", icon: Trophy },
  { label: "Contracts", href: "/jockey/contracts", icon: FileCheck2 },
  { label: "Schedule", href: "/jockey/schedule", icon: CalendarDays },
  { label: "Racing Passport", href: "/jockey/profile", icon: UserRound },
];

export function JockeyLayout({ children }: JockeyLayoutProps) {
  const navigate = useNavigate();
  const { logout, session } = useClientSession();
  const currentAssignment = jockeyChampionships[0];
  const nextRound = getNextRound(currentAssignment.id);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-[#f4f7f5] text-slate-950">
      <header
        aria-label="Jockey workspace header"
        className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/88 backdrop-blur-md"
        role="banner"
      >
        <div className="mx-auto flex min-h-20 max-w-[1720px] flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <a
            aria-label="EquinePro jockey dashboard"
            className="flex w-fit items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006d5b]"
            href="/jockey/dashboard"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-emerald-900/10 bg-emerald-50">
              <img alt="" className="h-12 w-12 object-contain brightness-0" src={logo} />
            </span>
            <div>
              <p className="text-xl font-black tracking-tight text-slate-950">Aqueduct Racetrack</p>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]">Racing Cockpit</p>
            </div>
          </a>

          <label className="relative w-full max-w-xl text-sm font-bold text-slate-700">
            <span className="sr-only">Search jockey workspace</span>
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              className="min-h-11 w-full rounded-md border border-slate-300 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              placeholder="Search championships, contracts, rounds..."
              type="search"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-[#006d5b]" aria-hidden="true" />
              <span className="max-w-[190px] truncate">{session?.fullName || "Nguyen Van A"}</span>
            </span>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-black text-white hover:bg-[#006d5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
              onClick={handleLogout}
              type="button"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-81px)] max-w-[1720px] lg:grid-cols-[292px_1fr]">
        <aside className="relative overflow-hidden border-b border-emerald-950/20 bg-[#002d25] text-white lg:sticky lg:top-[81px] lg:h-[calc(100dvh-81px)] lg:border-b-0 lg:border-r">
          <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.12]" src={racingImage} />
          <div className="absolute inset-0 bg-[#002d25]/90" />
          <div className="relative p-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">Racing Cockpit</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-100 text-xl font-black text-[#004d3d]">
                  NA
                </div>
                <div>
                  <p className="font-black">Nguyen Van A</p>
                  <p className="text-sm font-bold text-emerald-100">Professional Jockey</p>
                  <span className="mt-2 inline-flex rounded-md bg-emerald-400/15 px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-100">
                    Active
                  </span>
                </div>
              </div>
            </div>

            <nav aria-label="Jockey workspace" className="mt-4 flex gap-2 overflow-x-auto lg:block lg:space-y-1.5">
              {jockeyNavItems.map((item) => (
                <NavLink
                  className={({ isActive }) =>
                    [
                      "flex min-h-11 min-w-max items-center gap-3 rounded-md px-4 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200",
                      isActive
                        ? "bg-[#006d5b] text-white shadow-sm shadow-emerald-950/20"
                        : "text-emerald-50/85 hover:bg-white/10 hover:text-white",
                    ].join(" ")
                  }
                  key={item.href}
                  to={item.href}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <section className="mt-8 hidden rounded-lg border border-white/10 bg-white/5 p-4 lg:block" aria-label="Current Assignment">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">Current Assignment</p>
                <Trophy className="h-4 w-4 text-emerald-100" aria-hidden="true" />
              </div>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    {/* <img
                      alt={`${currentAssignment.horse} horse thumbnail`}
                      className="h-14 w-14 rounded-md border border-white/15 object-cover"
                      src={racingImage}
                    /> */}
                    <div>
                      <dt className="text-emerald-100/80">Horse</dt>
                      <dd className="mt-1 text-2xl font-black leading-none">{currentAssignment.horse}</dd>
                    </div>
                  </div>
                  <dt className="mt-3 text-emerald-100/80">Championship</dt>
                  <dd className="mt-1 text-sm font-black leading-5">{currentAssignment.name}</dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-emerald-100/80">Next Race</dt>
                    <dd className="mt-1 text-sm font-black leading-5">{nextRound ? "Jun 6" : "TBD"}</dd>
                  </div>
                  <div>
                    <dt className="text-emerald-100/80">Status</dt>
                    <dd className="mt-1 text-sm font-black leading-5">{currentAssignment.commitmentStatus}</dd>
                  </div>
                </div>
              </dl>
            </section>
          </div>
        </aside>

        <main className="min-w-0 px-5 py-6 sm:px-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
