package com.example.horseracingtournamentsystem.race.controller;

import com.example.horseracingtournamentsystem.race.dto.response.JockeyScheduleItemResponse;
import com.example.horseracingtournamentsystem.race.service.RaceService;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class JockeyScheduleController {

    private final RaceService raceService;

    @GetMapping("/api/v1/jockey/schedule")
    public List<JockeyScheduleItemResponse> getSchedule(Principal principal) {
        return raceService.getJockeySchedule(principal.getName());
    }
}
