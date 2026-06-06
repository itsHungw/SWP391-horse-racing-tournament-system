package com.example.horseracingtournamentsystem.referee.controller;

import com.example.horseracingtournamentsystem.referee.dto.ParticipantCheckRequest;
import com.example.horseracingtournamentsystem.referee.dto.ParticipantResultEntry;
import com.example.horseracingtournamentsystem.referee.dto.ParticipantVerificationResponse;
import com.example.horseracingtournamentsystem.referee.dto.RefereeRaceResponse;
import com.example.horseracingtournamentsystem.referee.dto.RefereeReportRequest;
import com.example.horseracingtournamentsystem.referee.dto.SubmitResultsRequest;
import com.example.horseracingtournamentsystem.referee.dto.ViolationRequest;
import com.example.horseracingtournamentsystem.referee.service.RefereeRaceDayService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/referee")
@PreAuthorize("hasRole('REFEREE')")
@RequiredArgsConstructor
public class RefereeController {

    private final RefereeRaceDayService raceDayService;

    @GetMapping("/races")
    public List<RefereeRaceResponse> getAssignedRaces(Authentication authentication) {
        return raceDayService.listAssignedRaces(authentication.getName());
    }

    @GetMapping("/races/{raceId}")
    public RefereeRaceResponse getRace(@PathVariable Long raceId, Authentication authentication) {
        return raceDayService.getRace(raceId, authentication.getName());
    }

    @GetMapping("/races/{raceId}/participants")
    public List<ParticipantVerificationResponse> getRaceParticipants(
            @PathVariable Long raceId,
            Authentication authentication
    ) {
        return raceDayService.getParticipants(raceId, authentication.getName());
    }

    @PostMapping("/races/{raceId}/pre-checks")
    public List<ParticipantVerificationResponse> savePreRaceChecks(
            @PathVariable Long raceId,
            @RequestBody List<ParticipantCheckRequest> checks,
            Authentication authentication
    ) {
        return raceDayService.savePreRaceChecks(raceId, authentication.getName(), checks);
    }

    @PostMapping("/races/{raceId}/check")
    public List<ParticipantVerificationResponse> saveChecks(
            @PathVariable Long raceId,
            @RequestBody List<ParticipantCheckRequest> checks,
            Authentication authentication
    ) {
        return raceDayService.savePreRaceChecks(raceId, authentication.getName(), checks);
    }

    @PostMapping("/races/{raceId}/start")
    public RefereeRaceResponse startRace(@PathVariable Long raceId, Authentication authentication) {
        return raceDayService.startRace(raceId, authentication.getName());
    }

    @PostMapping("/races/{raceId}/finish")
    public RefereeRaceResponse finishRace(@PathVariable Long raceId, Authentication authentication) {
        return raceDayService.finishRace(raceId, authentication.getName());
    }

    @GetMapping("/races/{raceId}/result-entries")
    public List<ParticipantResultEntry> getRaceResultEntries(
            @PathVariable Long raceId,
            Authentication authentication
    ) {
        return raceDayService.getResultEntries(raceId, authentication.getName());
    }

    @PostMapping("/races/{raceId}/results")
    public RefereeRaceResponse submitLegacyRaceResults(
            @PathVariable Long raceId,
            @Valid @RequestBody List<@Valid ParticipantResultEntry> results,
            Authentication authentication
    ) {
        SubmitResultsRequest request = new SubmitResultsRequest(
                false,
                null,
                null,
                "Race result submitted by referee.",
                results
        );
        return raceDayService.submitResults(raceId, authentication.getName(), request);
    }

    @PostMapping("/races/{raceId}/results/submit")
    public RefereeRaceResponse submitRaceResults(
            @PathVariable Long raceId,
            @Valid @RequestBody SubmitResultsRequest request,
            Authentication authentication
    ) {
        return raceDayService.submitResults(raceId, authentication.getName(), request);
    }

    @PostMapping("/races/{raceId}/incidents")
    public void logIncident(
            @PathVariable Long raceId,
            @RequestBody ViolationRequest request,
            Authentication authentication
    ) {
        raceDayService.logIncident(raceId, authentication.getName(), request);
    }

    @PostMapping("/races/{raceId}/violations")
    public void logViolation(
            @PathVariable Long raceId,
            @RequestBody ViolationRequest request,
            Authentication authentication
    ) {
        raceDayService.logIncident(raceId, authentication.getName(), request);
    }

    @PostMapping("/races/{raceId}/reports")
    public void submitReport(
            @PathVariable Long raceId,
            @RequestBody RefereeReportRequest request,
            Authentication authentication
    ) {
        raceDayService.submitReport(raceId, authentication.getName(), request);
    }

    @PostMapping("/races/{raceId}/next-step")
    public Map<String, String> transitionRaceState(@PathVariable Long raceId, Authentication authentication) {
        RefereeRaceResponse response = raceDayService.advanceNextStep(raceId, authentication.getName());
        return Map.of("status", response.status());
    }
}
