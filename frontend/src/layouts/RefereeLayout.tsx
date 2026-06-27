import { useState } from "react";
import {
  ClipboardList,
  FileText,
  Gauge,
  LogOut,
  Search,
  ShieldCheck,
  UserRound,
  ChevronLeft,
  ChevronRight
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
        label: "Today's Races",
        href: "/referee/assigned-races",
        icon: ClipboardList,
      },
      {
        label: "Race Reports",
        href: "/referee/result-history",
        icon: ShieldCheck,
      },
      {
        label: "Contracts",
        href: "/referee/contracts",
        icon: FileText,
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

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("refereeSidebarCollapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("refereeSidebarCollapsed", String(next));
      return next;
    });
  };

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
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-sm font-black text-[#005f51] shrink-0 sm:h-12 sm:w-12">
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
            <span className="hidden min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 sm:inline-flex">
              <ShieldCheck className="h-4 w-4 text-[#007a68]" aria-hidden="true" />
              <span className="max-w-[180px] truncate">Referee</span>
            </span>
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

      <div className={`mx-auto grid max-w-[1680px] transition-[grid-template-columns] duration-300 ${isCollapsed ? 'lg:grid-cols-[80px_minmax(0,1fr)]' : 'lg:grid-cols-[318px_minmax(0,1fr)]'}`}>
        <aside className="relative hidden bg-[#062f2b] text-white lg:sticky lg:top-[81px] lg:block lg:h-[calc(100dvh-81px)] lg:border-r lg:border-emerald-950/40 z-20 transition-all duration-300">
          
          <div className="relative h-full w-full overflow-hidden">
            <div className="relative flex h-full flex-col">
              
              {/* Profile Card */}
              <div className={`border-b border-white/10 transition-all duration-300 ${isCollapsed ? 'p-3 flex justify-center border-none' : 'p-5 lg:block'}`}>
                <div className={`rounded-xl border border-white/5 bg-white/[0.04] p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300 whitespace-nowrap">
                      On Duty
                    </p>
                  </div>
                  <p className="mt-3 text-base font-black text-white leading-none whitespace-nowrap">{displayName}</p>
                  <p className="mt-1.5 text-xs font-semibold text-emerald-200/60 whitespace-nowrap">Race Day Official</p>
                </div>

                {isCollapsed && (
                  <div className="mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-black text-[#004d3d]">
                    {getInitials(displayName)}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <nav aria-label="Referee workspace" className={`p-5 space-y-7 transition-all duration-300 ${isCollapsed ? 'flex flex-col items-center space-y-4 px-0' : ''}`}>
                {refereeNavSections.map((section) => (
                  <div key={section.label} className={isCollapsed ? 'w-full flex flex-col items-center space-y-2' : ''}>
                    {!isCollapsed && (
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-300/50 whitespace-nowrap">
                        {section.label}
                      </p>
                    )}
                    <div className={`${isCollapsed ? 'space-y-2 flex flex-col items-center' : 'mt-3 space-y-2'}`}>
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            to={item.href}
                            key={item.href}
                            title={isCollapsed ? item.label : undefined}
                            className={({ isActive }) =>
                              [
                                "group flex min-h-12 items-center gap-3 rounded-lg text-sm font-black transition duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-250",
                                isActive
                                  ? "border-emerald-400 bg-[#00806d] text-white shadow-sm"
                                  : "border-transparent text-emerald-50/85 hover:bg-white/5 hover:text-white",
                                isCollapsed 
                                  ? "w-11 justify-center px-0 border-l-0" 
                                  : "border-l-4 pl-3.5 hover:translate-x-1",
                              ].join(" ")
                            }
                          >
                            <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Toggle Button (Desktop only) */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-[24px] top-16 z-30 hidden h-20 w-6 outline-none focus-visible:outline-none lg:block group"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {/* Custom Trapezoid Tab SVG (Dark Theme) */}
            <svg 
              viewBox="0 0 24 80" 
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 h-full w-full text-[#062f2b] drop-shadow-[4px_0_6px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:text-[#0a3f3a]"
            >
              {/* Main Background */}
              <path 
                d="M0 0 L16 10 Q24 12 24 22 L24 58 Q24 68 16 70 L0 80 Z" 
                fill="currentColor" 
              />
              {/* Outer Border */}
              <path 
                d="M0 0 L16 10 Q24 12 24 22 L24 58 Q24 68 16 70 L0 80" 
                fill="none" 
                stroke="#022c22" 
                strokeWidth="1.5"
              />
              {/* Inner Highlight */}
              <path 
                d="M0 2.5 L14 11.5 Q21 14 21 22 L21 58 Q21 66 14 68.5 L0 77.5" 
                fill="none" 
                stroke="#34d399" 
                strokeWidth="1.5"
                className="opacity-70 transition-opacity group-hover:opacity-100"
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

        <main className="min-w-0 bg-[#eef3f4] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Referee mobile navigation"
        className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-emerald-950/15 bg-[#062f2b]/96 p-2 shadow-[0_18px_60px_rgba(2,44,34,0.28)] backdrop-blur-md lg:hidden"
      >
        <div className="grid grid-cols-5 gap-1">
          {refereeNavSections.flatMap((section) => section.items).map((item) => {
            const Icon = item.icon;
            const mobileLabel = item.label === "Today's Races" ? "Races" : item.label === "Race Reports" ? "Reports" : item.label;
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
