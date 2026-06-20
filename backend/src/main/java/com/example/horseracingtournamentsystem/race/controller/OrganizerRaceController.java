package com.example.horseracingtournamentsystem.race.controller;

import com.example.horseracingtournamentsystem.race.dto.request.RaceRequest;
import com.example.horseracingtournamentsystem.race.dto.response.RaceParticipantResponse;
import com.example.horseracingtournamentsystem.race.dto.response.RaceResponse;
import com.example.horseracingtournamentsystem.race.service.RaceService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Organizer tự xếp race card (vòng đấu + gán trọng tài) và chốt kết quả giải của mình
 * (BR-09 / BR-16). Prefix /api/v1/organizer/** -> hasRole('ORGANIZER'); service kiểm tra
 * thêm quyền sở hữu giải qua Tournament.isManagedBy.
 */
@RestController
@RequestMapping("/api/v1/organizer/races")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "14 · Organizer · Race card & results", description = "Organizer creates rounds, assigns referees, and confirms/publishes results (BR-16).")
public class OrganizerRaceController {

    private final RaceService raceService;

    @GetMapping
    public List<RaceResponse> list(@RequestParam Long tournamentId, Authentication authentication) {
        return raceService.getOrganizerRaces(tournamentId, authentication.getName());
    }

    @GetMapping("/{id}")
    public RaceResponse detail(@PathVariable Long id, Authentication authentication) {
        return raceService.getOrganizerRaceDetail(id, authentication.getName());
    }

    @GetMapping("/{id}/participants")
    public List<RaceParticipantResponse> participants(@PathVariable Long id, Authentication authentication) {
        return raceService.getOrganizerRaceParticipants(id, authentication.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RaceResponse create(@Valid @RequestBody RaceRequest req, Authentication authentication) {
        return raceService.createRaceForOrganizer(req, authentication.getName());
    }

    @PutMapping("/{id}")
    public RaceResponse update(
            @PathVariable Long id,
            @Valid @RequestBody RaceRequest req,
            Authentication authentication
    ) {
        return raceService.updateRaceForOrganizer(id, req, authentication.getName());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication authentication) {
        raceService.deleteRaceForOrganizer(id, authentication.getName());
    }

    @PutMapping("/{id}/referee")
    public RaceResponse assignReferee(
            @PathVariable Long id,
            @RequestParam Long refereeId,
            Authentication authentication
    ) {
        return raceService.assignRefereeForOrganizer(id, refereeId, authentication.getName());
    }

    @PostMapping("/{id}/confirm-results")
    public RaceResponse confirmResults(@PathVariable Long id, Authentication authentication) {
        return raceService.confirmRaceResults(id, authentication.getName());
    }

    @PostMapping("/{id}/publish-results")
    public RaceResponse publishResults(@PathVariable Long id, Authentication authentication) {
        return raceService.publishRaceResults(id, authentication.getName());
    }
}
