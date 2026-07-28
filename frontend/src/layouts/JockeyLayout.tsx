import { ReactNode, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { 
  CalendarDays, 
  CheckCircle2, 
  FileCheck2, 
  Gauge, 
  LogOut, 
  Search, 
  ShieldCheck, 
  Trophy, 
  UserRound,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import racingImage from "../assets/slide.jpg";
import { useClientSession } from "../hooks/useClientSession";
import { NotificationBell } from "../components/NotificationBell";

type JockeyLayoutProps = {
  children: ReactNode;
  sidebarPanel?: ReactNode;
};

const jockeyNavItems = [
  { label: "Dashboard", href: "/jockey/dashboard", icon: Gauge },
  { label: "Championships", href: "/jockey/championships", icon: Trophy },
  { label: "Contracts", href: "/jockey/contracts", icon: FileCheck2 },
  { label: "Schedule", href: "/jockey/schedule", icon: CalendarDays },
  { label: "Racing Passport", href: "/jockey/profile", icon: UserRound },
];

export function JockeyLayout({ children, sidebarPanel }: JockeyLayoutProps) {
  const navigate = useNavigate();
  const { logout, session } = useClientSession();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("jockeySidebarCollapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("jockeySidebarCollapsed", String(next));
      return next;
    });
  };

  const displayName = session?.fullName || "Jockey";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "J";

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
          <Link
            aria-label="Aqueduct jockey dashboard"
            className="group flex w-fit flex-col justify-center rounded-xl p-2 transition-colors hover:bg-emerald-950/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006d5b]"
            to="/"
          >
            <div className="mb-1 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[#006d5b]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#006d5b]"></span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                  Racing Cockpit
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-black leading-none tracking-tight text-slate-950 drop-shadow-sm">
              AQUEDUCT
            </h1>
          </Link>

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
            <NotificationBell theme="jockey" />
            <span className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-[#006d5b]" aria-hidden="true" />
              <span className="max-w-[190px] truncate">Jockey</span>
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

      <div className={`mx-auto grid min-h-[calc(100dvh-81px)] max-w-[1720px] transition-[grid-template-columns] duration-300 ${isCollapsed ? 'lg:grid-cols-[80px_1fr]' : 'lg:grid-cols-[292px_1fr]'}`}>
        <aside className="relative border-b border-emerald-950/20 bg-[#002d25] text-white lg:sticky lg:top-[81px] lg:h-[calc(100dvh-81px)] lg:border-b-0 lg:border-r z-20 transition-all duration-300">
          
          <div className="relative h-full w-full overflow-hidden">
            {/* Background Image Container */}
            <div className="absolute inset-0 pointer-events-none">
              <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.12]" src={racingImage} />
              <div className="absolute inset-0 bg-[#002d25]/90" />
            </div>

            {/* Inner Content Wrapper */}
            <div className="relative flex h-full flex-col p-4">
              {/* Profile Block */}
              <div className={`rounded-xl border border-white/10 bg-white/5 transition-all duration-300 ${isCollapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
                {!isCollapsed && <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100 whitespace-nowrap">Racing Cockpit</p>}
                <div className={`flex items-center gap-3 ${!isCollapsed ? 'mt-4' : ''}`}>
                  <div className={`flex shrink-0 items-center justify-center rounded-lg bg-emerald-100 font-black text-[#004d3d] transition-all duration-300 ${isCollapsed ? 'h-10 w-10 text-sm' : 'h-12 w-12 text-xl'}`}>
                    {initials}
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0">
                      <p className="truncate font-black whitespace-nowrap">{displayName}</p>
                      <p className="truncate text-sm font-bold text-emerald-100 whitespace-nowrap">Professional Jockey</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <nav aria-label="Jockey workspace" className={`mt-5 flex gap-2 overflow-x-auto lg:overflow-visible transition-all duration-300 ${isCollapsed ? 'lg:flex lg:flex-col lg:items-center' : 'lg:block lg:space-y-1.5'}`}>
                {jockeyNavItems.map((item) => (
                  <NavLink
                    className={({ isActive }) =>
                      [
                        "flex min-h-11 items-center gap-3 rounded-lg text-sm font-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200",
                        isActive
                          ? "bg-[#006d5b] text-white shadow-sm shadow-emerald-950/20"
                          : "text-emerald-50/85 hover:bg-white/10 hover:text-white",
                        isCollapsed ? "w-11 justify-center px-0" : "min-w-max px-4",
                      ].join(" ")
                    }
                    key={item.href}
                    to={item.href}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  </NavLink>
                ))}
              </nav>

              {/* Pool Workflow */}
              {!isCollapsed && (sidebarPanel ?? (
                <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 hidden lg:block" aria-label="Pool workflow">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100 whitespace-nowrap">Pool Workflow</p>
                    <Trophy className="h-4 w-4 shrink-0 text-emerald-100" aria-hidden="true" />
                  </div>
                  <ol className="mt-4 grid gap-3 text-sm">
                    {["Apply to pool", "Admin review", "Owner contract", "Participant lock"].map((step, index) => (
                      <li className="flex items-center gap-3 border-b border-white/10 pb-3 last:border-b-0 last:pb-0" key={step}>
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-black text-emerald-100">
                          {index < 2 ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : index + 1}
                        </span>
                        <span className="font-black leading-5 text-emerald-50 whitespace-nowrap">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-4 text-xs font-bold leading-5 text-emerald-100/80">
                    Horse, rank, and points appear after an official participant and standings exist.
                  </p>
                </section>
              ))}
            </div>
          </div>

          {/* Toggle Button (Desktop only) */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-[24px] top-16 z-30 hidden h-20 w-6 outline-none focus-visible:outline-none lg:block group"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {/* Custom Trapezoid Tab SVG */}
            <svg 
              viewBox="0 0 24 80" 
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 h-full w-full text-[#002d25] drop-shadow-[4px_0_6px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:text-[#003b30]"
            >
              {/* Main Background */}
              <path 
                d="M0 0 L16 10 Q24 12 24 22 L24 58 Q24 68 16 70 L0 80 Z" 
                fill="currentColor" 
              />
              {/* Outer Dark Border (Top, Right, Bottom) */}
              <path 
                d="M0 0 L16 10 Q24 12 24 22 L24 58 Q24 68 16 70 L0 80" 
                fill="none" 
                stroke="#064e3b" 
                strokeWidth="1.5"
              />
              {/* Inner Bright Highlight (Top, Right, Bottom) */}
              <path 
                d="M0 2.5 L14 11.5 Q21 14 21 22 L21 58 Q21 66 14 68.5 L0 77.5" 
                fill="none" 
                stroke="#34d399" 
                strokeWidth="1.5"
                className="opacity-80 transition-opacity group-hover:opacity-100"
              />
            </svg>
            
            {/* Arrow Icon */}
            <div className="absolute inset-0 flex items-center justify-center pl-0.5 transition-transform duration-300 group-hover:scale-110">
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-emerald-100 drop-shadow-md" strokeWidth={3} />
              ) : (
                <ChevronLeft className="h-4 w-4 text-emerald-100 drop-shadow-md" strokeWidth={3} />
              )}
            </div>
          </button>
        </aside>

        <main className="min-w-0 px-5 py-6 sm:px-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
