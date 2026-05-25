import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";
import { useClientSession } from "../hooks/useClientSession";

type AdminLayoutProps = {
  children: ReactNode;
};

const adminNavItems = [
  { label: "Overview", href: "/admin", marker: "R" },
  { label: "Role Requests", href: "/admin/role-requests", marker: "RQ" },
  { label: "Users", href: "/admin/users", marker: "U" },
  { label: "Tournaments", href: "/admin/tournaments", marker: "T" },
  { label: "Races", href: "/admin/races", marker: "RA" },
  { label: "Predictions", href: "/admin/predictions", marker: "P" },
  { label: "Blog", href: "/admin/blog", marker: "B" },
  { label: "Points", href: "/admin/points", marker: "PT" },
  { label: "Settings", href: "/admin/settings", marker: "S" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { logout, session } = useClientSession();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#e9eaec] text-[#161616]">
      <div className="mx-auto min-h-screen max-w-[1680px] bg-[#f5f5f5] shadow-sm">
        <header
          aria-label="Admin operations header"
          className="border-b border-[#d8d8d8] bg-white"
          role="banner"
        >
          <div className="flex min-h-20 flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <a className="flex items-center gap-3" href="/admin" aria-label="EquinePro admin home">
              <img alt="" className="h-10 w-10 object-contain" src={logo} />
              <div>
                <p className="text-3xl font-black lowercase italic tracking-tight text-[#b3193a]">
                  equinepro
                </p>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  tournament control
                </p>
              </div>
            </a>

            <form className="w-full max-w-[560px]" role="search">
              <label className="sr-only" htmlFor="admin-search">
                Search admin workspace
              </label>
              <input
                className="h-11 w-full rounded-full border border-[#111] bg-white px-5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#b3193a]"
                id="admin-search"
                placeholder="Search users, tournaments, races, role requests..."
                type="search"
              />
            </form>

            <div className="flex items-center gap-3">
              <a
                className="flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
                href="/profile"
              >
                {session?.fullName || "Profile"}
              </a>
              <button
                className="min-h-11 rounded-full bg-[#070f4f] px-5 text-sm font-bold text-white hover:bg-[#101a70] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="grid min-h-[calc(100vh-81px)] lg:grid-cols-[238px_1fr]">
          <aside className="border-b border-[#d8d8d8] bg-[#f1f1f1] lg:border-b-0 lg:border-r">
            <nav aria-label="Admin workspace" className="flex overflow-x-auto lg:block">
              {adminNavItems.map((item) => (
                <NavLink
                  className={({ isActive }) =>
                    [
                      "flex min-h-14 min-w-max items-center gap-3 border-r border-[#dddddd] px-4 text-sm font-bold lg:border-r-0 lg:border-b",
                      isActive
                        ? "bg-white text-[#b3193a] shadow-[inset_4px_0_0_#b3193a]"
                        : "text-[#171717] hover:bg-white",
                    ].join(" ")
                  }
                  end={item.href === "/admin"}
                  key={item.href}
                  to={item.href}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-7 min-w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-black"
                  >
                    {item.marker}
                  </span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 bg-white px-5 py-6 sm:px-7 lg:bg-[#f5f5f5] lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
