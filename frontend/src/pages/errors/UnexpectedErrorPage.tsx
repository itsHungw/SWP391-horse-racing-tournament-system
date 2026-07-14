import { Home, RotateCcw, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";

import logo from "../../assets/logo.png";
import raceTrack from "../../assets/slide.jpg";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useErrorPageHeadingFocus } from "./useErrorPageHeadingFocus";

export type UnexpectedErrorPageProps = {
  onRetry?: () => void;
};

export function UnexpectedErrorPage({ onRetry }: UnexpectedErrorPageProps) {
  useDocumentTitle("Unexpected race control error");
  const headingRef = useErrorPageHeadingFocus();

  return (
    <main className="client-theme relative flex min-h-screen min-h-dvh w-full min-w-0 flex-col overflow-hidden bg-turf-950 text-ivory">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <img
          alt=""
          className="error-cinematic-bg h-full w-full object-cover object-center opacity-30"
          src={raceTrack}
        />
        <div className="absolute inset-0 bg-[linear-gradient(96deg,rgba(4,20,15,0.99)_5%,rgba(6,32,26,0.92)_52%,rgba(4,20,15,0.72)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_35%,rgba(212,175,55,0.14),transparent_31%)]" />
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
          Race control
        </p>
      </header>

      <section
        aria-labelledby="unexpected-error-title"
        className="error-hero-enter relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:px-12"
      >
        <div className="relative flex h-52 w-full max-w-72 items-center justify-center justify-self-center rounded-full border border-gold-300/25 bg-turf-950/55 shadow-[0_0_80px_rgba(212,175,55,0.08)] backdrop-blur-sm sm:h-64 sm:max-w-80 lg:h-80 lg:w-80">
          <div className="absolute inset-5 rounded-full border border-dashed border-gold-300/25" />
          <div className="absolute inset-10 rounded-full border border-ivory/10" />
          <TriangleAlert aria-hidden="true" className="h-16 w-16 text-gold-300 sm:h-20 sm:w-20" />
          <span className="font-data absolute bottom-8 text-[0.65rem] uppercase tracking-[0.24em] text-ivory-faint sm:bottom-12">
            Signal interrupted
          </span>
        </div>

        <div className="min-w-0 lg:border-l lg:border-gold-300/35 lg:pl-10">
          <p className="font-data text-xs uppercase tracking-[0.24em] text-gold-300">
            Unexpected obstacle · Error 500
          </p>
          <h1
            className="font-display mt-4 max-w-2xl text-4xl font-medium leading-[1.02] tracking-[-0.035em] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-200 sm:text-5xl lg:text-6xl"
            id="unexpected-error-title"
            ref={headingRef}
            tabIndex={-1}
          >
            Race control hit an unexpected obstacle.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ivory-dim sm:text-lg">
            A temporary fault stopped this run. The stewards have the signal; you can try the
            course again or return to the clubhouse.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {onRetry ? (
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold-300 px-6 py-3 text-sm font-bold text-turf-950 transition-colors hover:bg-gold-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-200"
                onClick={onRetry}
                type="button"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Try Again
              </button>
            ) : null}
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ivory/35 bg-turf-950/30 px-6 py-3 text-sm font-bold text-ivory transition-colors hover:border-gold-300/70 hover:bg-turf-800/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-200"
              to="/"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              Back Home
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-ivory/10 px-5 py-3 text-[0.62rem] uppercase tracking-[0.2em] text-ivory-faint sm:px-8 lg:px-12">
        <span className="font-data">Race control · Incident status 500</span>
        <span className="font-data text-gold-300/80">Safe recovery available</span>
      </footer>
    </main>
  );
}
