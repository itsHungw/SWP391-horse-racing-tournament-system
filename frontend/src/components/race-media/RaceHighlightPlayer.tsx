import { ExternalLink } from "lucide-react";

import type { RaceMediaPublicResponse } from "../../types/racing";
import { YouTubeEmbed } from "./YouTubeEmbed";

export function RaceHighlightPlayer({ highlight }: { highlight: RaceMediaPublicResponse }) {
  const title = highlight.title || highlight.providerTitle || "Race highlight";
  const watchUrl = `https://www.youtube.com/watch?v=${highlight.providerVideoId}`;

  return (
    <section
      id="race-highlight"
      className="scroll-mt-24 border-t border-white/8 bg-turf-900 py-14 md:py-20"
      aria-labelledby="race-highlight-title"
    >
      <div className="mx-auto max-w-[1160px] px-6 md:px-12">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow text-gold-300">Official highlight</p>
            <h2
              id="race-highlight-title"
              className="mt-3 font-display text-3xl font-light tracking-tight text-ivory md:text-4xl"
            >
              Watch the replay.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ivory-dim md:text-base">{title}</p>
          </div>
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-sm border border-white/15 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:border-gold-400/60 hover:text-gold-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400"
          >
            Open video
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gold-400/20 bg-turf-950 shadow-[0_34px_90px_-55px_rgba(0,0,0,0.95)]">
          <YouTubeEmbed
            embedUrl={highlight.embedUrl}
            title={title}
            thumbnailUrl={highlight.thumbnailUrl}
            playLabel="Play highlight"
          />
        </div>
      </div>
    </section>
  );
}
