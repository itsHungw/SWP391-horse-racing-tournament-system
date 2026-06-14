import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";

import logo from "../../assets/logo.png";
import { useClientSession } from "../../hooks/useClientSession";
import { getDashboardRouteForRoles } from "../../utils/dashboardRoute";

const navLinks = [
  { label: "Championships", to: "/championships" },
  { label: "Races", to: "/races" },
  { label: "Predictions", to: "/spectator/predictions" },
  { label: "Newsroom", to: "/blogs" },
  { label: "Leaderboard", to: "/leaderboard" },
  { label: "Join Us", to: "/join-us" },
];

function isActivePath(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function ClientHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = useReducedMotion();
  const { isAuthenticated, logout, session } = useClientSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardHref = getDashboardRouteForRoles(session?.roles ?? []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <header className="client-theme sticky top-0 z-50">
      {/* Season ticker strip */}
      <div className="hidden bg-turf-950 text-ivory-dim md:block">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-12 py-1.5">
          <p className="eyebrow text-gold-400/90">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-soft align-middle live-pulse" />
            Championship Season — Official schedules, race cards, and results
          </p>
          <p className="eyebrow text-ivory-faint">Virtual points only · No real-money betting</p>
        </div>
      </div>

      {/* Primary glass navigation */}
      <div
        className={`border-b transition-colors duration-300 ${
          scrolled
            ? "border-white/10 bg-turf-950/85 backdrop-blur-xl"
            : "border-white/5 bg-turf-950/55 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between px-6 md:px-12">
          <Link
            to="/"
            aria-label="Horse racing championship — home"
            className="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400"
          >
            <img src={logo} alt="" className="h-8 brightness-0 invert" />
            <span className="hidden font-display text-lg font-semibold tracking-tight text-ivory sm:block">
              Aqueduct<span className="text-gold-400">.</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {navLinks.map((item) => {
              const active = isActivePath(location.pathname, item.to);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`group relative text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400 ${
                    active ? "text-ivory" : "text-ivory-dim hover:text-ivory"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1.5 left-0 h-px bg-gold-400 transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              {isAuthenticated ? (
                <>
                  <a
                    href={dashboardHref}
                    className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ivory-dim transition-colors hover:text-ivory"
                  >
                    Dashboard
                  </a>
                  <Link
                    to="/profile"
                    className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ivory-dim transition-colors hover:text-ivory"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-sm border border-white/15 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ivory-dim transition-colors hover:text-ivory"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-sm bg-gold-400 px-5 py-2 text-[12px] font-bold uppercase tracking-[0.14em] text-turf-950 shadow-[0_10px_30px_-8px_rgba(212,175,55,0.6)] transition-colors hover:bg-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory"
                  >
                    Join Now
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/15 text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 lg:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-nav"
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-b border-white/10 bg-turf-950/95 backdrop-blur-xl lg:hidden"
          >
            <nav aria-label="Mobile" className="mx-auto flex max-w-[1400px] flex-col gap-1 px-6 py-5">
              {navLinks.map((item, i) => {
                const active = isActivePath(location.pathname, item.to);
                return (
                  <motion.div
                    key={item.label}
                    initial={reduce ? {} : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.3 }}
                  >
                    <Link
                      to={item.to}
                      className={`flex items-center justify-between border-b border-white/5 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] ${
                        active ? "text-gold-300" : "text-ivory-dim"
                      }`}
                    >
                      {item.label}
                      <span className="font-data text-xs text-ivory-faint">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}

              <div className="mt-4 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <a
                      href={dashboardHref}
                      className="rounded-sm border border-white/15 py-3 text-center text-sm font-semibold uppercase tracking-[0.12em] text-ivory"
                    >
                      Dashboard
                    </a>
                    <Link
                      to="/profile"
                      className="rounded-sm border border-white/15 py-3 text-center text-sm font-semibold uppercase tracking-[0.12em] text-ivory"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-sm bg-gold-400 py-3 text-center text-sm font-bold uppercase tracking-[0.12em] text-turf-950"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="rounded-sm border border-white/15 py-3 text-center text-sm font-semibold uppercase tracking-[0.12em] text-ivory"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      className="rounded-sm bg-gold-400 py-3 text-center text-sm font-bold uppercase tracking-[0.12em] text-turf-950"
                    >
                      Join Now
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
