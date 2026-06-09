/* Leaderboard domain types — drives the public Leaderboard page.
   Backend endpoints are proposed (not yet implemented); the page degrades to a
   premium empty-state until they ship, then wires straight through. */

export type StandingType = "HORSE" | "JOCKEY";

export type BoardTab = "HORSE" | "JOCKEY" | "SPECTATOR";

/** Recent form marker: W = win, P = podium (2nd/3rd), "-" = outside podium. */
export type FormResult = "W" | "P" | "-";

export interface ChampionshipStanding {
  rank: number;
  /** Horse name or jockey name. */
  name: string;
  /** Owner/stable for a horse, or nationality/team for a jockey. */
  subtitle?: string | null;
  points: number;
  wins: number;
  podiums: number;
  starts: number;
  /** Last few results, most recent last. Optional. */
  form?: FormResult[];
}

export interface SpectatorStanding {
  rank: number;
  displayName: string;
  points: number;
  correctPredictions: number;
  totalPredictions: number;
}
