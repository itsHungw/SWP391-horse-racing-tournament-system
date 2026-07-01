import { Link } from "react-router-dom";
import { ArrowRight, Film, PlayCircle } from "lucide-react";

import type { Race, RaceMediaPublicResponse } from "../../types/racing";

export function ChampionshipHighlightsRail({
  highlights,
  races,
}: {
  highlights: RaceMediaPublicResponse[];
  races: Race[];
}) {
  if (highlights.length === 0) return null;
  const raceById = new Map(races.map((race) => [race.id, race]));
  const [featured, ...rest] = highlights;
  const featuredRace = raceById.get(featured.raceId);
  const featuredTitle = featured.title || featured.providerTitle || featuredRace?.name || "Race highlight";

  return (
    <section className="border-y border-white/8 bg-turf-950 py-14 md:py-18" aria-labelledby="championship-highlights-title">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-gold-300">Latest highlights</p>
            <h2 id="championship-highlights-title" className="mt-3 font-display text-3xl font-light tracking-tight text-ivory md:text-4xl">
              Official replays from the card.
            </h2>
          </div>
          <span className="font-data text-xs uppercase tracking-[0.18em] text-ivory-faint">
            {highlights.length} published
          </span>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <Link
            to={`/races/${featured.raceId}#race-highlight`}
            className="group overflow-hidden rounded-2xl border border-gold-400/20 bg-turf-900 transition-colors hover:border-gold-400/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400"
            aria-label={`Watch highlight for ${featuredRace?.name ?? featuredTitle}`}
          >
            <div className="relative aspect-video bg-turf-950">
              {featured.thumbnailUrl ? (
                <img src={featured.thumbnailUrl} alt="" className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.03]" />
              ) : null}
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/24 to-transparent" aria-hidden="true" />
              <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-gold-300/50 bg-turf-950/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-200 backdrop-blur">
                <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Featured replay
              </span>
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <p className="font-display text-2xl font-medium tracking-tight text-ivory sm:text-3xl">{featuredTitle}</p>
                {featuredRace ? <p className="mt-2 text-sm text-ivory-dim">{featuredRace.name}</p> : null}
                <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-300">
                  Watch replay
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>

          <div className="grid gap-3">
            {rest.length === 0 ? (
              <div className="flex min-h-36 items-center gap-4 rounded-2xl border border-white/8 bg-turf-900/70 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-gold-200">
                  <Film size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-xl font-medium text-ivory">More replays will appear here.</p>
                  <p className="mt-1 text-sm text-ivory-dim">Published highlights are collected as races finish.</p>
                </div>
              </div>
            ) : null}

            {rest.map((highlight) => {
              const race = raceById.get(highlight.raceId);
              const title = highlight.title || highlight.providerTitle || race?.name || "Race highlight";
              return (
                <Link
                  key={highlight.raceId}
                  to={`/races/${highlight.raceId}#race-highlight`}
                  className="group grid grid-cols-[120px_1fr] overflow-hidden rounded-2xl border border-white/8 bg-turf-900 transition-colors hover:border-gold-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400 sm:grid-cols-[152px_1fr]"
                  aria-label={`Watch highlight for ${race?.name ?? title}`}
                >
                  <div className="relative min-h-28 bg-turf-950">
                    {highlight.thumbnailUrl ? (
                      <img src={highlight.thumbnailUrl} alt="" className="h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-[1.03]" />
                    ) : null}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" aria-hidden="true" />
                    <span className="absolute left-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gold-300/50 bg-turf-950/75 text-gold-200">
                      <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">Highlight</span>
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-col justify-center p-4">
                    <p className="line-clamp-2 font-display text-lg font-medium leading-tight text-ivory transition-colors group-hover:text-gold-200">{title}</p>
                    {race ? <p className="mt-1 text-sm text-ivory-dim">{race.name}</p> : null}
                    <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300">
                      Watch
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
