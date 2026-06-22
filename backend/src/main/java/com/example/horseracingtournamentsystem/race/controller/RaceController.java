package com.example.horseracingtournamentsystem.race.controller;

import com.example.horseracingtournamentsystem.race.dto.response.RaceResponse;
import com.example.horseracingtournamentsystem.race.dto.response.RaceSummaryResponse;
import com.example.horseracingtournamentsystem.race.dto.response.PublicRaceResultResponse;
import com.example.horseracingtournamentsystem.race.service.RaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/races")
@RequiredArgsConstructor
public class RaceController {

    private final RaceService raceService;

    @GetMapping
    public List<RaceResponse> listPublic(@RequestParam(required = false) Long tournamentId) {
        return raceService.getPublicRaces(tournamentId);
    }

    @GetMapping("/search")
    public Page<RaceSummaryResponse> searchPublic(
            @RequestParam(defaultValue = "UPCOMING") String scope,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false) Long tournamentId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String horse,
            @RequestParam(required = false) String jockey,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return raceService.searchPublicRaces(
                scope,
                from == null ? null : from.atStartOfDay(),
                to == null ? null : to.plusDays(1).atStartOfDay().minusNanos(1),
                tournamentId,
                search,
                horse,
                jockey,
                sortBy,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100))
        );
    }

    @GetMapping("/{id}/results")
    public PublicRaceResultResponse getPublicResults(@PathVariable Long id) {
        return raceService.getPublicRaceResults(id);
    }

    @GetMapping("/{id}")
    public RaceResponse getPublicDetail(@PathVariable Long id) {
        return raceService.getRaceDetail(id);
    }
}
