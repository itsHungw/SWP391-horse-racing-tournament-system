package com.example.horseracingtournamentsystem.referee.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/referee")
@PreAuthorize("hasRole('REFEREE')")
public class RefereeController {

    @GetMapping("/races")
    public ResponseEntity<List<?>> getAssignedRaces() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/races/{raceId}/participants")
    public ResponseEntity<List<?>> getRaceParticipants(@PathVariable Long raceId) {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/races/{raceId}/pre-checks")
    public ResponseEntity<Void> savePreRaceChecks(@PathVariable Long raceId, @RequestBody List<?> checks) {
        return ResponseEntity.ok().build();
    }

    @GetMapping("/races/{raceId}/result-entries")
    public ResponseEntity<List<?>> getRaceResultEntries(@PathVariable Long raceId) {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/races/{raceId}/results")
    public ResponseEntity<Void> submitRaceResults(@PathVariable Long raceId, @RequestBody List<?> results) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/races/{raceId}/violations")
    public ResponseEntity<Void> logViolation(@PathVariable Long raceId, @RequestBody Object violation) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/races/{raceId}/reports")
    public ResponseEntity<Void> submitReport(@PathVariable Long raceId, @RequestBody Object report) {
        return ResponseEntity.ok().build();
    }
}
