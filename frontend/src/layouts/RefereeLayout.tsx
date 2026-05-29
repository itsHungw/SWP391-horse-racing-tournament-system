import { Link, NavLink, Outlet } from "react-router-dom";
import { useClientSession } from "../hooks/useClientSession";

const refereeNavItems = [
  {
    label: "Assigned Races",
    href: "/referee",
    icon: "gauge",
    end: true,
  },
  {
    label: "Pre-Race Checks",
    href: "/referee/pre-checks",
    icon: "clipboard",
  },
  {
    label: "Submit Results",
    href: "/referee/results",
    icon: "trophy",
  },
  {
    label: "Reports & Violations",
    href: "/referee/reports",
    icon: "report",
  },
];

function NavIcon({ type }: { type: string }) {
  const common = {
    className: "h-6 w-6",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  if (type === "clipboard") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M9 5h6" />
        <path d="M9 3h6v4H9z" />
        <path d="M7 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    );
  }

  if (type === "trophy") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M8 4h8v4a4 4 0 0 1-8 0z" />
        <path d="M8 6H5a2 2 0 0 0 0 4h3" />
        <path d="M16 6h3a2 2 0 0 1 0 4h-3" />
        <path d="M12 12v5" />
        <path d="M9 21h6" />
        <path d="M10 17h4" />
      </svg>
    );
  }

  if (type === "report") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M6 4h9l3 3v13H6z" />
        <path d="M15 4v4h4" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...common}>
      <path d="M4 14a8 8 0 0 1 16 0" />
      <path d="M12 14l4-4" />
      <path d="M6.5 18h11" />
    </svg>
  );
}

export function RefereeLayout() {
  const { session } = useClientSession();

  return (
    <div className="min-h-screen bg-[#eef3f4] font-sans antialiased text-slate-900">
      <header
        aria-label="Referee workspace header"
        className="border-b border-slate-200 bg-white px-5 py-5 lg:px-12"
        role="banner"
      >
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[280px_minmax(320px,760px)_auto] lg:items-center lg:gap-8">
          <Link
            to="/referee"
            className="w-fit rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#007a68]"
          >
            <h1 className="text-3xl font-black leading-none tracking-tight text-[#006f5f]">
              Referee Workspace
            </h1>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.32em] text-slate-500">
              RACE OPERATIONS
            </p>
          </Link>

          <form className="relative" role="search">
            <label className="sr-only" htmlFor="referee-workspace-search">
              Search referee workspace
            </label>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              className="h-14 w-full rounded-md border border-slate-300 bg-[#fbfbff] pl-12 pr-4 text-base font-semibold text-slate-800 outline-none transition focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20"
              id="referee-workspace-search"
              placeholder="Search races, checks, reports..."
              type="search"
            />
          </form>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            <div className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-200 bg-[#fbfbff] px-5 text-sm font-black text-slate-800 shadow-sm">
              {session?.fullName || "Assigned official"}
            </div>
            <Link
              to="/"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-[#06145f] px-5 text-sm font-black text-white shadow-sm transition-colors hover:bg-[#091b7c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M21 4v16" />
              </svg>
              Logout
            </Link>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-101px)] lg:grid-cols-[318px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-[#f6fbfc] lg:border-b-0 lg:border-r">
          <nav aria-label="Referee workspace" className="flex gap-2 overflow-x-auto p-2 lg:block lg:space-y-2 lg:p-4">
            {refereeNavItems.map((item) => (
              <NavLink
                to={item.href}
                end={item.end}
                key={item.href}
                className={({ isActive }) =>
                  [
                    "flex min-h-14 min-w-max items-center gap-4 rounded-md px-5 text-base font-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68] lg:min-w-0",
                    isActive
                      ? "bg-[#007a68] text-white shadow-sm"
                      : "text-slate-700 hover:bg-white hover:text-[#006f5f]",
                  ].join(" ")
                }
              >
                <NavIcon type={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 overflow-y-auto bg-[#eef3f4] px-5 py-8 sm:px-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
