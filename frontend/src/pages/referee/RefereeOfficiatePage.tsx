import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAssignedRaces, getRaceParticipants, savePreRaceChecks } from "../../api/refereeApi";
import { AssignedRaceTimeline } from "./race-day/AssignedRaceTimeline";
import { LiveRaceWorkspace } from "./race-day/LiveRaceWorkspace";
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
  applyLiveTick,
  applyPenalty,
  buildLiveRunners,
  createFinishedSnapshot,
  setLiveFlag,
} from "./race-day/refereeRaceDayState";
import { PreRaceChecklist } from "./race-day/PreRaceChecklist";
import { RaceSummary } from "./race-day/RaceSummary";
import { ReadyLineupPanel } from "./race-day/ReadyLineupPanel";

const EMPTY_LIVE_STATE: LiveRaceState = {
  mode: "IDLE",
  elapsedMilliseconds: 0,
  runners: [],
  outOfRace: [],
  incidents: [],
};

export function RefereeOfficiatePage() {
  const raceId = Number(useParams<{ id: string }>().id);
  const referenceNow = useMemo(() => new Date(), []);
  const [stage, setStage] = useState<WorkspaceStage>("PRE_CHECKING");
  const [races, setRaces] = useState<AssignedRace[]>([]);
  const [participants, setParticipants] = useState<PreRaceParticipant[]>([]);
  const [live, setLive] = useState<LiveRaceState>(EMPTY_LIVE_STATE);
  const [snapshot, setSnapshot] = useState<RaceSnapshot>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      const [raceRows, participantRows] = await Promise.all([
        getAssignedRaces(),
        getRaceParticipants(raceId),
      ]);
      setRaces(raceRows.map((race) => normalizeAssignedRace(race, referenceNow)));
      setParticipants(participantRows.map(normalizeParticipant));
    } catch {
      setError("Unable to load race-day operations.");
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
      setLive((current) => applyLiveTick(current, REFEREE_RACE_DAY_CONFIG.simulatorTickMilliseconds));
    }, REFEREE_RACE_DAY_CONFIG.simulatorTickMilliseconds);

    return () => window.clearInterval(timer);
  }, [live.mode, stage]);

  const confirmPreRace = async () => {
    if (participants.some((participant) => participant.status === "CHECK_HEALTH")) {
      return;
    }

    try {
      await savePreRaceChecks(
        raceId,
        participants.map((participant) => ({
          participantId: participant.participantId,
          horseName: participant.horseName,
          jockeyName: participant.jockeyName,
          jockeyWeight: participant.jockeyWeight ?? 0,
          gearOk: participant.equipmentOk,
          healthOk: participant.healthOk,
          status: participant.status === "SCRATCHED" ? "FAILED" as const : "PASSED" as const,
        }))
      );
      setStage("READY");
    } catch {
      setError("Unable to save pre-race verification.");
    }
  };

  const enterLive = () => {
    const runners = buildLiveRunners(participants);

    if (runners.length === 0) {
      setError("At least one cleared runner is required.");
      return;
    }

    setLive(setLiveFlag({ ...EMPTY_LIVE_STATE, runners }, "RACING", new Date().toISOString()));
    setStage("ONGOING");
  };

  const changeFlag = (mode: LiveRaceState["mode"]) => {
    if (mode === "ABORTED" && !window.confirm("Abort this race? This freezes the current race state.")) {
      return;
    }

    setLive((current) => setLiveFlag(current, mode, new Date().toISOString()));

    if (mode === "ABORTED") {
      setStage("ABORTED");
    }
  };

  const finish = () => {
    const flagged = setLiveFlag(live, "FINISHED_DRAFT", new Date().toISOString());
    const nextSnapshot = createFinishedSnapshot(flagged);

    if (!nextSnapshot || !window.confirm("Finish this race and store the current draft snapshot?")) {
      return;
    }

    setLive(flagged);
    setSnapshot(nextSnapshot);
    setStage("FINISHED_DRAFT");
  };

  if (loading) {
    return <p className="text-sm font-black text-slate-500">Loading race-day operations...</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6" role="alert">
        <p className="font-black text-rose-800">{error}</p>
        <button className="mt-4 min-h-11 rounded-md bg-rose-700 px-5 text-sm font-black text-white" onClick={() => void load()} type="button">Retry</button>
      </div>
    );
  }

  if (stage === "FINISHED_DRAFT" && snapshot) {
    return <RaceSummary snapshot={snapshot} />;
  }

  if (stage === "ABORTED") {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <p className="text-xs font-black uppercase tracking-widest text-rose-700">Red Flag Decision</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Race Aborted</h2>
        <p className="mt-2 text-sm text-slate-600">The final live telemetry has been frozen for review.</p>
      </section>
    );
  }

  if (stage === "ONGOING") {
    return (
      <LiveRaceWorkspace
        onFinish={finish}
        onFlag={changeFlag}
        onPenalty={(participantId: number, action: PenaltyAction) =>
          setLive((current) => applyPenalty(current, participantId, action, new Date().toISOString()))
        }
        state={live}
      />
    );
  }

  if (stage === "READY") {
    return <ReadyLineupPanel onEnterLive={enterLive} participants={participants} />;
  }

  return (
    <div>
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#007a68]">Race safety gate</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Pre-Race Operations</h2>
        </div>
        <Link className="text-sm font-black text-[#007a68] underline-offset-4 hover:underline" to="/referee">Back to Assigned Races</Link>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
        <AssignedRaceTimeline races={races} now={referenceNow} onSelectRace={() => {}} selectedRaceId={raceId} />
        <div>
          <PreRaceChecklist onChange={setParticipants} participants={participants} />
          <button
            className="mt-4 min-h-12 w-full rounded-md bg-[#007a68] px-5 text-sm font-black text-white transition hover:bg-[#006f5f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            disabled={participants.some((participant) => participant.status === "CHECK_HEALTH")}
            onClick={() => void confirmPreRace()}
            type="button"
          >
            Confirm Pre-Race Checks
          </button>
        </div>
      </div>
    </div>
  );
}
