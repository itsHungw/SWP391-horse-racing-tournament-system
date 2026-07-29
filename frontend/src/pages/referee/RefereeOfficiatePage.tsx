import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Flag,
} from "lucide-react";
import {
  finishRace,
  getAssignedRace,
  getRaceParticipants,
  savePreRaceChecks,
  startRace,
} from "../../api/refereeApi";
import { normalizeAssignedRace, normalizeParticipant } from "./race-day/refereeRaceDayAdapter";
import { REFEREE_RACE_DAY_CONFIG } from "./race-day/refereeRaceDayConfig";
import {
  AssignedRace,
  LiveRaceState,
  PenaltyAction,
  PreRaceParticipant,
  RaceSnapshot,
  WorkspaceStage,
} from "./race-day/refereeRaceDayModels";
import {
  advanceLiveClock,
  applyPenalty,
  buildLiveRunners,
  buildScratchedRunners,
  createFinishedSnapshot,
  markRunnerFinished,
  setLiveFlag,
} from "./race-day/refereeRaceDayState";
import { LiveRaceWorkspace } from "./race-day/LiveRaceWorkspace";
import { PreRaceChecklist } from "./race-day/PreRaceChecklist";
import { RaceSummary } from "./race-day/RaceSummary";
import { ReadyLineupPanel } from "./race-day/ReadyLineupPanel";
import {
  formatRaceDate,
  formatRaceTime,
  getRaceAction,
  getRaceStatusMeta,
  statusChipClasses,
} from "./refereeUi";

const EMPTY_LIVE_STATE: LiveRaceState = {
  mode: "IDLE",
  elapsedMilliseconds: 0,
  runners: [],
  outOfRace: [],
  incidents: [],
};

function stageFromRaceStatus(status?: string): WorkspaceStage {
  if (status === "READY") return "READY";
  if (status === "ONGOING") return "ONGOING";
  if (status === "FINISHED" || status === "RESULT_SUBMITTED" || status === "RESULT_CONFIRMED" || status === "PUBLISHED") {
    return "FINISHED_DRAFT";
  }
  return "PRE_CHECKING";
}

function ActionStep({
  active,
  done,
  label,
}: {
  active?: boolean;
  done?: boolean;
  label: string;
}) {
  return (
    <div
      className={[
        "flex min-h-12 min-w-[132px] items-center gap-3 rounded-lg border px-4 text-sm font-black lg:min-w-0",
        active ? "border-[#007a68] bg-[#effbf7] text-[#006f5f]" : "",
        done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "",
        !active && !done ? "border-slate-200 bg-white text-slate-500" : "",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-7 w-7 items-center justify-center rounded-full text-xs",
          active ? "bg-[#007a68] text-white" : "",
          done ? "bg-emerald-600 text-white" : "",
          !active && !done ? "bg-slate-100 text-slate-500" : "",
        ].join(" ")}
      >
        {done ? "OK" : active ? ">" : ""}
      </span>
      {label}
    </div>
  );
}

export function RefereeOfficiatePage() {
  const raceId = Number(useParams<{ id: string }>().id);
  const referenceNow = useMemo(() => new Date(), []);
  const [stage, setStage] = useState<WorkspaceStage>("PRE_CHECKING");
  const [race, setRace] = useState<AssignedRace>();
  const [participants, setParticipants] = useState<PreRaceParticipant[]>([]);
  const [live, setLive] = useState<LiveRaceState>(EMPTY_LIVE_STATE);
  const [snapshot, setSnapshot] = useState<RaceSnapshot>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const lastTickAtRef = useRef(Date.now());

  const flushClock = useCallback((current: LiveRaceState) => {
    const now = Date.now();
    const next = advanceLiveClock(current, lastTickAtRef.current, now);
    lastTickAtRef.current = now;
    return next;
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      const [raceRow, participantRows] = await Promise.all([
        getAssignedRace(raceId),
        getRaceParticipants(raceId),
      ]);
      const normalizedRace = normalizeAssignedRace(raceRow, referenceNow);
      const normalizedParticipants = participantRows.map(normalizeParticipant);
      setRace(normalizedRace);
      setParticipants(normalizedParticipants);
      setStage(stageFromRaceStatus(normalizedRace.status));

      if (normalizedRace.status === "ONGOING") {
        lastTickAtRef.current = Date.now();
        setLive(
          setLiveFlag(
            {
              ...EMPTY_LIVE_STATE,
              runners: buildLiveRunners(normalizedParticipants),
              outOfRace: buildScratchedRunners(normalizedParticipants),
            },
            "RACING",
            new Date().toISOString()
          )
        );
      }
    } catch {
      setError("Unable to load race control.");
    } finally {
      setLoading(false);
    }
  }, [raceId, referenceNow]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (stage !== "ONGOING" || (live.mode !== "RACING" && live.mode !== "SAFETY_CAR")) {
      return;
    }

    const timer = window.setInterval(() => {
      setLive((current) => flushClock(current));
    }, REFEREE_RACE_DAY_CONFIG.operationTickMilliseconds);

    return () => window.clearInterval(timer);
  }, [live.mode, stage, flushClock]);

  const checksBlocked = participants.some(
    (participant) =>
      participant.status === "CHECK_HEALTH" ||
      (participant.status === "SCRATCHED" && !participant.scratchedReason?.trim())
  );

  const confirmPreRace = async () => {
    if (checksBlocked) return;

    try {
      setSaving(true);
      setError(undefined);
      await savePreRaceChecks(
        raceId,
        participants.map((participant) => ({
          participantId: participant.participantId,
          horseName: participant.horseName,
          jockeyName: participant.jockeyName,
          jockeyWeight: participant.jockeyWeight ?? 0,
          gearOk: participant.equipmentOk,
          healthOk: participant.healthOk,
          status: participant.status === "SCRATCHED" ? ("FAILED" as const) : ("PASSED" as const),
        }))
      );
      setRace((current) => (current ? { ...current, status: "READY" } : current));
      setStage("READY");
    } catch {
      setError("Unable to save pre-race checks.");
    } finally {
      setSaving(false);
    }
  };

  const enterLive = async () => {
    const runners = buildLiveRunners(participants);

    if (runners.length === 0) {
      setError("At least one cleared runner is required.");
      return;
    }

    try {
      setSaving(true);
      setError(undefined);
      await startRace(raceId);
      lastTickAtRef.current = Date.now();
      setLive(
        setLiveFlag(
          { ...EMPTY_LIVE_STATE, runners, outOfRace: buildScratchedRunners(participants) },
          "RACING",
          new Date().toISOString()
        )
      );
      setRace((current) => (current ? { ...current, status: "ONGOING" } : current));
      setStage("ONGOING");
    } catch {
      setError("Unable to start this race.");
    } finally {
      setSaving(false);
    }
  };

  const changeFlag = (mode: LiveRaceState["mode"]) => {
    if (mode === "ABORTED" && !window.confirm("Abort this race? This freezes the current race state.")) {
      return;
    }

    setLive((current) => setLiveFlag(flushClock(current), mode, new Date().toISOString()));

    if (mode === "ABORTED") {
      setStage("ABORTED");
    }
  };

  const proceedToPostRace = async () => {
    const nextSnapshot = createFinishedSnapshot(live);

    if (!nextSnapshot) return;

    try {
      setSaving(true);
      setError(undefined);
      await finishRace(raceId);
      setSnapshot(nextSnapshot);
      setRace((current) => (current ? { ...current, status: "FINISHED" } : current));
      setStage("FINISHED_DRAFT");
    } catch {
      setError("Unable to finish this race.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="max-w-[1486px] space-y-5" aria-label="Loading race control">
        <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </section>
    );
  }

  if (!race) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6" role="alert">
        <p className="font-black text-rose-800">{error || "Race control is unavailable."}</p>
        <button className="mt-4 min-h-11 rounded-lg bg-rose-700 px-5 text-sm font-black text-white" onClick={() => void load()} type="button">
          Retry
        </button>
      </div>
    );
  }

  const meta = getRaceStatusMeta(race.status);
  const StatusIcon = meta.icon;
  const action = getRaceAction(race);
  const mobilePrimaryAction =
    stage === "PRE_CHECKING"
      ? {
          label: saving ? "Saving checks..." : "Continue: Mark race ready",
          disabled: checksBlocked || saving,
          onClick: () => void confirmPreRace(),
          to: undefined,
        }
      : stage === "READY"
        ? {
            label: saving ? "Starting race..." : "Continue: Start race",
            disabled: saving,
            onClick: () => void enterLive(),
            to: undefined,
          }
        : stage === "FINISHED_DRAFT"
          ? {
              label: "Continue: Submit results",
              disabled: false,
              onClick: undefined,
              to: `/referee/races/${raceId}/results`,
            }
          : undefined;

  if (stage === "ABORTED") {
    return (
      <section className="max-w-[1486px] rounded-xl border border-rose-200 bg-rose-50 p-6">
        <p className="text-xs font-black uppercase tracking-widest text-rose-700">Red flag decision</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Race aborted</h2>
        <p className="mt-2 text-sm text-slate-600">The current race operation state has been frozen for review.</p>
      </section>
    );
  }

  return (
    <section className="max-w-[1486px] space-y-5 pb-20 lg:pb-0" aria-labelledby="race-control-title">
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
              to="/referee/assigned-races"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Today's races
            </Link>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-[#007a68]">Race control</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl" id="race-control-title">
              {race.name}
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {formatRaceDate(race.scheduledAt)} at {formatRaceTime(race.scheduledAt)} | {race.venue} | {race.distanceMeters}m
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-black uppercase ${statusChipClasses(race.status)}`}>
              <StatusIcon aria-hidden="true" className="h-5 w-5" />
              {meta.label}
            </span>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Next action</p>
              <p className="mt-1 text-sm font-black text-slate-950">{action.label}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
          <ActionStep active={stage === "PRE_CHECKING"} done={stage !== "PRE_CHECKING"} label="Checks" />
          <ActionStep active={stage === "READY"} done={stage === "ONGOING" || stage === "FINISHED_DRAFT"} label="Ready" />
          <ActionStep active={stage === "ONGOING"} done={stage === "FINISHED_DRAFT"} label="Live" />
          <ActionStep active={stage === "FINISHED_DRAFT"} label="Results" />
          <ActionStep done={race.status === "RESULT_CONFIRMED" || race.status === "PUBLISHED"} label="Confirmed" />
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4" role="alert">
          <p className="font-black text-rose-800">{error}</p>
        </div>
      ) : null}

      {stage === "ONGOING" ? (
        <LiveRaceWorkspace
          onFinish={() => void proceedToPostRace()}
          onFlag={changeFlag}
          onPenalty={(participantId: number, penaltyAction: PenaltyAction) =>
            setLive((current) => applyPenalty(current, participantId, penaltyAction, new Date().toISOString()))
          }
          onRunnerFinish={(participantId: number) =>
            setLive((current) => markRunnerFinished(flushClock(current), participantId, new Date().toISOString()))
          }
          race={race}
          state={live}
        />
      ) : null}

      {stage === "READY" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <CheckCircle2 aria-hidden="true" className="h-6 w-6 text-[#007a68]" />
            <div>
              <h2 className="text-2xl font-black text-slate-950">Field cleared</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                All required checks are complete. Start the race when the venue is cleared.
              </p>
            </div>
          </div>
          <ReadyLineupPanel onEnterLive={() => void enterLive()} participants={participants} />
          {saving ? <p className="mt-3 text-sm font-black text-slate-500">Starting race...</p> : null}
        </div>
      ) : null}

      {stage === "PRE_CHECKING" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
              <ClipboardCheck aria-hidden="true" className="h-6 w-6 text-[#007a68]" />
              <div>
                <h2 className="text-2xl font-black text-slate-950">Pre-race checks</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Verify gear and health before clearing the field.
                </p>
              </div>
            </div>
            <PreRaceChecklist onChange={setParticipants} participants={participants} />
            <button
              className="mt-4 hidden min-h-12 w-full items-center justify-center rounded-lg bg-[#007a68] px-5 text-sm font-black text-white transition hover:bg-[#006f5f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68] lg:inline-flex"
              disabled={checksBlocked || saving}
              onClick={() => void confirmPreRace()}
              type="button"
            >
              {saving ? "Saving checks..." : "Mark race ready"}
            </button>
        </div>
      ) : null}

      {stage === "FINISHED_DRAFT" ? (
        snapshot ? (
          <RaceSummary raceId={raceId} snapshot={snapshot} />
        ) : (
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Flag aria-hidden="true" className="h-6 w-6 text-slate-600" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#007a68]">Race finished</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Result package is the next step</h2>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              The finish order, anything riders raised at weigh-in, and your report are all recorded on the result
              package screen, then submitted to the organizer together.
            </p>
            <div className="mt-5">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#007a68] px-5 text-sm font-black text-white transition hover:bg-[#006f5f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
                to={`/referee/races/${raceId}/results`}
              >
                Continue to result package
              </Link>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Noticed something separate from the result?{" "}
              <Link className="font-black text-[#007a68] underline" to={`/referee/races/${raceId}/report`}>
                Log a race incident
              </Link>
              .
            </p>
          </article>
        )
      ) : null}

      {saving && stage === "ONGOING" ? (
        <p className="text-sm font-black text-slate-500">Updating race state...</p>
      ) : null}

      {mobilePrimaryAction ? (
        <div className="fixed inset-x-3 bottom-24 z-40 rounded-2xl border border-emerald-900/15 bg-white/95 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.22)] backdrop-blur-md lg:hidden">
          {mobilePrimaryAction.to ? (
            <Link
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#007a68] px-5 text-sm font-black text-white shadow-sm transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
              to={mobilePrimaryAction.to}
            >
              {mobilePrimaryAction.label}
            </Link>
          ) : (
            <button
              className="min-h-[52px] w-full rounded-xl bg-[#007a68] px-5 text-sm font-black text-white shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
              disabled={mobilePrimaryAction.disabled}
              onClick={mobilePrimaryAction.onClick}
              type="button"
            >
              {mobilePrimaryAction.label}
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
