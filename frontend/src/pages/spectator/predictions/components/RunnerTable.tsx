import type { PredictionOptions, PredictionType } from "../types/prediction.types";
import { getPickedSlot, type Picks, formatBib, getBibClass } from "../predictionCockpitUtils";

interface RunnerTableProps {
  options: PredictionOptions;
  predType: PredictionType;
  picks: Picks;
  disabled: boolean;
  onSelectRunner: (participantId: number, position?: number) => void;
}

const slotLabels: Record<NonNullable<ReturnType<typeof getPickedSlot>>, string> = {
  winnerId: "First",
};

function formatCommunityRate(options: PredictionOptions, predType: PredictionType, runnerId: number): string {
  const runner = options.options.find((option) => option.raceParticipantId === runnerId);
  if (!runner) return "-";

  if (predType === "WINNING_STREAK") {
    const odds = runner.winOdds;
    return odds ? `x${odds.toFixed(2)}` : "-";
  }

  const visible = predType === "WINNER" && options.winnerDistributionVisible;
  if (!visible) return "-";

  const rate = runner.communityWinnerRate;
  if (rate == null) return "-";

  return `${Math.round(rate * 100)}%`;
}

function getRunnerButtonLabel(horseName: string, pickedSlot: ReturnType<typeof getPickedSlot>): string {
  if (pickedSlot) {
    return `${horseName} selected for ${slotLabels[pickedSlot]}`;
  }

  return `Choose ${horseName}`;
}

export function RunnerTable({ options, predType, picks, disabled, onSelectRunner }: RunnerTableProps) {
  if (options.options.length === 0) {
    return (
      <div className="bg-turf-900 p-8 text-center">
        <p className="font-display text-xl font-medium text-ivory">No runners available</p>
        <p className="mt-2 text-sm font-semibold text-ivory-dim">
          Runner options will appear here once this race is ready.
        </p>
      </div>
    );
  }

  const N = options.options.length;

  if (predType === "EXACT_POSITION") {
    return (
      <section className="bg-turf-900 overflow-x-auto" aria-label="Runner position selection">
        <table className="w-full border-collapse text-left min-w-[600px]">
          <thead>
            <tr className="border-b border-turf-800 bg-turf-850 font-data text-[11px] text-ivory-faint">
              <th scope="col" className="w-10 px-2 py-2 font-semibold">#</th>
              <th scope="col" className="w-[120px] px-2 py-2 font-semibold">Horse</th>
              {Array.from({ length: N }).map((_, i) => (
                <th key={i} scope="col" className="px-2 py-2 text-center font-semibold">
                  <span className="block">Pos {i + 1}</span>
                  {/* <span className="block text-[8px] uppercase tracking-[0.12em] text-ivory-faint">Pool est.</span> */}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-turf-800">
            {options.options.map((runner) => {
              const bib = formatBib(runner.startNumber, runner.laneNumber);
              const horseOdds = options.positionOddsMatrix?.[runner.raceParticipantId] || {};

              return (
                <tr key={runner.raceParticipantId} className="h-[38px] bg-turf-900 hover:bg-turf-850">
                  <td className="px-2 py-1.5">
                    <span className={`grid h-6 w-7 place-items-center rounded-[4px] font-data text-[12px] font-bold ${getBibClass(bib)}`}>
                      {bib}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <p className="truncate text-[12px] font-extrabold uppercase text-ivory">{runner.horseName}</p>
                    <p className="truncate text-[10px] text-ivory-dim">{runner.jockeyName}</p>
                  </td>
                  {Array.from({ length: N }).map((_, i) => {
                    const pos = i + 1;
                    const odds = horseOdds[pos];
                    const isPicked = picks.winnerId === runner.raceParticipantId && picks.predictedPosition === pos;

                    return (
                      <td key={pos} className="px-1 py-1.5 text-center">
                        <button
                          type="button"
                          disabled={disabled || !odds}
                          aria-pressed={isPicked}
                          aria-label={
                            odds
                              ? `Current pool estimate ${odds.toFixed(2)} for ${runner.horseName} position ${pos}`
                              : `No pool estimate for ${runner.horseName} position ${pos}`
                          }
                          title="Current pool estimate. Your payout is quoted after your stake and may change until betting locks."
                          onClick={() => onSelectRunner(runner.raceParticipantId, pos)}
                          className={`min-h-10 w-full min-w-[30px] rounded-[5px] border px-1 py-1 text-[11px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 disabled:cursor-not-allowed disabled:opacity-50 ${
                            isPicked
                              ? "border-gold-400 bg-gold-400 text-turf-900"
                              : "border-turf-800 text-gold-300 hover:border-gold-400 hover:bg-turf-800"
                          }`}
                        >
                          <span className="block font-data leading-none">{odds ? odds.toFixed(2) : "-"}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    );
  }

  return (
    <section className="bg-turf-900" aria-label="Runner selection">
      <div className="hidden lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-turf-800 bg-turf-850 font-data text-[11px] text-ivory-faint">
              <th scope="col" className="w-12 px-3 py-2 font-semibold">
                #
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Horse
              </th>
              <th scope="col" className="w-[160px] px-3 py-2 font-semibold">
                Jockey
              </th>
              <th scope="col" className="w-[132px] px-3 py-2 text-center font-semibold">
                {predType === "WINNING_STREAK" ? "Leg Odds" : "Community Picks"}
              </th>
              <th scope="col" className="w-[120px] px-3 py-2 text-center font-semibold">
                Select
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-turf-800">
            {options.options.map((runner) => {
              const pickedSlot = getPickedSlot(picks, runner.raceParticipantId);
              const picked = pickedSlot != null;
              const bib = formatBib(runner.startNumber, runner.laneNumber);

              return (
                <tr
                  key={runner.raceParticipantId}
                  className={`h-[38px] transition-colors ${
                    picked ? "bg-gold-400/10" : "bg-turf-900 hover:bg-turf-850"
                  }`}
                >
                  <td className="px-3 py-1.5">
                    <span className={`grid h-6 w-7 place-items-center rounded-[4px] font-data text-[12px] font-bold ${getBibClass(bib)}`}>
                      {bib}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="grid h-4 w-4 place-items-center text-[10px] font-black text-ivory-faint" aria-hidden="true">
                        H
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-extrabold uppercase text-ivory">{runner.horseName}</p>
                        {pickedSlot ? (
                          <p className="mt-0.5 font-data text-[9px] uppercase tracking-[0.12em] text-gold-300">
                            {slotLabels[pickedSlot]}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="truncate px-3 py-1.5 text-[12px] font-semibold text-ivory-dim">{runner.jockeyName}</td>
                  <td className="px-3 py-1.5 text-center font-data text-[13px] font-extrabold text-ivory">
                    {formatCommunityRate(options, predType, runner.raceParticipantId)}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <button
                      type="button"
                      disabled={disabled}
                      aria-pressed={picked}
                      aria-label={getRunnerButtonLabel(runner.horseName, pickedSlot)}
                      onClick={() => onSelectRunner(runner.raceParticipantId)}
                      className={`min-h-7 w-[92px] rounded-[5px] border text-[11px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-turf-900 disabled:cursor-not-allowed disabled:opacity-50 ${
                        picked
                          ? "border-gold-400 bg-gold-400 text-turf-900"
                          : "border-gold-400 text-gold-300 hover:bg-gold-400 hover:text-turf-900"
                      }`}
                    >
                      {picked ? "Selected" : "Choose"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 p-3 lg:hidden">
        {options.options.map((runner) => {
          const pickedSlot = getPickedSlot(picks, runner.raceParticipantId);
          const picked = pickedSlot != null;
          const bib = formatBib(runner.startNumber, runner.laneNumber);
          return (
            <article
              key={runner.raceParticipantId}
              className={`rounded-lg border p-3 transition-colors ${
                picked ? "border-gold-400/70 bg-gold-400/10" : "border-turf-800 bg-turf-850"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[5px] font-data text-sm font-bold ${getBibClass(bib)}`}>
                  {bib}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-extrabold uppercase text-ivory">{runner.horseName}</h3>
                  <p className="mt-0.5 truncate text-xs font-semibold text-ivory-dim">{runner.jockeyName}</p>
                </div>
                <span className="font-data text-sm font-extrabold text-ivory">
                  {formatCommunityRate(options, predType, runner.raceParticipantId)}
                </span>
              </div>
              <button
                type="button"
                disabled={disabled}
                aria-pressed={picked}
                aria-label={getRunnerButtonLabel(runner.horseName, pickedSlot)}
                onClick={() => onSelectRunner(runner.raceParticipantId)}
                className={`mt-3 min-h-9 w-full rounded-[5px] border text-xs font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-turf-900 disabled:cursor-not-allowed disabled:opacity-50 ${
                  picked
                    ? "border-gold-400 bg-gold-400 text-turf-900"
                    : "border-gold-400 text-gold-300 hover:bg-gold-400 hover:text-turf-900"
                }`}
              >
                {picked ? "Selected" : "Choose"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
