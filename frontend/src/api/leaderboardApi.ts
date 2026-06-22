import { httpClient } from "./httpClient";
import type {
  ChampionshipStanding,
  SpectatorStanding,
  StandingType,
} from "../pages/public/leaderboard/leaderboardTypes";

/* Public leaderboard API.

   Proposed backend contract (not yet implemented — calls degrade gracefully):
     GET /championships/{id}/standings?type=HORSE|JOCKEY   → per-season standings
     GET /standings?type=HORSE|JOCKEY                      → overall (all seasons)
     GET /leaderboard/spectators?championshipId=&limit=    → spectator points board
*/

export async function getChampionshipStandings(
  championshipId: number | null,
  type: StandingType,
): Promise<ChampionshipStanding[]> {
  const path = championshipId ? `/championships/${championshipId}/standings` : "/standings";
  const response = await httpClient.get<ChampionshipStanding[]>(path, { params: { type } });
  return Array.isArray(response.data) ? response.data : [];
}

export async function getSpectatorLeaderboard(
  championshipId: number | null,
  limit = 50,
): Promise<SpectatorStanding[]> {
  const response = await httpClient.get<SpectatorStanding[]>("/leaderboard/spectators", {
    params: { championshipId: championshipId ?? undefined, limit },
  });
  return Array.isArray(response.data) ? response.data : [];
}
