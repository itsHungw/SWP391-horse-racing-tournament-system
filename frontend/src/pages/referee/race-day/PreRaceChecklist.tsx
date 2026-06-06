import { useMemo, useState } from "react";
import { CheckCircle2, Circle, ShieldAlert, XCircle } from "lucide-react";
import { PreRaceParticipant, VerificationDecision } from "./refereeRaceDayModels";

type PreRaceChecklistProps = {
  participants: PreRaceParticipant[];
  onChange: (participants: PreRaceParticipant[]) => void;
};

type CheckKind = "equipment" | "health";

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

function participantState(participant: PreRaceParticipant) {
  if (participant.status === "PASSED") {
    return {
      label: "Cleared",
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (participant.status === "SCRATCHED") {
    return {
      label: "Scratched",
      icon: XCircle,
      className: "border-rose-200 bg-rose-50 text-rose-800",
    };
  }

  return {
    label: "Pending inspection",
    icon: Circle,
    className: "border-slate-200 bg-white text-slate-600",
  };
}

function decisionButtonClasses(active: boolean, tone: "pass" | "fail") {
  if (active && tone === "pass") {
    return "border-emerald-600 bg-emerald-600 text-white";
  }

  if (active && tone === "fail") {
    return "border-rose-600 bg-rose-600 text-white";
  }

  return "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
}

export function PreRaceChecklist({ participants, onChange }: PreRaceChecklistProps) {
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | undefined>(
    participants[0]?.participantId
  );

  const selectedParticipant = useMemo(
    () =>
      participants.find((participant) => participant.participantId === selectedParticipantId) ??
      participants[0],
    [participants, selectedParticipantId]
  );

  const clearedCount = participants.filter((participant) => participant.status === "PASSED").length;
  const scratchedCount = participants.filter((participant) => participant.status === "SCRATCHED").length;
  const pendingCount = participants.length - clearedCount - scratchedCount;

  const update = (participantId: number, patch: Partial<PreRaceParticipant>) => {
    onChange(
      participants.map((participant) =>
        participant.participantId === participantId ? { ...participant, ...patch } : participant
      )
    );
  };

  const setDecision = (
    participant: PreRaceParticipant,
    kind: CheckKind,
    decision: Exclude<VerificationDecision, "PENDING">
  ) => {
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

  const renderDecisionRow = (participant: PreRaceParticipant, kind: CheckKind) => {
    const label = kind === "equipment" ? "Equipment verification" : "Health verification";
    const decision = decisionFor(participant, kind);

    return (
      <div className="border-t border-slate-100 py-4 first:border-t-0 first:pt-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">{label}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Mark this check before clearing the participant.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-[260px]">
            <button
              aria-label={`Pass ${kind} check for ${participant.horseName}`}
              aria-pressed={decision === "PASSED"}
              className={`min-h-11 rounded-md border px-3 text-xs font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68] ${decisionButtonClasses(decision === "PASSED", "pass")}`}
              onClick={() => setDecision(participant, kind, "PASSED")}
              type="button"
            >
              Verified
            </button>
            <button
              aria-label={`Fail ${kind} check for ${participant.horseName}`}
              aria-pressed={decision === "SCRATCHED"}
              className={`min-h-11 rounded-md border px-3 text-xs font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f1d1d] ${decisionButtonClasses(decision === "SCRATCHED", "fail")}`}
              onClick={() => setDecision(participant, kind, "SCRATCHED")}
              type="button"
            >
              Fail
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!selectedParticipant) {
    return (
      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm font-semibold text-slate-500">
        No participants are available for pre-race inspection.
      </section>
    );
  }

  const selectedState = participantState(selectedParticipant);
  const SelectedStateIcon = selectedState.icon;

  return (
    <section aria-labelledby="pre-race-checklist-title" className="space-y-5">
      <div className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">
              Inspection workflow
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950" id="pre-race-checklist-title">
              Pre-race inspection
            </h3>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Clear each participant through equipment and health verification before the race can start.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:w-[360px]">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
              <p className="text-lg font-black text-emerald-800">{clearedCount}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Cleared</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="text-lg font-black text-slate-900">{pendingCount}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Pending</p>
            </div>
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-center">
              <p className="text-lg font-black text-rose-800">{scratchedCount}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-700">Scratched</p>
            </div>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#007a68] transition-all"
            style={{ width: participants.length ? `${(clearedCount / participants.length) * 100}%` : "0%" }}
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.88fr)_minmax(0,1.12fr)]">
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Verification queue
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {participants.map((participant, index) => {
              const state = participantState(participant);
              const StateIcon = state.icon;
              const selected = participant.participantId === selectedParticipant.participantId;

              return (
                <button
                  aria-pressed={selected}
                  className={`grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#007a68] ${
                    selected ? "bg-[#f4fbf8]" : "bg-white"
                  }`}
                  key={participant.participantId}
                  onClick={() => setSelectedParticipantId(participant.participantId)}
                  type="button"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-xs font-black text-slate-500">
                    G{index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-slate-950">{participant.horseName}</span>
                    <span className="mt-1 block truncate text-xs font-semibold text-slate-500">{participant.jockeyName}</span>
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-black uppercase ${state.className}`}>
                    <StateIcon aria-hidden="true" className="h-3.5 w-3.5" />
                    {state.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#007a68]">
                Active inspection
              </p>
              <h4 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {selectedParticipant.horseName}
              </h4>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Jockey: {selectedParticipant.jockeyName}
                {selectedParticipant.jockeyWeight ? ` | ${selectedParticipant.jockeyWeight}kg` : ""}
              </p>
            </div>
            <span className={`inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-xs font-black uppercase ${selectedState.className}`}>
              <SelectedStateIcon aria-hidden="true" className="h-4 w-4" />
              {selectedState.label}
            </span>
          </div>

          <div className="py-2">
            {renderDecisionRow(selectedParticipant, "equipment")}
            {renderDecisionRow(selectedParticipant, "health")}
          </div>

          {selectedParticipant.status === "SCRATCHED" ? (
            <label className="mt-2 block rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs font-black text-rose-800">
              Scratch reason
              <input
                aria-label={`Audit reason for ${selectedParticipant.horseName}`}
                aria-describedby={`audit-reason-help-${selectedParticipant.participantId}`}
                className="mt-2 min-h-11 w-full rounded-md border border-rose-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                onChange={(event) =>
                  update(selectedParticipant.participantId, { scratchedReason: event.target.value })
                }
                placeholder="Enter veterinary or equipment reason"
                required
                type="text"
                value={selectedParticipant.scratchedReason ?? ""}
              />
              <span className="mt-2 block text-[11px] font-semibold leading-5 text-rose-700" id={`audit-reason-help-${selectedParticipant.participantId}`}>
                Required before the race can move to Live Control.
              </span>
            </label>
          ) : null}

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert aria-hidden="true" className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="text-sm font-black text-slate-950">Ready rule</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  Equipment and health must both be verified, or a scratch reason must be recorded.
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
