import { ArrowRight, Ruler, Users } from "lucide-react";
import { Link } from "react-router-dom";

import type { RaceSummary } from "../../../types/racing";
import { groupAgendaRaces } from "../racingDiscovery";
import { formatDistance, raceStatus } from "../publicRacingData";
import { MetaDot } from "./MetaDot";
import { StatusPill } from "./StatusPill";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function RaceRow({ race, results }: { race: RaceSummary; results: boolean }) {
  const status = raceStatus(race.status);
  // formatDistance trả null khi race chưa có cự ly. Trong dòng meta ngăn bằng dấu chấm
  // thì một mẩu rỗng sẽ đọc thành "Giải · · 8 runners" — bỏ hẳn mẩu đó thay vì để trống.
  const distance = formatDistance(race.distanceMeters);
  return (
    // `items-start` chứ KHÔNG phải `items-center`: giờ đua là mỏ neo thị giác của row.
    // Căn giữa khiến nó trôi xuống 46px so với đỉnh row, và trôi mỗi row một khác tuỳ
    // nội dung cao thấp — mắt mất đường kẻ để bám khi quét dọc, các row dính vào nhau.
    // Kẻ phân cách cũng nâng 10% → 18% (1.28:1 → 1.69:1 đo bằng canvas trên turf-950).
    <article className="group grid gap-x-6 gap-y-4 border-t border-white/[0.18] py-7 transition-colors hover:border-gold-400/50 md:grid-cols-[112px_1fr_auto] md:items-start">
      <div>
        <time className="block font-data text-2xl font-semibold leading-none text-gold-200" dateTime={race.raceDateTime}>
          {formatTime(race.raceDateTime)}
        </time>
        <span className="mt-2 block font-data text-[10px] uppercase tracking-[0.2em] text-ivory-faint">{race.code}</span>
      </div>
      <div className="min-w-0">
        <StatusPill
          tone={status.tone}
          label={results ? (race.resultOfficial ? "Official Result" : "Awaiting Official Result") : status.label}
        />
        <h3 className="mt-2.5 font-display text-2xl font-medium tracking-tight text-ivory transition-colors group-hover:text-gold-200">
          {race.name}
        </h3>
        {/* Một dòng meta chạy chữ thay cho ba khối xếp chồng: row thấp xuống nên
            khoảng trắng giữa hai row mới đọc ra là ranh giới, không phải nhịp thở nữa. */}
        <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ivory-dim">
          <span className="truncate">{race.tournamentName}</span>
          {distance ? (
            <>
              <MetaDot />
              <span className="inline-flex items-center gap-1.5"><Ruler size={13} aria-hidden="true" /> {distance}</span>
            </>
          ) : null}
          <MetaDot />
          <span className="inline-flex items-center gap-1.5"><Users size={13} aria-hidden="true" /> {race.participantCount} runners</span>
          {results && race.winner ? (
            <>
              <MetaDot />
              <span>Winner <strong className="font-semibold text-ivory">{race.winner.horseName}</strong></span>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex flex-wrap gap-3 md:justify-end">
        {!results && race.predictionOpen ? (
          <Link
            to={`/spectator/predictions?raceId=${race.id}`}
            className="inline-flex min-h-11 items-center border border-emerald-glow/50 px-4 text-xs font-bold uppercase tracking-[0.14em] text-emerald-soft transition-colors hover:bg-emerald-glow hover:text-turf-950"
          >
            Predict
          </Link>
        ) : null}
        <Link
          to={`/races/${race.id}`}
          className="inline-flex min-h-11 items-center gap-2 border border-white/15 px-4 text-xs font-bold uppercase tracking-[0.14em] text-ivory transition-colors hover:border-gold-400/60 hover:text-gold-200"
        >
          {results && race.resultOfficial ? "Full Result" : "Race Card"} <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

export function RaceAgenda({ races, results = false }: { races: RaceSummary[]; results?: boolean }) {
  const groups = results
    ? [{ key: "results", label: "Latest Results", races }]
    : groupAgendaRaces(races);
  return (
    <div className="space-y-14">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`agenda-${group.key}`} className="grid gap-6 lg:grid-cols-[210px_1fr]">
          <div>
            <h2 id={`agenda-${group.key}`} className="font-display text-3xl font-light tracking-tight text-ivory">
              {group.label}
            </h2>
            <p className="font-data mt-2 text-[10px] uppercase tracking-[0.2em] text-ivory-faint">
              {String(group.races.length).padStart(2, "0")} races
            </p>
          </div>
          <div>{group.races.map((race) => <RaceRow key={race.id} race={race} results={results} />)}</div>
        </section>
      ))}
    </div>
  );
}
