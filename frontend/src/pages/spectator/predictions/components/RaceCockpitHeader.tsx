import type { OpenRacePrediction, PredictionOptions } from "../types/prediction.types";

interface RaceCockpitHeaderProps {
  race: OpenRacePrediction;
  options: PredictionOptions | null;
}

function toDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatRaceDate(value: string): string {
  const date = toDate(value);
  if (!date) return "TBD";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatRaceTime(value: string): string {
  const date = toDate(value);
  if (!date) return "TBD";

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RaceCockpitHeader({ race, options }: RaceCockpitHeaderProps) {
  const isOpen = options?.predictionOpen ?? true;
  const englishStatus =
    options == null ? "Checking Availability" : isOpen ? "Prediction Open" : "Prediction Locked";
  const visibleStatus = options == null ? "Checking" : isOpen ? "Open" : "Locked";
  const statusClasses = isOpen
    ? "bg-emerald-glow/15 text-emerald-soft"
    : "bg-white/8 text-ivory-faint";
  const tournamentName = race.tournamentName?.trim() || "Happy Valley";
  const roundName = race.roundName?.trim() || "Round TBD";

  return (
    <header className="border-b border-turf-800 bg-turf-900 p-4 lg:border-b-0 lg:border-r">
      <h1 className="font-display text-[30px] font-semibold leading-none tracking-tight text-ivory lg:text-[32px]">
        {race.raceName}
      </h1>

      <div className={`mt-4 inline-flex rounded-md px-3 py-1.5 text-[13px] font-bold ${statusClasses}`}>
        <span aria-hidden="true">{visibleStatus}</span>
        <span className="sr-only">{englishStatus}</span>
      </div>

      <dl className="mt-5 space-y-3 text-[13px] font-semibold text-ivory-dim">
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-ivory">
          <dt className="sr-only">Race time</dt>
          <dd>{formatRaceTime(race.raceAt)}</dd>
          <dd className="text-ivory-faint">-</dd>
          <dt className="sr-only">Race date</dt>
          <dd>{formatRaceDate(race.raceAt)}</dd>
        </div>

        <div>
          <dt className="sr-only">Racecourse</dt>
          <dd>Racecourse: {tournamentName}</dd>
        </div>

        <div>
          <dt className="sr-only">Round</dt>
          <dd>
            Round: {roundName} <span className="text-ivory-faint">|</span> Picks: {race.totalPredictions}
          </dd>
        </div>

        <div>
          <dt className="sr-only">Prediction lock time</dt>
          <dd>
            Locks at: <span className="text-ivory">{formatRaceTime(race.raceAt)}</span>
          </dd>
        </div>
      </dl>
    </header>
  );
}
