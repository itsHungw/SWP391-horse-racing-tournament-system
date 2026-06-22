import { Link } from "react-router-dom";

import logo from "../../assets/logo.png";
import { Eyebrow, GoldRule } from "./primitives";

const columns = [
  {
    title: "The Circuit",
    links: [
      { label: "Championships", to: "/championships" },
      { label: "Race Calendar", to: "/races" },
      { label: "Leaderboard", to: "/leaderboard" },
      { label: "Newsroom", to: "/blogs" },
    ],
  },
  {
    title: "Take Part",
    links: [
      { label: "Prediction Arena", to: "/spectator/predictions" },
      { label: "Join the Paddock", to: "/join-us" },
      { label: "Create Account", to: "/register" },
      { label: "Member Login", to: "/login" },
    ],
  },
];

const socials = [
  { label: "Instagram", short: "IG" },
  { label: "YouTube", short: "YT" },
  { label: "Facebook", short: "FB" },
  { label: "X", short: "X" },
];

export function ClientFooter() {
  return (
    <footer className="client-theme relative overflow-hidden bg-turf-950 text-ivory">
      <span className="rail-sweep absolute inset-x-0 top-0 block h-px bg-gold-600/30" aria-hidden="true" />

      <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-12 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <img src={logo} alt="" className="h-9 brightness-0 invert" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-ivory-dim">
              A premium championship racing portal. Follow the form, read the newsroom, and step into the
              Prediction Arena.
            </p>
            <div className="mt-7 flex gap-3">
              {socials.map(({ label, short }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="font-data flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-[11px] font-semibold tracking-wide text-ivory-dim transition-colors hover:border-gold-400/60 hover:text-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
                >
                  {short}
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <Eyebrow tone="gold">{col.title}</Eyebrow>
              <ul className="mt-6 space-y-3.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm font-medium text-ivory-dim transition-colors hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="rounded-2xl border border-gold-600/25 bg-turf-900/60 p-7 backdrop-blur-sm">
            <Eyebrow tone="emerald">Fair Play</Eyebrow>
            <p className="mt-5 font-display text-lg italic leading-snug text-ivory">
              Virtual points only — no real-money betting.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-ivory-faint">
              The Prediction Arena is a free-to-play spectator experience. Points are in-system rewards and
              cannot be deposited, withdrawn, sold, or converted into money.
            </p>
          </div>
        </div>

        <GoldRule className="mt-16 w-full opacity-30" />
        <div className="mt-8 flex flex-col gap-3 text-xs text-ivory-faint md:flex-row md:items-center md:justify-between">
          <p className="font-data tracking-wide">
            &copy; {new Date().getFullYear()} Horse Racing Championship System
          </p>
          <div className="flex flex-wrap gap-x-7 gap-y-2">
            {["Point Rules", "Privacy", "Ethics", "Terms"].map((item) => (
              <a key={item} href="#" className="transition-colors hover:text-ivory">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
