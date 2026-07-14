import { ArrowLeft, Home, MapPinOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../../assets/logo.png";
import raceTrack from "../../assets/slide.jpg";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export function NotFoundPage() {
  const navigate = useNavigate();

  useDocumentTitle("Page not found");

  return (
    <main className="client-theme relative flex min-h-screen min-h-dvh w-full min-w-0 flex-col overflow-hidden bg-turf-950 text-ivory">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <img
          alt=""
          className="error-cinematic-bg h-full w-full object-cover object-center opacity-45"
          src={raceTrack}
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(4,20,15,0.98)_5%,rgba(4,20,15,0.87)_48%,rgba(4,20,15,0.58)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_30%,rgba(212,175,55,0.13),transparent_35%)]" />
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
          Off the racing line
        </p>
      </header>

      <section
        aria-labelledby="not-found-title"
        className="error-hero-enter relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-6 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:px-12"
      >
        <div className="min-w-0">
          <p className="font-data flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-gold-300">
            <MapPinOff aria-hidden="true" className="h-4 w-4" />
            Course marker not found
          </p>
          <p className="font-display -ml-1 mt-3 text-[clamp(7rem,28vw,18rem)] font-semibold leading-[0.68] tracking-[-0.08em] text-gold-200/45 lg:mt-7 lg:text-[clamp(11rem,20vw,18rem)]">
            404
          </p>
        </div>

        <div className="min-w-0 border-l border-gold-300/40 pl-5 sm:pl-8">
          <p className="font-data text-[0.65rem] uppercase tracking-[0.28em] text-ivory-dim">
            Error 404 · Lost course
          </p>
          <h1
            className="font-display mt-4 max-w-xl text-4xl font-medium leading-[1.02] tracking-[-0.035em] text-ivory sm:text-5xl lg:text-6xl"
            id="not-found-title"
          >
            This page missed the starting gate.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-ivory-dim sm:text-lg">
            The route may have moved, or the field has already left the paddock. Return to the
            clubhouse and rejoin the action.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold-300 px-6 py-3 text-sm font-bold text-turf-950 transition-colors hover:bg-gold-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-200"
              to="/"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              Back to home
            </Link>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ivory/35 bg-turf-950/30 px-6 py-3 text-sm font-bold text-ivory transition-colors hover:border-gold-300/70 hover:bg-turf-800/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-200"
              onClick={() => navigate(-1)}
              type="button"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Go back
            </button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-ivory/10 px-5 py-3 text-[0.62rem] uppercase tracking-[0.2em] text-ivory-faint sm:px-8 lg:px-12">
        <span className="font-data">Race control · Route status 404</span>
        <span className="font-data text-gold-300/80">Clubhouse remains open</span>
      </footer>
    </main>
  );
}
