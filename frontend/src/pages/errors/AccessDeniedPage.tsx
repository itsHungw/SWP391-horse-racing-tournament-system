import { ArrowRight, Home, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";

import logo from "../../assets/logo.png";
import raceTrack from "../../assets/slide.jpg";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export type AccessDeniedPageProps = {
  requiredRole?: string;
  workspaceName?: string;
  email?: string | null;
};

function formatRoleLabel(role?: string) {
  if (!role?.trim()) {
    return "Authorized role";
  }

  return role
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase()
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase());
}

export function AccessDeniedPage({
  email,
  requiredRole,
  workspaceName = "Restricted Workspace",
}: AccessDeniedPageProps) {
  useDocumentTitle("Access restricted");

  const roleLabel = formatRoleLabel(requiredRole);

  return (
    <main className="client-theme relative flex min-h-screen min-h-dvh w-full min-w-0 flex-col overflow-hidden bg-turf-950 text-ivory">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <img
          alt=""
          className="error-cinematic-bg h-full w-full object-cover object-[65%_center] opacity-35"
          src={raceTrack}
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(4,20,15,0.99)_8%,rgba(6,32,26,0.9)_52%,rgba(4,20,15,0.68)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_42%,rgba(212,175,55,0.16),transparent_32%)]" />
        <div className="error-light-sweep absolute inset-y-0 left-1/3 w-1/4 bg-gradient-to-r from-transparent via-gold-200/15 to-transparent blur-xl" />
      </div>

      <header className="relative z-10 flex w-full items-center justify-between border-b border-ivory/10 px-5 py-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-300/30 bg-turf-950/60">
            <img alt="" className="h-8 w-8 object-contain" src={logo} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold leading-none">Aqueduct</p>
            <p className="font-data mt-1 text-[0.6rem] uppercase tracking-[0.24em] text-ivory-dim">
              Night at the Races
            </p>
          </div>
        </div>
        <p className="font-data hidden text-[0.65rem] uppercase tracking-[0.22em] text-gold-300 sm:block">
          Steward gate
        </p>
      </header>

      <section
        aria-labelledby="access-denied-title"
        className="error-hero-enter relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(20rem,1fr)] lg:px-12"
      >
        <div className="relative min-h-64 min-w-0 overflow-hidden border border-gold-300/25 bg-turf-950/55 p-6 shadow-2xl backdrop-blur-sm sm:min-h-80 sm:p-8">
          <div className="absolute inset-x-0 top-1/2 h-px bg-gold-300/35" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-gold-300/35" />
          <div className="relative flex h-full min-h-52 flex-col justify-between sm:min-h-64">
            <div className="flex items-center justify-between">
              <span className="font-data text-xs uppercase tracking-[0.22em] text-gold-300">
                Gate locked
              </span>
              <LockKeyhole aria-hidden="true" className="h-6 w-6 text-gold-300" />
            </div>
            <p className="font-display text-[clamp(6.5rem,28vw,12rem)] font-semibold leading-none tracking-[-0.06em] text-gold-200/45 lg:text-[clamp(8rem,13vw,12rem)]">
              403
            </p>
            <p className="font-data text-[0.65rem] uppercase tracking-[0.2em] text-ivory-faint">
              Credentials checked · Entry withheld
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-data text-xs uppercase tracking-[0.24em] text-gold-300">
            Locked starting gate
          </p>
          <h1
            className="font-display mt-4 max-w-2xl text-4xl font-medium leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-6xl"
            id="access-denied-title"
          >
            Access beyond this gate is restricted.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ivory-dim sm:text-lg">
            Your account is signed in, but this area is reserved for approved members of the
            racing operation.
          </p>

          <dl className="mt-7 grid gap-px overflow-hidden border border-ivory/15 bg-ivory/15 sm:grid-cols-3">
            <div className="min-w-0 bg-turf-950/85 p-4">
              <dt className="font-data text-[0.62rem] uppercase tracking-[0.18em] text-ivory-faint">
                Workspace
              </dt>
              <dd className="mt-2 break-words text-sm font-semibold text-ivory">{workspaceName}</dd>
            </div>
            <div className="min-w-0 bg-turf-950/85 p-4">
              <dt className="font-data text-[0.62rem] uppercase tracking-[0.18em] text-ivory-faint">
                Required role
              </dt>
              <dd className="mt-2 break-words text-sm font-semibold text-gold-200">{roleLabel}</dd>
            </div>
            <div className="min-w-0 bg-turf-950/85 p-4">
              <dt className="font-data text-[0.62rem] uppercase tracking-[0.18em] text-ivory-faint">
                Signed in as
              </dt>
              <dd className="mt-2 break-all text-sm font-semibold text-ivory">
                {email || "Current account"}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold-300 px-6 py-3 text-sm font-bold text-turf-950 transition-colors hover:bg-gold-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-200"
              to="/my-role-requests"
            >
              Review Role Requests
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ivory/35 bg-turf-950/30 px-6 py-3 text-sm font-bold text-ivory transition-colors hover:border-gold-300/70 hover:bg-turf-800/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-200"
              to="/"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-ivory/10 px-5 py-3 text-[0.62rem] uppercase tracking-[0.2em] text-ivory-faint sm:px-8 lg:px-12">
        <span className="font-data">Race control · Access status 403</span>
        <span className="font-data text-gold-300/80">Session remains active</span>
      </footer>
    </main>
  );
}
