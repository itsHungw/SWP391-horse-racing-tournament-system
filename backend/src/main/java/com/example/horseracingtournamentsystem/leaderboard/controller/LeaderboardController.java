package com.example.horseracingtournamentsystem.leaderboard.controller;

import com.example.horseracingtournamentsystem.leaderboard.dto.response.ChampionshipStandingResponse;
import com.example.horseracingtournamentsystem.leaderboard.dto.response.SpectatorStandingResponse;
import com.example.horseracingtournamentsystem.leaderboard.service.LeaderboardService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public leaderboard endpoints.
 *   GET /api/v1/standings?type=HORSE|JOCKEY                    → overall standings
 *   GET /api/v1/championships/{id}/standings?type=HORSE|JOCKEY → per-season standings
 *   GET /api/v1/leaderboard/spectators?championshipId=&limit=  → spectator points board
 */
@RestController
@RequestMapping("/api/v1")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping("/standings")
    public ResponseEntity<List<ChampionshipStandingResponse>> overallStandings(
            @RequestParam(name = "type", defaultValue = "HORSE") String type) {
        return ResponseEntity.ok(leaderboardService.getChampionshipStandings(null, normalizeType(type)));
    }

    @GetMapping("/championships/{championshipId}/standings")
    public ResponseEntity<List<ChampionshipStandingResponse>> seasonStandings(
            @PathVariable Long championshipId,
            @RequestParam(name = "type", defaultValue = "HORSE") String type) {
        return ResponseEntity.ok(leaderboardService.getChampionshipStandings(championshipId, normalizeType(type)));
    }

    @GetMapping("/leaderboard/spectators")
    public ResponseEntity<List<SpectatorStandingResponse>> spectatorLeaderboard(
            @RequestParam(name = "championshipId", required = false) Long championshipId,
            @RequestParam(name = "limit", defaultValue = "50") int limit) {
        return ResponseEntity.ok(leaderboardService.getSpectatorLeaderboard(championshipId, limit));
    }

    private String normalizeType(String type) {
        return "JOCKEY".equalsIgnoreCase(type) ? "JOCKEY" : "HORSE";
    }
}
