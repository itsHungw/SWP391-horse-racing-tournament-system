import { Link, NavLink, Outlet } from "react-router-dom";
import { useClientSession } from "../hooks/useClientSession";

export function RefereeLayout() {
  const { session } = useClientSession();

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between">
        <div>
          <div className="px-6 py-5 border-b border-slate-100 mb-6">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WORKSPACE</div>
            <div className="text-sm text-[#004d3d] font-semibold mt-1 flex items-center gap-2">
              <span>🛡️ Head Referee</span>
            </div>
          </div>
          <nav className="flex flex-col gap-1 px-3">
            <NavLink
              to="/referee"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#004d3d] text-white font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <span>🏁</span> Assigned Races
            </NavLink>
            <NavLink
              to="/referee/pre-checks"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#004d3d] text-white font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <span>📋</span> Pre-Race Checks
            </NavLink>
            <NavLink
              to="/referee/results"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#004d3d] text-white font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <span>🏆</span> Submit Results
            </NavLink>
            <NavLink
              to="/referee/reports"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#004d3d] text-white font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <span>🚨</span> Reports & Violations
            </NavLink>
          </nav>
        </div>
        <div className="p-6 border-t border-slate-100 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          EquinePro Elite v2.0
        </div>
      </aside>

      {/* Content Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <strong className="text-sm font-bold uppercase tracking-wider text-slate-900">
              EQUINEPRO ELITE — REFEREE PORTAL
            </strong>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-600">
              Referee: <strong className="text-slate-900 font-semibold">{session?.fullName}</strong>
            </span>
            <Link
              to="/"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 border border-slate-300 rounded-md transition-colors text-xs"
            >
              Exit Dashboard
            </Link>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
