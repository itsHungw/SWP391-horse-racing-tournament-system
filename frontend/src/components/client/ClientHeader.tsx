import { useNavigate } from "react-router-dom";

import logo from "../../assets/logo.png";
import { useClientSession } from "../../hooks/useClientSession";
import { getDashboardRouteForRoles } from "../../utils/dashboardRoute";

const publicPrimaryNav = [
  { label: "Tournaments", href: "#tournaments" },
  { label: "Races", href: "#races" },
  { label: "Predictions", href: "#predictions" },
  { label: "Blog", href: "/blogs" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "Join Us", href: "/join-us" },
];

const authenticatedPrimaryNav = publicPrimaryNav;

export function ClientHeader() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, session } = useClientSession();
  const primaryNav = isAuthenticated ? authenticatedPrimaryNav : publicPrimaryNav;
  const dashboardHref = getDashboardRouteForRoles(session?.roles ?? []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <>
      <header
        aria-label="Client site header"
        className="bg-black text-xs uppercase tracking-widest text-white"
        role="banner"
      >
        <div className="mx-auto flex h-16 max-w-[1536px] items-center justify-between px-6 md:px-11">
          <a className="flex h-11 items-center" href="/" aria-label="Horse racing tournament home">
            <img alt="" className="h-8 brightness-0 invert" src={logo} />
          </a>

          {isAuthenticated ? (
            <nav aria-label="Account" className="flex items-center gap-6 font-bold">
              <a className="opacity-85 hover:opacity-100" href={dashboardHref}>
                Dashboard
              </a>
              <a className="opacity-85 hover:opacity-100" href="/profile">
                Profile
              </a>
              <button
                className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-xs font-bold uppercase tracking-widest text-white opacity-85 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            </nav>
          ) : (
            <nav aria-label="Authentication" className="flex items-center gap-6 font-bold">
              <a className="opacity-85 hover:opacity-100" href="/login">
                Log In
              </a>
              <a className="opacity-85 hover:opacity-100" href="/register">
                Sign Up
              </a>
            </nav>
          )}
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="sticky top-0 z-50 border-b-2 border-yellow-400 bg-nyraGreen text-white"
        data-purpose="main-nav"
      >
        <div className="mx-auto flex min-h-[76px] max-w-[1536px] items-center gap-8 overflow-x-auto px-6 md:px-11">
          <div className="flex min-w-max items-center">
            <span className="text-base font-extrabold tracking-tight">
              Tournament season opens soon
            </span>
          </div>

          <div className="flex min-w-max flex-1 items-center justify-end gap-8 uppercase lg:gap-12">
            {primaryNav.map((item) => (
              <a
                className="text-base font-extrabold tracking-tight hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:text-lg"
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
