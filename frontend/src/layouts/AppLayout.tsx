import { NavLink, Outlet } from "react-router-dom";

const navigationItems = [
  { label: "Public", to: "/" },
  { label: "Spectator", to: "/spectator" },
  { label: "Owner", to: "/owner" },
  { label: "Jockey", to: "/jockey" },
  { label: "Referee", to: "/referee" },
  { label: "Admin", to: "/admin" },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header
        aria-label="Horse Racing Tournament"
        className="border-b border-slate-200 bg-white"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium text-emerald-700">Tournament System</p>
            <h1 className="text-2xl font-semibold">Horse Racing Tournament</h1>
          </div>
          <nav aria-label="Primary" className="flex flex-wrap gap-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
                    isActive
                      ? "bg-emerald-700 text-white"
                      : "text-slate-700 hover:bg-slate-100",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
