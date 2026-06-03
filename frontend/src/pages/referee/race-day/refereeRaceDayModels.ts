export type WorkspaceStage = "PRE_CHECKING" | "READY" | "ONGOING" | "FINISHED_DRAFT" | "ABORTED";
export type LiveMode = "IDLE" | "RACING" | "SAFETY_CAR" | "RED_FLAGGED" | "ABORTED" | "FINISHED_DRAFT";
export type PenaltyAction = "WARNING" | "PENALTY_5S" | "DSQ";
export type VerificationDecision = "PENDING" | "PASSED" | "SCRATCHED";

export type AssignedRace = {
  id: number;
  code: string;
  name: string;
  scheduledAt: string;
  venue: string;
  distanceMeters: number;
  status: string;
};

export type PreRaceParticipant = {
  participantId: number;
  horseName: string;
  jockeyName: string;
  jockeyWeight?: number;
  equipmentOk: boolean;
  healthOk: boolean;
  equipmentDecision?: VerificationDecision;
  healthDecision?: VerificationDecision;
  status: "CHECK_HEALTH" | "PASSED" | "SCRATCHED";
  scratchedReason?: string;
};

export type LiveRunner = {
  participantId: number;
  horseName: string;
  gateNumber: number;
  progressPercent: number;
  speedMultiplier: number;
  status: "RUNNING" | "DNS" | "DNF" | "DSQ";
  finishMilliseconds?: number;
};

export type RaceIncident = {
  id: string;
  occurredAt: string;
  type: "FLAG" | "WARNING" | "PENALTY" | "DSQ";
  participantId?: number;
  message: string;
  penaltySeconds?: number;
};

export type RaceSnapshot = {
  raceId?: number;
  elapsedMilliseconds: number;
  leaderboard: LiveRunner[];
  outOfRace: LiveRunner[];
  incidents: RaceIncident[];
};

export type RaceAppealStatus = "PENDING" | "ACCEPTING" | "RESOLVED" | "REJECTING" | "REJECTED";

export type RaceAppeal = {
  id: string;
  teamName: string;
  allegation: string;
  status: RaceAppealStatus;
  penaltySeconds?: number;
  rejectionReason?: string;
};

export type LiveRaceState = {
  mode: LiveMode;
  resumeMode?: Extract<LiveMode, "RACING" | "SAFETY_CAR">;
  elapsedMilliseconds: number;
  runners: LiveRunner[];
  outOfRace: LiveRunner[];
  incidents: RaceIncident[];
};
