export type ChampionshipStatus = "OPEN_ENROLLMENT" | "ENROLLED" | "COMMITTED" | "COMPLETED";
export type ContractStatus = "PENDING" | "COMMITTED" | "REJECTED";
export type RoundStatus = "FINISHED" | "NEXT" | "UPCOMING" | "LOCKED" | "CANCELLED";

export type JockeyChampionship = {
  id: string;
  name: string;
  track: string;
  location: string;
  season: string;
  seasonStart: string;
  seasonEnd: string;
  rounds: number;
  enrollmentDeadline: string;
  enrollmentStatus: "Open Enrollment" | "Enrolled" | "Enrollment Closed";
  commitmentStatus: "Enrolled" | "Contract Pending" | "Committed" | "Completed";
  horse: string;
  stable: string;
  rank: string;
  points: number;
  gapToLeader: string;
  nextRoundId: string;
};

export type JockeyRound = {
  id: string;
  championshipId: string;
  roundNumber: number;
  raceName: string;
  date: string;
  time: string;
  track: string;
  distance: string;
  purse: string;
  surface: string;
  horse: string;
  stable: string;
  status: RoundStatus;
  position?: string;
  points?: number;
  note: string;
};

export type JockeyContract = {
  id: string;
  stable: string;
  owner: string;
  horse: string;
  championship: string;
  championshipId: string;
  rounds: number;
  season: string;
  message: string;
  terms: string[];
  agreementFileName: string;
  agreementFileSize: string;
  agreementUpdatedAt: string;
  activityLabel: string;
  responseDeadline: string;
  status: ContractStatus;
  hasConflict?: boolean;
  isUnread?: boolean;
};

export type CareerRecord = {
  officialStarts: number;
  wins: number;
  top3Finishes: number;
  top3Rate: string;
  championshipsJoined: number;
  championshipsWon: number;
};

export const jockeyChampionships: JockeyChampionship[] = [
  {
    id: "summer-2026",
    name: "Summer Championship 2026",
    track: "Belmont Park",
    location: "New York",
    season: "Jun 1 - Aug 20, 2026",
    seasonStart: "2026-06-01",
    seasonEnd: "2026-08-20",
    rounds: 8,
    enrollmentDeadline: "May 24, 2026",
    enrollmentStatus: "Enrolled",
    commitmentStatus: "Committed",
    horse: "Thunder Bolt",
    stable: "Sunrise Stable",
    rank: "#3",
    points: 42,
    gapToLeader: "-8 pts",
    nextRoundId: "summer-r4",
  },
  {
    id: "autumn-2026",
    name: "Autumn Cup 2026",
    track: "Aqueduct Racetrack",
    location: "Queens",
    season: "Sep 5 - Nov 14, 2026",
    seasonStart: "2026-09-05",
    seasonEnd: "2026-11-14",
    rounds: 6,
    enrollmentDeadline: "Aug 18, 2026",
    enrollmentStatus: "Open Enrollment",
    commitmentStatus: "Enrolled",
    horse: "Unassigned",
    stable: "Open Pool",
    rank: "Unranked",
    points: 0,
    gapToLeader: "0 pts",
    nextRoundId: "autumn-r1",
  },
];

export const jockeyRounds: JockeyRound[] = [
  {
    id: "summer-r1",
    championshipId: "summer-2026",
    roundNumber: 1,
    raceName: "Beverly R. Steinman Stakes",
    date: "2026-06-03",
    time: "12:35 PM",
    track: "Belmont Park",
    distance: "1 Mile",
    purse: "$150,000",
    surface: "Turf",
    horse: "Thunder Bolt",
    stable: "Sunrise Stable",
    status: "FINISHED",
    position: "2nd",
    points: 8,
    note: "Clean start, strong finish through final stretch.",
  },
  {
    id: "summer-r2",
    championshipId: "summer-2026",
    roundNumber: 2,
    raceName: "Intercontinental Stakes",
    date: "2026-06-04",
    time: "12:35 PM",
    track: "Belmont Park",
    distance: "7 Furlongs",
    purse: "$250,000",
    surface: "Turf",
    horse: "Thunder Bolt",
    stable: "Sunrise Stable",
    status: "FINISHED",
    position: "1st",
    points: 10,
    note: "Won by late acceleration after turn three.",
  },
  {
    id: "summer-r3",
    championshipId: "summer-2026",
    roundNumber: 3,
    raceName: "DraftKings Acorn",
    date: "2026-06-05",
    time: "11:45 AM",
    track: "Belmont Park",
    distance: "1 1/16 Miles",
    purse: "$500,000",
    surface: "Dirt",
    horse: "Thunder Bolt",
    stable: "Sunrise Stable",
    status: "FINISHED",
    position: "4th",
    points: 4,
    note: "Pace held, missed podium by one length.",
  },
  {
    id: "summer-r4",
    championshipId: "summer-2026",
    roundNumber: 4,
    raceName: "Belmont Stakes Presented",
    date: "2026-06-06",
    time: "11:00 AM",
    track: "Belmont Park",
    distance: "1 1/2 Miles",
    purse: "$2,000,000",
    surface: "Dirt",
    horse: "Thunder Bolt",
    stable: "Sunrise Stable",
    status: "NEXT",
    note: "Be at the paddock by 9:00 AM. Weight check: 120 lbs.",
  },
  {
    id: "summer-r5",
    championshipId: "summer-2026",
    roundNumber: 5,
    raceName: "Poker Stakes",
    date: "2026-06-07",
    time: "12:35 PM",
    track: "Belmont Park",
    distance: "1 Mile",
    purse: "$300,000",
    surface: "Turf",
    horse: "Thunder Bolt",
    stable: "Sunrise Stable",
    status: "UPCOMING",
    note: "Standard pre-race check-in.",
  },
  {
    id: "summer-r6",
    championshipId: "summer-2026",
    roundNumber: 6,
    raceName: "Brooklyn Stakes",
    date: "2026-06-14",
    time: "1:30 PM",
    track: "Belmont Park",
    distance: "1 3/8 Miles",
    purse: "$150,000",
    surface: "Dirt",
    horse: "Thunder Bolt",
    stable: "Sunrise Stable",
    status: "LOCKED",
    note: "Round details unlock after Round 4 results.",
  },
];

export const jockeyContracts: JockeyContract[] = [
  {
    id: "contract-1",
    stable: "Sunrise Stable",
    owner: "Nguyen Racing Group",
    horse: "Thunder Bolt",
    championship: "Summer Championship 2026",
    championshipId: "summer-2026",
    rounds: 8,
    season: "Jun 1 - Aug 20, 2026",
    message: "Please confirm availability for the full championship assignment.",
    terms: ["Expected participation: all championship rounds", "Reserve rider allowed: no", "Stable briefing before each race day"],
    agreementFileName: "summer-assignment-agreement.pdf",
    agreementFileSize: "1.2 MB",
    agreementUpdatedAt: "May 12, 2026",
    activityLabel: "Committed May 21",
    responseDeadline: "May 23, 2026",
    status: "COMMITTED",
  },
  {
    id: "contract-2",
    stable: "River Gate Stable",
    owner: "Tran Horse Club",
    horse: "Black Storm",
    championship: "Summer Championship 2026",
    championshipId: "summer-2026",
    rounds: 8,
    season: "Jun 1 - Aug 20, 2026",
    message: "We would like to assign you as the primary rider for Black Storm.",
    terms: ["Expected participation: all championship rounds", "Reserve rider allowed: yes"],
    agreementFileName: "river-gate-summer-terms.pdf",
    agreementFileSize: "980 KB",
    agreementUpdatedAt: "May 20, 2026",
    activityLabel: "Last updated 2h ago",
    responseDeadline: "May 25, 2026",
    status: "PENDING",
    hasConflict: true,
    isUnread: true,
  },
  {
    id: "contract-3",
    stable: "Northwind Stable",
    owner: "Le Equine Team",
    horse: "Silver Ray",
    championship: "Autumn Cup 2026",
    championshipId: "autumn-2026",
    rounds: 6,
    season: "Sep 5 - Nov 14, 2026",
    message: "Open pool invitation for Autumn Cup commitment.",
    terms: ["Expected participation: all championship rounds", "Reserve rider allowed: no"],
    agreementFileName: "autumn-cup-assignment.pdf",
    agreementFileSize: "1.0 MB",
    agreementUpdatedAt: "Jun 1, 2026",
    activityLabel: "Received today",
    responseDeadline: "Aug 20, 2026",
    status: "PENDING",
    isUnread: true,
  },
];

export const careerRecord: CareerRecord = {
  officialStarts: 24,
  wins: 6,
  top3Finishes: 14,
  top3Rate: "58.3%",
  championshipsJoined: 5,
  championshipsWon: 1,
};

export const championshipArchive = [
  { championship: "Summer Championship 2026", rank: "#3", points: 42, horse: "Thunder Bolt", stable: "Sunrise Stable" },
  { championship: "Spring Cup 2026", rank: "#1", points: 58, horse: "Golden Arrow", stable: "Sunrise Stable" },
  { championship: "Autumn Cup 2025", rank: "#4", points: 31, horse: "Night Signal", stable: "River Gate Stable" },
];

export function getRoundsForChampionship(championshipId: string) {
  return jockeyRounds.filter((round) => round.championshipId === championshipId);
}

export function getNextRound(championshipId: string) {
  return getRoundsForChampionship(championshipId).find((round) => round.status === "NEXT");
}
