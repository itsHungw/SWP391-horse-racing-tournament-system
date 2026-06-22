import { ArrowRight, Ruler, Users } from "lucide-react";
import { Link } from "react-router-dom";

import type { RaceSummary } from "../../../types/racing";
import { groupAgendaRaces } from "../racingDiscovery";
import { formatDistance, raceStatus } from "../publicRacingData";
import { StatusPill } from "./StatusPill";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function RaceRow({ race, results }: { race: RaceSummary; results: boolean }) {
  const status = raceStatus(race.status);
  return (
    <article className="group grid gap-5 border-t border-white/10 py-6 transition-colors hover:border-gold-400/40 md:grid-cols-[100px_1fr_auto] md:items-center">
      <time className="font-data text-2xl font-semibold text-gold-200" dateTime={race.raceDateTime}>
        {formatTime(race.raceDateTime)}
      </time>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill
            tone={status.tone}
            label={results ? (race.resultOfficial ? "Official Result" : "Awaiting Official Result") : status.label}
          />
          <span className="font-data text-[10px] uppercase tracking-[0.2em] text-ivory-faint">{race.code}</span>
        </div>
        <h3 className="mt-3 font-display text-2xl font-medium tracking-tight text-ivory transition-colors group-hover:text-gold-200">
          {race.name}
        </h3>
        <p className="mt-1 text-sm text-ivory-dim">{race.tournamentName}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ivory-faint">
          <span className="inline-flex items-center gap-1.5"><Ruler size={13} /> {formatDistance(race.distanceMeters)}</span>
          <span className="inline-flex items-center gap-1.5"><Users size={13} /> {race.participantCount} runners</span>
          {results && race.winner ? <span>Winner: <strong className="text-ivory">{race.winner.horseName}</strong></span> : null}
        </div>
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
