import { PreRaceParticipant } from "./refereeRaceDayModels";

type PreRaceChecklistProps = {
  participants: PreRaceParticipant[];
  onChange: (participants: PreRaceParticipant[]) => void;
};

function statusClasses(status: PreRaceParticipant["status"]) {
  if (status === "PASSED") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "SCRATCHED") {
    return "bg-rose-100 text-rose-800";
  }

  return "bg-amber-100 text-amber-800";
}

export function PreRaceChecklist({ participants, onChange }: PreRaceChecklistProps) {
  const update = (participantId: number, patch: Partial<PreRaceParticipant>) => {
    onChange(
      participants.map((participant) =>
        participant.participantId === participantId ? { ...participant, ...patch } : participant
      )
    );
  };

  return (
    <section aria-labelledby="pre-race-checklist-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Veterinary gate</p>
        <h3 className="mt-2 text-xl font-black text-slate-950" id="pre-race-checklist-title">Pre-Race Verification</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">Clear equipment and health checks before the starting lineup enters Live Control.</p>
      </div>

      <div className="mt-4 space-y-3">
        {participants.map((participant, index) => (
          <article className="rounded-xl border border-slate-200 bg-[#fbfdfe] p-4" key={participant.participantId}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Gate {index + 1}</p>
                <h4 className="mt-1 font-black text-slate-950">{participant.horseName}</h4>
                <p className="mt-1 text-xs font-semibold text-slate-500">{participant.jockeyName}</p>
              </div>
              <span className={`w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${statusClasses(participant.status)}`}>
                {participant.status === "CHECK_HEALTH" ? "Check Health" : participant.status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs font-black text-slate-700">Equipment</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    aria-pressed={participant.equipmentOk}
                    className="min-h-11 rounded-md bg-emerald-50 px-3 text-xs font-black text-emerald-800"
                    onClick={() =>
                      update(participant.participantId, {
                        equipmentOk: true,
                        status: participant.healthOk ? "PASSED" : "CHECK_HEALTH",
                        scratchedReason: undefined,
                      })
                    }
                    type="button"
                  >
                    Passed
                  </button>
                  <button
                    aria-label={`Fail equipment check for ${participant.horseName}`}
                    className="min-h-11 rounded-md bg-rose-50 px-3 text-xs font-black text-rose-800"
                    onClick={() =>
                      update(participant.participantId, {
                        equipmentOk: false,
                        status: "SCRATCHED",
                        scratchedReason: "Failed equipment check",
                      })
                    }
                    type="button"
                  >
                    Scratch
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs font-black text-slate-700">Health</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    aria-pressed={participant.healthOk}
                    className="min-h-11 rounded-md bg-emerald-50 px-3 text-xs font-black text-emerald-800"
                    onClick={() =>
                      update(participant.participantId, {
                        healthOk: true,
                        status: participant.equipmentOk ? "PASSED" : "CHECK_HEALTH",
                        scratchedReason: undefined,
                      })
                    }
                    type="button"
                  >
                    Passed
                  </button>
                  <button
                    aria-label={`Fail health check for ${participant.horseName}`}
                    className="min-h-11 rounded-md bg-rose-50 px-3 text-xs font-black text-rose-800"
                    onClick={() =>
                      update(participant.participantId, {
                        healthOk: false,
                        status: "SCRATCHED",
                        scratchedReason: "Failed health check",
                      })
                    }
                    type="button"
                  >
                    Scratch
                  </button>
                </div>
              </div>
            </div>

            {participant.scratchedReason ? (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                Audit reason: {participant.scratchedReason}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
