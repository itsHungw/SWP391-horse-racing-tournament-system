import { PreRaceParticipant, VerificationDecision } from "./refereeRaceDayModels";

type PreRaceChecklistProps = {
  participants: PreRaceParticipant[];
  onChange: (participants: PreRaceParticipant[]) => void;
};

type CheckKind = "equipment" | "health";

function statusClasses(status: PreRaceParticipant["status"]) {
  if (status === "PASSED") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "SCRATCHED") {
    return "bg-rose-100 text-rose-800";
  }

  return "bg-slate-100 text-slate-600";
}

function decisionFor(participant: PreRaceParticipant, kind: CheckKind): VerificationDecision {
  const explicit = kind === "equipment" ? participant.equipmentDecision : participant.healthDecision;

  if (explicit) {
    return explicit;
  }

  if (participant.status === "PASSED") {
    return "PASSED";
  }

  if (participant.status === "SCRATCHED") {
    return kind === "equipment"
      ? participant.equipmentOk ? "PASSED" : "SCRATCHED"
      : participant.healthOk ? "PASSED" : "SCRATCHED";
  }

  return "PENDING";
}

function nextStatus(equipmentDecision: VerificationDecision, healthDecision: VerificationDecision): PreRaceParticipant["status"] {
  if (equipmentDecision === "SCRATCHED" || healthDecision === "SCRATCHED") {
    return "SCRATCHED";
  }

  if (equipmentDecision === "PASSED" && healthDecision === "PASSED") {
    return "PASSED";
  }

  return "CHECK_HEALTH";
}

function actionClasses(decision: VerificationDecision, action: Exclude<VerificationDecision, "PENDING">) {
  if (decision === action && action === "PASSED") {
    return "border-emerald-500 bg-emerald-600 text-white shadow-sm";
  }

  if (decision === action && action === "SCRATCHED") {
    return "border-rose-500 bg-rose-600 text-white shadow-sm";
  }

  if (decision === "PENDING") {
    return "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200";
  }

  return "border-transparent bg-slate-50 text-slate-400";
}

export function PreRaceChecklist({ participants, onChange }: PreRaceChecklistProps) {
  const update = (participantId: number, patch: Partial<PreRaceParticipant>) => {
    onChange(
      participants.map((participant) =>
        participant.participantId === participantId ? { ...participant, ...patch } : participant
      )
    );
  };

  const setDecision = (participant: PreRaceParticipant, kind: CheckKind, decision: Exclude<VerificationDecision, "PENDING">) => {
    const currentEquipment = decisionFor(participant, "equipment");
    const currentHealth = decisionFor(participant, "health");
    const equipmentDecision = kind === "equipment" ? decision : currentEquipment;
    const healthDecision = kind === "health" ? decision : currentHealth;
    const status = nextStatus(equipmentDecision, healthDecision);

    update(participant.participantId, {
      equipmentDecision,
      healthDecision,
      equipmentOk: equipmentDecision === "PASSED",
      healthOk: healthDecision === "PASSED",
      status,
      scratchedReason: status === "SCRATCHED" ? participant.scratchedReason ?? "" : undefined,
    });
  };

  const renderCheck = (participant: PreRaceParticipant, kind: CheckKind) => {
    const label = kind === "equipment" ? "Equipment" : "Health";
    const decision = decisionFor(participant, kind);

    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-xs font-black text-slate-700">{label}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            aria-label={`Pass ${kind} check for ${participant.horseName}`}
            aria-pressed={decision === "PASSED"}
            className={`min-h-11 rounded-md border px-3 text-xs font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68] ${actionClasses(decision, "PASSED")}`}
            onClick={() => setDecision(participant, kind, "PASSED")}
            type="button"
          >
            Passed
          </button>
          <button
            aria-label={`Fail ${kind} check for ${participant.horseName}`}
            aria-pressed={decision === "SCRATCHED"}
            className={`min-h-11 rounded-md border px-3 text-xs font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f1d1d] ${actionClasses(decision, "SCRATCHED")}`}
            onClick={() => setDecision(participant, kind, "SCRATCHED")}
            type="button"
          >
            Scratch
          </button>
        </div>
      </div>
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
              {renderCheck(participant, "equipment")}
              {renderCheck(participant, "health")}
            </div>

            {participant.status === "SCRATCHED" ? (
              <label className="mt-3 block rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                Audit reason for {participant.horseName}
                <input
                  aria-label={`Audit reason for ${participant.horseName}`}
                  aria-describedby={`audit-reason-help-${participant.participantId}`}
                  className="mt-2 min-h-11 w-full rounded-md border border-rose-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  onChange={(event) => update(participant.participantId, { scratchedReason: event.target.value })}
                  placeholder="Enter veterinary or equipment reason"
                  required
                  type="text"
                  value={participant.scratchedReason ?? ""}
                />
                <span className="mt-1 block text-[11px] text-rose-600" id={`audit-reason-help-${participant.participantId}`}>
                  Required before the race can move to Live Control.
                </span>
              </label>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
