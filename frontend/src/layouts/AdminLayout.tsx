import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Trophy,
  Compass,
  FileText,
  Building2,
  Wallet,
  MessageSquareWarning,
  Landmark,
  ReceiptText,
  RefreshCw,
} from "lucide-react";

import logo from "../assets/logo.png";
import { useClientSession } from "../hooks/useClientSession";
import { NotificationBell } from "../components/NotificationBell";

type AdminLayoutProps = {
  children: ReactNode;
};

const adminNavGroups = [
  {
    label: "OPERATIONS",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Championships", href: "/admin/tournaments", icon: Trophy },
      { label: "Disputes", href: "/admin/disputes", icon: MessageSquareWarning },
    ],
  },
  {
    label: "PEOPLE",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Organizations", href: "/admin/organizations", icon: Building2 },
      { label: "Role Requests", href: "/admin/role-requests", icon: UserCheck },
      { label: "Horse Approvals", href: "/admin/horses", icon: Trophy },
    ],
  },
  {
    label: "ENGAGEMENT",
    items: [
      { label: "Predictions", href: "/admin/predictions", icon: Compass },
      { label: "Blog", href: "/admin/blog", icon: FileText },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { label: "Overview", href: "/admin/finance", icon: Landmark, end: true },
      { label: "Transactions", href: "/admin/finance/transactions", icon: ReceiptText },
      { label: "Top-up Reconciliation", href: "/admin/finance/topups", icon: RefreshCw },
      { label: "Withdrawals", href: "/admin/withdrawals", icon: Wallet },
    ],
  },
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
          className="sticky top-0 z-40 border-b border-[#d8d8d8] bg-white/90 backdrop-blur-md"
          role="banner"
        >
          <div className="flex min-h-20 flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <a className="flex items-center gap-3" href="/admin" aria-label="Aqueduct admin home">
              <img alt="" className="h-10 w-10 object-contain" src={logo} />
              <div>
                <p className="text-3xl font-black lowercase italic tracking-tight text-[#b3193a]">
                  aqueduct
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
                placeholder="Search users, championships, rounds, role requests..."
                type="search"
              />
            </form>

            <div className="flex items-center gap-3">
              <NotificationBell theme="admin" />
              <a
                className="flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a] transition shadow-sm"
                href="/profile"
              >
                <span className="h-2 w-2 rounded-full bg-[#b3193a]" />
                System Admin
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
          <aside className="admin-sidebar-scrollbar border-b border-[#d8d8d8] bg-[#f1f1f1] lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <nav aria-label="Admin workspace" className="flex overflow-x-auto lg:block lg:px-3 lg:py-4">
              {adminNavGroups.map((group) => (
                <div key={group.label} className="contents lg:mb-5 lg:block">
                  <p className="hidden px-3 pb-2 text-[11px] font-black tracking-[0.18em] text-slate-400 lg:block">
                    {group.label}
                  </p>
                  <div className="flex lg:block lg:space-y-1">
                    {group.items.map((item) => (
                      <NavLink
                        className={({ isActive }) =>
                          [
                            "flex min-h-14 min-w-max items-center gap-3 border-r border-[#dddddd] px-4 text-sm font-bold lg:min-h-11 lg:rounded-md lg:border-r-0 lg:px-3",
                            isActive
                              ? "bg-white text-[#b3193a] shadow-[inset_4px_0_0_#b3193a] lg:shadow-none"
                              : "text-[#171717] hover:bg-white",
                          ].join(" ")
                        }
                        end={("end" in item && item.end) || item.href === "/admin"}
                        key={item.href}
                        to={item.href}
                      >
                        <item.icon className="h-5 w-5 opacity-80" aria-hidden="true" />
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
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
