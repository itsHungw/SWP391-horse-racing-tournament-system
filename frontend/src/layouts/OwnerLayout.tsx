import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  ClipboardList, 
  Gauge, 
  LogOut, 
  ShieldCheck, 
  Trophy, 
  User, 
  Workflow,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import logo from "../assets/logo.png";
import { useClientSession } from "../hooks/useClientSession";
import { NotificationBell } from "../components/NotificationBell";

type OwnerLayoutProps = {
  children: ReactNode;
};

const ownerNavItems = [
  { label: "Dashboard", href: "/owner/dashboard", icon: Gauge },
  { label: "Horse Roster", href: "/owner/horses", icon: Trophy },
  { label: "Tournament Registrations", href: "/owner/registrations", icon: ClipboardList },
  { label: "Jockey Invitations", href: "/owner/invitations", icon: Workflow },
  { label: "Profile", href: "/owner/profile", icon: User },
];

export function OwnerLayout({ children }: OwnerLayoutProps) {
  const navigate = useNavigate();
  const { logout, session } = useClientSession();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("ownerSidebarCollapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("ownerSidebarCollapsed", String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-[#f3f6f4] text-slate-950">
      <header aria-label="Owner workspace header" className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md" role="banner">
        <div className="mx-auto flex min-h-20 max-w-[1680px] items-center justify-between px-5">
          <a
            className="flex w-fit items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006d5b]"
            href="/"
            aria-label="EquinePro owner dashboard"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-emerald-900/10 bg-emerald-50 shrink-0">
              <img
                alt=""
                className="h-12 w-12 object-contain brightness-0"
                src={logo}
              />
            </span>
            <div>
              <p className="text-xl font-black tracking-tight text-slate-950">Owner Workspace</p>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#006d5b]">Stable operations</p>
            </div>
          </a>

          <div className="flex flex-wrap items-center gap-3">
            <NotificationBell theme="owner" />
            <span className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-[#006d5b]" aria-hidden="true" />
              <span className="max-w-[180px] truncate">Horse Owner</span>
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

      <div className={`mx-auto grid min-h-[calc(100dvh-81px)] max-w-[1680px] transition-[grid-template-columns] duration-300 ${isCollapsed ? 'lg:grid-cols-[80px_1fr]' : 'lg:grid-cols-[268px_1fr]'}`}>
        <aside className="relative border-b border-slate-200 bg-white lg:sticky lg:top-[81px] lg:block lg:h-[calc(100dvh-81px)] lg:border-b-0 lg:border-r z-20 transition-all duration-300">
          
          <div className="relative h-full w-full overflow-hidden">
            <div className="relative flex h-full flex-col py-6 px-3">
              <nav aria-label="Owner workspace" className={`no-scrollbar flex overflow-x-auto lg:overflow-visible transition-all duration-300 ${isCollapsed ? 'lg:flex lg:flex-col lg:items-center' : 'lg:block lg:space-y-1.5'}`}>
                {ownerNavItems.map((item) => (
                  <NavLink
                    className={({ isActive }) =>
                      [
                        "flex min-h-11 items-center gap-3 rounded-md text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]",
                        isActive
                          ? "bg-[#006d5b] text-white shadow-sm shadow-emerald-950/10"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
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
            </div>
          </div>

          {/* Toggle Button (Desktop only) */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-[24px] top-16 z-30 hidden h-20 w-6 outline-none focus-visible:outline-none lg:block group"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {/* Custom Trapezoid Tab SVG (Light Theme) */}
            <svg 
              viewBox="0 0 24 80" 
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 h-full w-full text-white drop-shadow-[4px_0_6px_rgba(0,0,0,0.08)] transition-all duration-300 group-hover:text-slate-50"
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
                stroke="#cbd5e1" 
                strokeWidth="1.5"
              />
              {/* Inner Highlight */}
              <path 
                d="M0 2.5 L14 11.5 Q21 14 21 22 L21 58 Q21 66 14 68.5 L0 77.5" 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="1.5"
                className="opacity-80 transition-opacity group-hover:opacity-100"
              />
            </svg>
            
            {/* Arrow Icon */}
            <div className="absolute inset-0 flex items-center justify-center pl-0.5 transition-transform duration-300 group-hover:scale-110">
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-slate-400 drop-shadow-sm group-hover:text-slate-700" strokeWidth={3} />
              ) : (
                <ChevronLeft className="h-4 w-4 text-slate-400 drop-shadow-sm group-hover:text-slate-700" strokeWidth={3} />
              )}
            </div>
          </button>
        </aside>

        <main className="min-w-0 px-5 py-6 sm:px-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
