import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  Eye,
  EyeOff,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Ticket,
  Trophy,
  User,
  UserPlus,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

import logo from "../../assets/logo.png";
import { getMyProfile } from "../../api/profileApi";
import { walletApi } from "../../api/walletApi";
import { setWalletBalance, useWalletBalance } from "../../hooks/useWalletBalance";
import { useClientSession } from "../../hooks/useClientSession";
import { NotificationBell } from "../NotificationBell";

const vnd = new Intl.NumberFormat("en-US");

// Name/avatar rarely change, so cache them across navigations to avoid refetching
// on every page mount. Cleared on logout. The balance lives in a shared store
// (useWalletBalance) instead — it must stay live as the user spends/tops up.
let cachedHeaderProfile: { fullName: string | null; avatarUrl: string | null } | null = null;

function initialsFrom(name: string | null, email: string | null) {
  const source = (name && name.trim()) || (email ? email.split("@")[0] : "") || "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase() || "ME";
}

function HeaderAvatar({ url, initials, size }: { url: string | null; initials: string; size: number }) {
  const [failed, setFailed] = useState(false);
  const dimension = { width: size, height: size };
  if (url && !failed) {
    return (
      <img
        src={url}
        alt=""
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full border border-gold-400/60 bg-turf-900 object-cover"
        style={dimension}
      />
    );
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full border border-gold-400/60 bg-turf-900 font-data font-bold text-gold-200"
      style={{ ...dimension, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </span>
  );
}

const navLinks = [
  { label: "Championships", to: "/championships" },
  { label: "Races", to: "/races" },
  { label: "Predictions", to: "/spectator/predictions" },
  { label: "Newsroom", to: "/blogs" },
  { label: "Leaderboard", to: "/leaderboard" },
  { label: "Join Us", to: "/join-us" },
];

type DashboardTarget = {
  label: string;
  description: string;
  href: string;
  matchPrefixes: string[];
  Icon: LucideIcon;
};

type DashboardGroups = {
  personal: DashboardTarget[];
  business: DashboardTarget[];
  platform: DashboardTarget[];
};

function hasRole(roles: Set<string>, role: string) {
  return roles.has(role.toUpperCase());
}

function getDashboardGroups(roles: string[]): DashboardGroups {
  const normalizedRoles = new Set(roles.map((role) => role.toUpperCase()));
  const personal: DashboardTarget[] = [
    {
      label: "Spectator Mode",
      description: "Browse races and predictions",
      href: "/spectator/predictions",
      matchPrefixes: ["/spectator"],
      Icon: Ticket,
    },
  ];

  if (hasRole(normalizedRoles, "HORSE_OWNER")) {
    personal.push({
      label: "Owner Dashboard",
      description: "Stable, horses, registrations",
      href: "/owner/dashboard",
      matchPrefixes: ["/owner"],
      Icon: LayoutDashboard,
    });
  }
  if (hasRole(normalizedRoles, "JOCKEY")) {
    personal.push({
      label: "Jockey Dashboard",
      description: "Pools, contracts, schedule",
      href: "/jockey/dashboard",
      matchPrefixes: ["/jockey"],
      Icon: Trophy,
    });
  }
  if (hasRole(normalizedRoles, "REFEREE")) {
    personal.push({
      label: "Referee Dashboard",
      description: "Contracts and race control",
      href: "/referee/dashboard",
      matchPrefixes: ["/referee"],
      Icon: ShieldCheck,
    });
  }

  return {
    personal,
    business: hasRole(normalizedRoles, "ORGANIZER")
      ? [
          {
            label: "Organizer Dashboard",
            description: "Business race office",
            href: "/organizer",
            matchPrefixes: ["/organizer"],
            Icon: BriefcaseBusiness,
          },
        ]
      : [],
    platform: hasRole(normalizedRoles, "ADMIN")
      ? [
          {
            label: "Admin Dashboard",
            description: "Platform operations",
            href: "/admin",
            matchPrefixes: ["/admin"],
            Icon: ShieldCheck,
          },
        ]
      : [],
  };
}

function allDashboardTargets(groups: DashboardGroups) {
  return [...groups.personal, ...groups.business, ...groups.platform];
}

function currentDashboardTarget(groups: DashboardGroups, pathname: string) {
  return (
    allDashboardTargets(groups).find((target) =>
      target.matchPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
    ) ?? groups.personal[0]
  );
}

function DashboardLink({ target }: { target: DashboardTarget }) {
  const Icon = target.Icon;
  return (
    <Link
      to={target.href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
    >
      <Icon size={17} className="shrink-0 text-gold-300" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ivory">{target.label}</span>
        <span className="block truncate text-[11px] text-ivory-faint">{target.description}</span>
      </span>
    </Link>
  );
}

function DashboardGroup({ title, targets }: { title: string; targets: DashboardTarget[] }) {
  if (targets.length === 0) {
    return null;
  }

  return (
    <div className="py-1">
      <p className="px-3 pb-1 pt-2 font-data text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300">
        {title}
      </p>
      <div className="space-y-1">
        {targets.map((target) => (
          <DashboardLink key={`${title}-${target.label}`} target={target} />
        ))}
      </div>
    </div>
  );
}

function WorkspaceSwitcher({
  groups,
  current,
  expanded,
  onToggle,
}: {
  groups: DashboardGroups;
  current: DashboardTarget;
  expanded: boolean;
  onToggle: () => void;
}) {
  const otherGroups: DashboardGroups = {
    personal: groups.personal.filter((target) => target.href !== current.href),
    business: groups.business.filter((target) => target.href !== current.href),
    platform: groups.platform.filter((target) => target.href !== current.href),
  };
  const hasOtherTargets = allDashboardTargets(otherGroups).length > 0;
  const Icon = current.Icon;

  return (
    <div className="py-1">
      <p className="px-3 pb-1 pt-2 font-data text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300">
        Current dashboard
      </p>
      <button
        type="button"
        aria-expanded={expanded}
        aria-label="Change dashboard workspace"
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-lg border border-gold-400/20 bg-gold-400/[0.06] px-3 py-2.5 text-left transition-colors hover:bg-gold-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
      >
        <Icon size={17} className="shrink-0 text-gold-300" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ivory">{current.label}</span>
          <span className="block truncate text-[11px] text-ivory-faint">{current.description}</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 text-ivory-faint transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-1 overflow-hidden"
          >
            {hasOtherTargets ? (
              <div className="space-y-1">
                <DashboardGroup title="Personal dashboards" targets={otherGroups.personal} />
                <DashboardGroup title="Business workspace" targets={otherGroups.business} />
                <DashboardGroup title="Platform workspace" targets={otherGroups.platform} />
              </div>
            ) : (
              <p className="px-3 py-2 text-xs leading-5 text-ivory-faint">No other workspace is active for this account.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const walletBalance = useWalletBalance();
  const [balanceRevealed, setBalanceRevealed] = useState(true);
  const [profile, setProfile] = useState(cachedHeaderProfile);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const dashboardGroups = getDashboardGroups(session?.roles ?? []);
  const currentWorkspace = currentDashboardTarget(dashboardGroups, location.pathname);
  const isOrganizer = (session?.roles ?? []).includes("ORGANIZER");
  const organizerHref = isOrganizer ? "/organizer" : "/organizer/register";
  const displayName = profile?.fullName || session?.fullName || "Member";
  const avatarUrl = profile?.avatarUrl ?? null;
  const initials = initialsFrom(profile?.fullName ?? session?.fullName ?? null, session?.email ?? null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    setWorkspaceMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    if (profile === null) {
      getMyProfile()
        .then((p) => {
          if (!mounted) return;
          const value = { fullName: p.fullName ?? null, avatarUrl: p.avatarUrl ?? null };
          cachedHeaderProfile = value;
          setProfile(value);
        })
        .catch(() => undefined);
    }
    // Always refetch the balance on mount. ClientHeader remounts on every navigation,
    // so this keeps the chip fresh after balance-changing actions on other pages
    // (placing bets, payouts). The shared store seeds the first render, so the last
    // known value shows instantly with no flash while this reconciles with the server.
    walletApi
      .getMyWallet()
      .then((w) => {
        if (mounted) setWalletBalance(w.balance);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, profile]);

  const balanceText = walletBalance === null ? "—" : balanceRevealed ? `${vnd.format(walletBalance)} ₫` : "•••••• ₫";

  const handleLogout = () => {
    cachedHeaderProfile = null;
    setProfile(null);
    setWalletBalance(null);
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
          <p className="eyebrow text-ivory-faint tracking-wider">VND wallet picks - pool estimates lock at race start</p>
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
              const linkClass = `group relative whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400 ${
                active ? "text-gold-300" : "text-ivory-dim hover:text-ivory"
              }`;
              const underline = (
                <span
                  className={`absolute -bottom-2 left-1/2 h-[2px] -translate-x-1/2 bg-gold-400 transition-all duration-300 ${
                    active ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              );
              if (item.label === "Join Us") {
                return (
                  <div
                    key={item.label}
                    className="relative [&:focus-within>div]:visible [&:focus-within>div]:opacity-100 [&:hover>div]:visible [&:hover>div]:opacity-100"
                  >
                    <Link to={item.to} className={linkClass}>
                      {item.label}
                      {underline}
                    </Link>
                    <div className="invisible absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200">
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-turf-900/95 p-2 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                        <Link
                          to="/join-us"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory"
                        >
                          <UserPlus size={17} className="shrink-0 text-ivory-faint" aria-hidden="true" />
                          Join as a fan
                        </Link>
                        <Link
                          to={organizerHref}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory"
                        >
                          <Flag size={17} className="shrink-0 text-gold-300" aria-hidden="true" />
                          {isOrganizer ? "Organizer workspace" : "Organize a championship"}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <Link key={item.label} to={item.to} className={linkClass}>
                  {item.label}
                  {underline}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 xl:flex">
              {isAuthenticated ? (
                <>
                  <NotificationBell theme="client" />
                  <div className="relative" ref={userMenuRef}>
                    <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-label="Account menu"
                    aria-expanded={userMenuOpen}
                    className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 transition-all hover:bg-white/10 hover:border-white/20 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
                  >
                    <HeaderAvatar url={avatarUrl} initials={initials} size={34} />
                    <span className="hidden max-w-[140px] text-left min-[1360px]:block">
                      <span className="block truncate text-[13px] font-semibold leading-tight text-ivory">{displayName}</span>
                      <span className="block truncate font-data text-[11px] leading-tight text-gold-300">
                        {balanceText}
                      </span>
                    </span>
                    <ChevronDown size={14} className={`text-ivory-dim transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-72 overflow-hidden rounded-xl border border-white/10 bg-turf-900/95 p-2 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                      >
                        <div className="flex items-center gap-3 px-2 py-2">
                          <HeaderAvatar url={avatarUrl} initials={initials} size={40} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ivory">{displayName}</p>
                            <p className="truncate text-xs text-ivory-dim">{session?.email ?? ""}</p>
                          </div>
                        </div>

                        <Link
                          to="/wallet"
                          className="mx-0.5 mt-1 flex items-center gap-3 rounded-lg border border-gold-400/20 bg-gold-400/[0.06] px-3 py-2.5 transition-colors hover:bg-gold-400/10"
                        >
                          <Wallet size={18} className="shrink-0 text-gold-300" aria-hidden="true" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[11px] text-ivory-faint">Wallet balance</span>
                            <span className="block font-data text-sm font-bold text-ivory">{balanceText}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setBalanceRevealed((v) => !v);
                            }}
                            aria-label={balanceRevealed ? "Hide balance" : "Show balance"}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ivory-faint transition-colors hover:bg-white/10 hover:text-ivory"
                          >
                            {balanceRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </Link>

                        <div className="my-1.5 h-px bg-white/10" />

                        <WorkspaceSwitcher
                          groups={dashboardGroups}
                          current={currentWorkspace}
                          expanded={workspaceMenuOpen}
                          onToggle={() => setWorkspaceMenuOpen((open) => !open)}
                        />
                        <div className="my-1.5 h-px bg-white/10" />

                        <Link
                          to="/profile"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory"
                        >
                          <User size={17} className="shrink-0 text-ivory-faint" aria-hidden="true" />
                          Profile
                        </Link>
                        <Link
                          to="/spectator/predictions"
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory"
                        >
                          <Ticket size={17} className="shrink-0 text-ivory-faint" aria-hidden="true" />
                          My predictions
                        </Link>
                        <div className="my-1 h-px bg-white/10" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-400 transition-colors hover:bg-white/5 hover:text-rose-300"
                        >
                          <LogOut size={17} className="shrink-0" aria-hidden="true" />
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
                      <HeaderAvatar url={avatarUrl} initials={initials} size={44} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ivory">{displayName}</p>
                        <p className="truncate text-xs text-ivory-dim">{session?.email ?? "Manage your profile"}</p>
                      </div>
                    </div>
                    <Link
                      to="/wallet"
                      className="mb-3 flex items-center gap-3 rounded-lg border border-gold-400/20 bg-gold-400/[0.06] px-4 py-3"
                    >
                      <Wallet size={18} className="shrink-0 text-gold-300" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] text-ivory-faint">Wallet balance</span>
                        <span className="block font-data text-sm font-bold text-ivory">
                          {walletBalance === null ? "—" : `${vnd.format(walletBalance)} ₫`}
                        </span>
                      </span>
                    </Link>
                    <div className="flex flex-col gap-2">
                      <WorkspaceSwitcher
                        groups={dashboardGroups}
                        current={currentWorkspace}
                        expanded={workspaceMenuOpen}
                        onToggle={() => setWorkspaceMenuOpen((open) => !open)}
                      />
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
