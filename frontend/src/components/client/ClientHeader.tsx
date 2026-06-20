import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Menu, User, X } from "lucide-react";

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const dashboardHref = getDashboardRouteForRoles(session?.roles ?? []);
  const isOrganizer = (session?.roles ?? []).includes("ORGANIZER");
  const organizerLabel = isOrganizer ? "Organizer" : "Organize";
  const organizerHref = isOrganizer ? "/organizer" : "/organizer/register";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <p className="eyebrow text-gold-400/90 flex items-center">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-soft align-middle live-pulse" />
            Championship Season — Official schedules, race cards, and results
          </p>
          <p className="eyebrow text-ivory-faint tracking-wider">Virtual points only · No real-money betting</p>
        </div>
      </div>

      {/* Primary glass navigation */}
      <div
        className={`border-b transition-all duration-500 ${
          scrolled
            ? "border-white/10 bg-turf-950/85 backdrop-blur-xl shadow-lg"
            : "border-white/5 bg-turf-950/55 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-6 md:px-12">
          <Link
            to="/"
            aria-label="Horse racing championship — home"
            className="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400 group"
          >
            <img src={logo} alt="" className="h-9 brightness-0 invert transition-transform duration-500 group-hover:scale-105" />
            <span className="hidden font-display text-xl font-medium tracking-tight text-ivory sm:block">
              Aqueduct<span className="text-gold-400">.</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-6 xl:flex">
            {navLinks.map((item) => {
              const active = isActivePath(location.pathname, item.to);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`group relative whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400 ${
                    active ? "text-gold-300" : "text-ivory-dim hover:text-ivory"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-2 left-1/2 h-[2px] -translate-x-1/2 bg-gold-400 transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 xl:flex">
              {isAuthenticated ? (
                <>
                  <Link
                    to={organizerHref}
                    className="mr-2 whitespace-nowrap rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.14em] text-gold-300 transition-colors hover:bg-gold-400/20 hover:text-gold-200"
                  >
                    {organizerLabel}
                  </Link>
                  <div className="relative" ref={userMenuRef}>
                    <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-2 pl-4 pr-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-ivory transition-all hover:bg-white/10 hover:border-white/20 focus:outline-none"
                  >
                    <User size={16} className="text-gold-400" />
                    <span>Account</span>
                    <ChevronDown size={14} className={`text-ivory-dim transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl border border-white/10 bg-turf-900/95 p-2 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                      >
                        <a
                          href={dashboardHref}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory"
                        >
                          Dashboard
                        </a>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory"
                        >
                          Profile
                        </Link>
                        <div className="my-1 h-px bg-white/10" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-400 transition-colors hover:bg-white/5 hover:text-rose-300"
                        >
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
                    className="rounded-sm bg-gold-400 px-6 py-2.5 text-[12px] font-bold uppercase tracking-[0.15em] text-turf-950 shadow-[0_0_20px_-5px_rgba(212,175,55,0.4)] transition-all hover:bg-gold-300 hover:shadow-[0_0_25px_-5px_rgba(212,175,55,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory"
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
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/15 text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 xl:hidden"
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
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: "100vh" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 right-0 top-[108px] z-40 overflow-y-auto bg-turf-950/95 backdrop-blur-2xl xl:hidden"
          >
            <nav aria-label="Mobile" className="mx-auto flex max-w-[1400px] flex-col gap-2 px-6 py-8 pb-32">
              {navLinks.map((item, i) => {
                const active = isActivePath(location.pathname, item.to);
                return (
                  <motion.div
                    key={item.label}
                    initial={reduce ? {} : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4 }}
                  >
                    <Link
                      to={item.to}
                      className={`flex items-center justify-between border-b border-white/5 py-4 text-base font-bold uppercase tracking-[0.14em] ${
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

              <motion.div 
                initial={reduce ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mt-8 flex flex-col gap-4"
              >
                {isAuthenticated ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-turf-900 text-gold-400">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ivory">My Account</p>
                        <p className="text-xs text-ivory-dim">Manage your profile</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        to={organizerHref}
                        className="rounded-lg bg-gold-400/10 border border-gold-400/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-gold-300 transition-colors hover:bg-gold-400/20"
                      >
                        {organizerLabel}
                      </Link>
                      <a
                        href={dashboardHref}
                        className="rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ivory transition-colors hover:bg-white/5"
                      >
                        Dashboard
                      </a>
                      <Link
                        to="/profile"
                        className="rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ivory transition-colors hover:bg-white/5"
                      >
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-2 rounded-lg bg-rose-500/10 px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.12em] text-rose-400 transition-colors hover:bg-rose-500/20"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/login"
                      className="rounded-sm border border-white/15 py-3.5 text-center text-sm font-bold uppercase tracking-[0.12em] text-ivory transition-colors hover:bg-white/5"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      className="rounded-sm bg-gold-400 py-3.5 text-center text-sm font-bold uppercase tracking-[0.12em] text-turf-950 shadow-[0_0_20px_-5px_rgba(212,175,55,0.4)] transition-colors hover:bg-gold-300"
                    >
                      Join Now
                    </Link>
                  </div>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
