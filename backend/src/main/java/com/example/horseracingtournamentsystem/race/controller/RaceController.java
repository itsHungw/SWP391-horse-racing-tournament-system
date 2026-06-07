package com.example.horseracingtournamentsystem.race.controller;

import com.example.horseracingtournamentsystem.race.dto.response.RaceResponse;
import com.example.horseracingtournamentsystem.race.service.RaceService;
import lombok.RequiredArgsConstructor;
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

    @GetMapping("/{id}")
    public RaceResponse getPublicDetail(@PathVariable Long id) {
        return raceService.getRaceDetail(id);
    }
}
