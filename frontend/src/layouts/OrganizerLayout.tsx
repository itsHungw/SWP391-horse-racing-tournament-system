import { useEffect, useState } from "react";
import {
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Medal,
  Plus,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { getMyOrganization } from "../api/racingApi";
import { NotificationBell } from "../components/NotificationBell";
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
    label: "Championships",
    items: [
      { label: "My Championships", href: "/organizer/tournaments", icon: Trophy },
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

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("organizerSidebarCollapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("organizerSidebarCollapsed", String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="organizer-workspace-root min-h-[100dvh] bg-[#f7f4ee] font-sans text-[#211d1a] antialiased">
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



          <div className="absolute right-4 top-3 flex items-center gap-2 md:static md:justify-end">
            <NotificationBell />
            <Link
              to="/organizer/profile"
              className="hidden min-h-12 items-center gap-3 rounded-lg border border-[#e7e0d3] bg-white px-4 text-sm font-black text-[#3a342d] transition hover:border-[#bb8a3c] hover:bg-[#fdf8ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bb8a3c] sm:flex"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f3ead6] text-[#8a6a1c]">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="max-w-44 truncate">Organizer</span>
            </Link>
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

      <div className={`mx-auto grid min-h-[calc(100dvh-81px)] max-w-[1680px] transition-[grid-template-columns] duration-300 ${isCollapsed ? 'lg:grid-cols-[80px_1fr]' : 'lg:grid-cols-[300px_1fr]'}`}>
        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside className="organizer-sidebar-scrollbar relative hidden bg-[#1c1816] text-[#efe9df] transition-all duration-300 lg:sticky lg:top-[81px] lg:block lg:h-[calc(100dvh-81px)] lg:overflow-y-auto lg:border-r lg:border-black/30">
          <div className={`border-b border-white/10 transition-all duration-300 ${isCollapsed ? 'p-3 flex justify-center border-none' : 'p-5'}`}>
            <div className={`rounded-xl border border-white/10 bg-white/[0.05] p-4 transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#cfa24f]">Organization</p>
              <p className="mt-3 truncate font-display text-lg font-semibold text-white">
                {org?.name ?? displayName}
              </p>
              <p className={`mt-1 text-xs font-bold uppercase tracking-[0.12em] ${org ? statusTone[org.status] ?? "text-white/60" : "text-white/40"}`}>
                {org ? org.status : "Loading…"}
              </p>
            </div>
            {isCollapsed && (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] text-[#cfa24f] font-black text-sm" title={org?.name ?? displayName}>
                {org?.name ? org.name.substring(0, 2).toUpperCase() : displayName.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <nav aria-label="Organizer workspace" className={`space-y-7 p-5 transition-all duration-300 ${isCollapsed ? 'flex flex-col items-center px-0 space-y-5' : ''}`}>
            {navSections.map((section) => (
              <div key={section.label} className={isCollapsed ? 'w-full flex flex-col items-center' : ''}>
                {!isCollapsed && (
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">{section.label}</p>
                )}
                <div className={isCollapsed ? 'space-y-2 flex flex-col items-center' : 'mt-3 space-y-1.5'}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        to={item.href}
                        key={item.href}
                        end={item.end}
                        title={isCollapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          [
                            "flex min-h-11 items-center gap-3 rounded-lg text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cfa24f]",
                            isCollapsed ? "w-11 justify-center px-0" : "px-4 w-full",
                            isActive
                              ? "bg-[#bb8a3c] text-[#1c1816] shadow-sm"
                              : "text-white/70 hover:bg-white/[0.07] hover:text-white",
                          ].join(" ")
                        }
                      >
                        <Icon aria-hidden="true" className="h-5 w-5" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

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
              className="absolute inset-0 h-full w-full text-[#1c1816] drop-shadow-[4px_0_6px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:text-[#2a241f]"
            >
              {/* Main Background */}
              <path 
                d="M0 0 L16 10 Q24 12 24 22 L24 58 Q24 68 16 70 L0 80 Z" 
                fill="currentColor" 
              />
              {/* Outer Dark Border */}
              <path 
                d="M0 0 L16 10 Q24 12 24 22 L24 58 Q24 68 16 70 L0 80" 
                fill="none" 
                stroke="#0f0c0b" 
                strokeWidth="1.5"
              />
              {/* Inner Bright Highlight */}
              <path 
                d="M0 2.5 L14 11.5 Q21 14 21 22 L21 58 Q21 66 14 68.5 L0 77.5" 
                fill="none" 
                stroke="#bb8a3c" 
                strokeWidth="1.5"
                className="opacity-80 transition-opacity group-hover:opacity-100"
              />
            </svg>
            
            {/* Arrow Icon */}
            <div className="absolute inset-0 flex items-center justify-center pl-0.5 transition-transform duration-300 group-hover:scale-110">
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-[#f7f4ee] drop-shadow-md" strokeWidth={3} />
              ) : (
                <ChevronLeft className="h-4 w-4 text-[#f7f4ee] drop-shadow-md" strokeWidth={3} />
              )}
            </div>
          </button>
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
