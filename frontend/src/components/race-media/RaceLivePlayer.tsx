import type { RaceMediaPublicResponse } from "../../types/racing";
import { YouTubeEmbed } from "./YouTubeEmbed";

export function RaceLivePlayer({ live }: { live: RaceMediaPublicResponse }) {
  const title = live.title || live.providerTitle || "Live broadcast";

  return (
    <section
      id="race-live"
      className="scroll-mt-24 border-t border-white/8 bg-turf-900 py-14 md:py-20"
      aria-labelledby="race-live-title"
    >
      <div className="mx-auto max-w-[1160px] px-6 md:px-12">
        <div className="mb-6 max-w-3xl">
          <p className="eyebrow inline-flex items-center gap-2 text-gold-300">
            <span className="live-pulse h-2 w-2 rounded-full bg-emerald-soft" aria-hidden="true" />
            Live now
          </p>
          <h2
            id="race-live-title"
            className="mt-3 font-display text-3xl font-light tracking-tight text-ivory md:text-4xl"
          >
            Live coverage is on.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ivory-dim md:text-base">{title}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gold-400/25 bg-turf-950 shadow-[0_34px_90px_-55px_rgba(0,0,0,0.95)]">
          <YouTubeEmbed
            embedUrl={live.embedUrl}
            title={title}
            thumbnailUrl={live.thumbnailUrl}
            playLabel="Watch live"
            mute
            live
          />
        </div>
      </div>
    </section>
  );
}
