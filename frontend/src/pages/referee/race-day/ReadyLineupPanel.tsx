import { PreRaceParticipant } from "./refereeRaceDayModels";

export function ReadyLineupPanel({
  participants,
  onEnterLive,
}: {
  participants: PreRaceParticipant[];
  onEnterLive: () => void;
}) {
  const eligible = participants.filter((participant) => participant.status === "PASSED");

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Starting gates</p>
      <h3 className="mt-2 text-2xl font-black text-slate-950">Starting Lineup Ready</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{eligible.length} runners cleared for Live Control.</p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {eligible.map((participant, index) => (
          <li className="rounded-xl border border-emerald-200 bg-emerald-50 p-4" key={participant.participantId}>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Gate {index + 1}</span>
            <p className="mt-1 font-black text-slate-950">{participant.horseName}</p>
          </li>
        ))}
      </ul>

      <button
        className="mt-6 min-h-12 rounded-md bg-[#007a68] px-5 text-sm font-black text-white transition hover:bg-[#006f5f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        disabled={eligible.length === 0}
        onClick={onEnterLive}
        type="button"
      >
        Confirm & Enter Live Control
      </button>
    </section>
  );
}
