package com.example.horseracingtournamentsystem.race.controller;

import com.example.horseracingtournamentsystem.race.dto.response.PublicRacingSummaryResponse;
import com.example.horseracingtournamentsystem.race.service.RaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class PublicRacingSummaryController {
    private final RaceService raceService;

    @GetMapping("/api/v1/racing-summary")
    public PublicRacingSummaryResponse getPublicRacingSummary() {
        return raceService.getPublicRacingSummary();
    }
}
