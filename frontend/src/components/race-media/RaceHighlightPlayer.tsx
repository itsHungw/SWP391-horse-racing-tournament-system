import { useState } from "react";
import { ExternalLink, PlayCircle } from "lucide-react";

import type { RaceMediaPublicResponse } from "../../types/racing";

export function RaceHighlightPlayer({ highlight }: { highlight: RaceMediaPublicResponse }) {
  const [active, setActive] = useState(false);
  const title = highlight.title || highlight.providerTitle || "Race highlight";
  const watchUrl = `https://www.youtube.com/watch?v=${highlight.providerVideoId}`;

  return (
    <section id="race-highlight" className="scroll-mt-24 border-t border-white/8 bg-turf-900 py-14 md:py-20" aria-labelledby="race-highlight-title">
      <div className="mx-auto max-w-[1160px] px-6 md:px-12">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow text-gold-300">Official highlight</p>
            <h2 id="race-highlight-title" className="mt-3 font-display text-3xl font-light tracking-tight text-ivory md:text-4xl">
              Watch the replay.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ivory-dim md:text-base">
              {title}
            </p>
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
          <div className="relative aspect-video">
            {active ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`${highlight.embedUrl}?autoplay=1&rel=0&modestbranding=1`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              />
            ) : (
              <button
                type="button"
                onClick={() => setActive(true)}
                className="group absolute inset-0 flex items-center justify-center overflow-hidden text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400"
                aria-label={`Play ${title}`}
              >
                {highlight.thumbnailUrl ? (
                  <img src={highlight.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.03]" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-turf-800 via-turf-950 to-black" />
                )}
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,20,13,0.08),rgba(0,0,0,0.72))]" aria-hidden="true" />
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.14),rgba(0,0,0,0.18))]" aria-hidden="true" />
                <span className="relative inline-flex min-h-12 items-center gap-3 rounded-full border border-gold-300/60 bg-turf-950/85 px-6 text-[12px] font-bold uppercase tracking-[0.16em] text-gold-200 backdrop-blur transition-colors group-hover:bg-gold-400 group-hover:text-turf-950">
                  <PlayCircle className="h-5 w-5" aria-hidden="true" />
                  Play highlight
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
