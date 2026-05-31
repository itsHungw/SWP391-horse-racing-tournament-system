import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ClipboardList, Gauge, LogOut, Search, ShieldCheck, Trophy, User, Workflow } from "lucide-react";

import logo from "../assets/logo.png";
import { useClientSession } from "../hooks/useClientSession";

type OwnerLayoutProps = {
  children: ReactNode;
};

const ownerNavItems = [
  { label: "Dashboard", href: "/owner/dashboard", icon: Gauge },
  { label: "Horse Roster", href: "/owner/horses", icon: Trophy },
  { label: "Tournament Registrations", href: "/owner/registrations", icon: ClipboardList },
  { label: "Profile", href: "/owner/profile", icon: User },
];

export function OwnerLayout({ children }: OwnerLayoutProps) {
  const navigate = useNavigate();
  const { logout, session } = useClientSession();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-[#f3f6f4] text-slate-950">
      <header aria-label="Owner workspace header" className="border-b border-slate-200/80 bg-white" role="banner">
        <div className="mx-auto flex min-h-20 max-w-[1680px] flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <a
            className="flex w-fit items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006d5b]"
            href="/owner/dashboard"
            aria-label="EquinePro owner dashboard"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-emerald-900/10 bg-emerald-50">
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

          <label className="relative w-full max-w-xl text-sm font-bold text-slate-700">
            <span className="sr-only">Search owner workspace</span>
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              className="min-h-11 w-full rounded-md border border-slate-300 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
              placeholder="Search horses, tournaments..."
              type="search"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-[#006d5b]" aria-hidden="true" />
              <span className="max-w-[180px] truncate">{session?.fullName || "Horse Owner"}</span>
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

      <div className="mx-auto grid min-h-[calc(100dvh-81px)] max-w-[1680px] lg:grid-cols-[268px_1fr]">
        <aside className="border-b border-slate-200 bg-white/75 lg:border-b-0 lg:border-r">
          <nav aria-label="Owner workspace" className="flex overflow-x-auto p-3 lg:block lg:space-y-1.5">
            {ownerNavItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  [
                    "flex min-h-11 min-w-max items-center gap-3 rounded-md px-4 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]",
                    isActive
                      ? "bg-[#006d5b] text-white shadow-sm shadow-emerald-950/10"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                  ].join(" ")
                }
                key={item.href}
                to={item.href}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
            <div className="hidden border-t border-slate-200 pt-3 lg:mt-3 lg:block">
              <div className="flex min-h-11 items-center gap-3 rounded-md px-4 text-sm font-bold text-slate-400">
                <Workflow className="h-5 w-5" aria-hidden="true" />
                Jockey Invitations
              </div>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 px-5 py-6 sm:px-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
