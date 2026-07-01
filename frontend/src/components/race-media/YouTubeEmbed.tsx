import { useState } from "react";
import { PlayCircle } from "lucide-react";

type YouTubeEmbedProps = {
  embedUrl: string;
  title: string;
  thumbnailUrl?: string | null;
  playLabel?: string;
  mute?: boolean;
  live?: boolean;
};

/**
 * Facade YouTube dùng CHUNG cho highlight lẫn live: chỉ mount iframe khi người dùng bấm play
 * (nhẹ, không nạp iframe sớm — nhất là trang có nhiều video). `embedUrl` do backend dựng từ
 * videoId (youtube-nocookie) nên không bao giờ nhúng thẳng URL người dùng dán.
 */
export function YouTubeEmbed({
  embedUrl,
  title,
  thumbnailUrl,
  playLabel = "Play video",
  mute = false,
  live = false,
}: YouTubeEmbedProps) {
  const [active, setActive] = useState(false);
  // mute cho live để lách chính sách autoplay-có-tiếng của trình duyệt.
  const src = `${embedUrl}?autoplay=1&rel=0&modestbranding=1${mute ? "&mute=1" : ""}`;

  return (
    <div className="relative aspect-video">
      {active ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
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
          aria-label={`${playLabel}: ${title}`}
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-turf-800 via-turf-950 to-black" />
          )}
          <span
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,20,13,0.08),rgba(0,0,0,0.72))]"
            aria-hidden="true"
          />
          {live ? (
            <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-nyraRed px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
              <span className="live-pulse h-2 w-2 rounded-full bg-white" aria-hidden="true" />
              Live
            </span>
          ) : null}
          <span className="relative inline-flex min-h-12 items-center gap-3 rounded-full border border-gold-300/60 bg-turf-950/85 px-6 text-[12px] font-bold uppercase tracking-[0.16em] text-gold-200 backdrop-blur transition-colors group-hover:bg-gold-400 group-hover:text-turf-950">
            <PlayCircle className="h-5 w-5" aria-hidden="true" />
            {playLabel}
          </span>
        </button>
      )}
    </div>
  );
}
