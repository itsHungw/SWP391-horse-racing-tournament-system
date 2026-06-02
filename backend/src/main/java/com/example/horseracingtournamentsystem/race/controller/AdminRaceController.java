package com.example.horseracingtournamentsystem.race.controller;

import com.example.horseracingtournamentsystem.race.dto.request.RaceRequest;
import com.example.horseracingtournamentsystem.race.dto.response.RaceResponse;
import com.example.horseracingtournamentsystem.race.service.RaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/races")
@RequiredArgsConstructor
public class AdminRaceController {

    private final RaceService raceService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RaceResponse createRace(@Valid @RequestBody RaceRequest req, Principal principal) {
        return raceService.createRace(req, principal.getName());
    }

    @PutMapping("/{id}")
    public RaceResponse updateRace(@PathVariable Long id, @Valid @RequestBody RaceRequest req) {
        return raceService.updateRace(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRace(@PathVariable Long id) {
        raceService.deleteRace(id);
    }

    @GetMapping
    public List<RaceResponse> listAll(@RequestParam(required = false) Long tournamentId) {
        return raceService.getAdminRaces(tournamentId);
    }

    @GetMapping("/{id}")
    public RaceResponse getDetail(@PathVariable Long id) {
        return raceService.getRaceDetail(id);
    }

    @PutMapping("/{id}/status")
    public RaceResponse updateStatus(@PathVariable Long id, @RequestParam String status) {
        return raceService.updateRaceStatus(id, status);
    }
}
