import { Link, useNavigate } from "react-router-dom";

import logo from "../../assets/logo.png";
import { useClientSession } from "../../hooks/useClientSession";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export function AdminForbiddenPage() {
  useDocumentTitle("Admin access required");
  const navigate = useNavigate();
  const { logout, session } = useClientSession();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <section
      aria-labelledby="forbidden-title"
      className="min-h-screen bg-[#171717] px-5 py-10 text-white sm:px-8"
    >
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div className="border border-white/10 bg-[#202020] p-6 shadow-2xl sm:p-10">
            <div className="flex items-center gap-3">
              <img alt="" className="h-11 w-11 object-contain" src={logo} />
              <div>
                <p className="text-2xl font-black lowercase italic tracking-tight text-[#b3193a]">
                  equinepro
                </p>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                  restricted control room
                </p>
              </div>
            </div>

            <p className="mt-12 text-sm font-black uppercase tracking-[0.22em] text-[#a6ff3f]">
              403 Permission Gate
            </p>
            <h1
              className="mt-4 max-w-3xl text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl"
              id="forbidden-title"
            >
              Admin access required
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-300">
              Your account is signed in, but it does not have permission to enter tournament
              control. Use an admin account or return to the client workspace.
            </p>

            <dl className="mt-8 grid gap-3 border-y border-white/10 py-5 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Signed in as
                </dt>
                <dd className="mt-1 text-sm font-black text-white">
                  {session?.email || "Unknown account"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Required role
                </dt>
                <dd className="mt-1 text-sm font-black text-[#a6ff3f]">ADMIN</dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="flex min-h-12 items-center justify-center bg-[#a6ff3f] px-6 text-sm font-black text-[#07110d] shadow-[0_18px_42px_rgba(166,255,63,0.18)] hover:bg-[#c4ff72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6ff3f]"
                to="/"
              >
                Return Home
              </Link>
              <Link
                className="flex min-h-12 items-center justify-center border border-white/25 px-6 text-sm font-black text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                to="/profile"
              >
                View Profile
              </Link>
              <button
                className="min-h-12 border border-[#b3193a] px-6 text-sm font-black text-white hover:bg-[#b3193a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
                onClick={handleLogout}
                type="button"
              >
                Switch Account
              </button>
            </div>
          </div>

          <aside
            aria-label="Access status"
            className="relative overflow-hidden border border-white/10 bg-[#060606] p-6 sm:p-8"
          >
            <div className="absolute right-0 top-0 h-28 w-28 border-b border-l border-[#a6ff3f]/50" />
            <div className="absolute bottom-0 left-0 h-32 w-32 border-r border-t border-[#b3193a]/50" />
            <div className="relative flex h-full min-h-[360px] flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Security check
                </span>
                <span className="rounded-full bg-[#b3193a] px-3 py-1 text-xs font-black">
                  Blocked
                </span>
              </div>

              <div>
                <p className="text-[7rem] font-black leading-none tracking-tight text-white/10 sm:text-[9rem]">
                  403
                </p>
                <div className="mt-6 space-y-3">
                  {["Valid session detected", "Admin role missing", "Control room locked"].map(
                    (item, index) => (
                      <div className="flex items-center gap-3" key={item}>
                        <span className="flex h-8 w-8 items-center justify-center border border-white/15 text-xs font-black text-[#a6ff3f]">
                          0{index + 1}
                        </span>
                        <span className="text-sm font-black uppercase tracking-[0.12em] text-slate-300">
                          {item}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <p className="max-w-sm text-sm font-medium leading-6 text-slate-500">
                Admin pages stay protected in the client router and the backend still enforces
                the same role through Spring Security.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
