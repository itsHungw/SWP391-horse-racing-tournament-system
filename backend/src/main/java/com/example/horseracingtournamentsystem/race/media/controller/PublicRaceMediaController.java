package com.example.horseracingtournamentsystem.race.media.controller;

import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaPublicResponse;
import com.example.horseracingtournamentsystem.race.media.service.RaceMediaService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/races")
@RequiredArgsConstructor
public class PublicRaceMediaController {

    private final RaceMediaService raceMediaService;

    @GetMapping("/{raceId}/highlight")
    public ResponseEntity<RaceMediaPublicResponse> getRaceHighlight(@PathVariable Long raceId) {
        return raceMediaService.getPublicHighlight(raceId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/highlights")
    public List<RaceMediaPublicResponse> getHighlights(@RequestParam Long tournamentId) {
        return raceMediaService.getPublicHighlightsForTournament(tournamentId);
    }
}
