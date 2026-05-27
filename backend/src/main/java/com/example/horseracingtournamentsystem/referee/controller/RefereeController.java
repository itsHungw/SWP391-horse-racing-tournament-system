package com.example.horseracingtournamentsystem.referee.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/referee")
@PreAuthorize("hasRole('REFEREE')")
public class RefereeController {

    // Thread-safe in-memory state preservation for testing
    private static final List<Map<String, Object>> RACES = new ArrayList<>();
    private static final Map<Long, List<Map<String, Object>>> PARTICIPANTS = new ConcurrentHashMap<>();
    private static final Map<Long, List<Map<String, Object>>> RESULTS = new ConcurrentHashMap<>();
    private static final Map<Long, List<Map<String, Object>>> VIOLATIONS = new ConcurrentHashMap<>();
    private static final Map<Long, List<Map<String, Object>>> REPORTS = new ConcurrentHashMap<>();

    static {
        // Initialize assigned races
        RACES.add(createRace(1L, "Royal Ascot Gold Cup - Qualifiers A", "R-2026-001", 1600, "ACTIVE"));
        RACES.add(createRace(2L, "Dubai World Cup - Final Derby", "R-2026-002", 2400, "SCHEDULED"));

        // Initialize participants for Race 1
        List<Map<String, Object>> race1Parts = new ArrayList<>();
        race1Parts.add(createParticipant(1L, "Thunderstrike (H-002)", "Julian Sterling", 54.5, true, true, "PASSED"));
        race1Parts.add(createParticipant(2L, "Golden Mane (H-005)", "Michael Chang", 56.0, false, false, "PENDING"));
        PARTICIPANTS.put(1L, race1Parts);

        // Initialize participants for Race 2
        List<Map<String, Object>> race2Parts = new ArrayList<>();
        race2Parts.add(createParticipant(3L, "Windrunner (H-009)", "Sarah Jenkins", 53.0, true, true, "PASSED"));
        PARTICIPANTS.put(2L, race2Parts);

        // Initialize results template for Race 1
        List<Map<String, Object>> race1Results = new ArrayList<>();
        race1Results.add(createResult(1L, "Thunderstrike", "Julian Sterling", "", "", "FINISHED"));
        race1Results.add(createResult(2L, "Golden Mane", "Michael Chang", "", "", "FINISHED"));
        RESULTS.put(1L, race1Results);
    }

    private static Map<String, Object> createRace(Long id, String name, String code, int distance, String status) {
        Map<String, Object> map = new ConcurrentHashMap<>();
        map.put("id", id);
        map.put("name", name);
        map.put("code", code);
        map.put("distanceMeters", distance);
        map.put("status", status);
        return map;
    }

    private static Map<String, Object> createParticipant(Long id, String horse, String jockey, double weight, boolean gear, boolean health, String status) {
        Map<String, Object> map = new ConcurrentHashMap<>();
        map.put("participantId", id);
        map.put("horseName", horse);
        map.put("jockeyName", jockey);
        map.put("jockeyWeight", weight);
        map.put("gearOk", gear);
        map.put("healthOk", health);
        map.put("status", status);
        return map;
    }

    private static Map<String, Object> createResult(Long id, String horse, String jockey, Object pos, Object time, String status) {
        Map<String, Object> map = new ConcurrentHashMap<>();
        map.put("participantId", id);
        map.put("horseName", horse);
        map.put("jockeyName", jockey);
        map.put("position", pos);
        map.put("finishTimeSeconds", time);
        map.put("status", status);
        return map;
    }

    @GetMapping("/races")
    public ResponseEntity<List<Map<String, Object>>> getAssignedRaces() {
        return ResponseEntity.ok(RACES);
    }

    @GetMapping("/races/{raceId}/participants")
    public ResponseEntity<List<Map<String, Object>>> getRaceParticipants(@PathVariable Long raceId) {
        List<Map<String, Object>> parts = PARTICIPANTS.getOrDefault(raceId, new ArrayList<>());
        return ResponseEntity.ok(parts);
    }

    @PostMapping("/races/{raceId}/pre-checks")
    public ResponseEntity<Void> savePreRaceChecks(@PathVariable Long raceId, @RequestBody List<Map<String, Object>> checks) {
        PARTICIPANTS.put(raceId, checks);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/races/{raceId}/result-entries")
    public ResponseEntity<List<Map<String, Object>>> getRaceResultEntries(@PathVariable Long raceId) {
        List<Map<String, Object>> res = RESULTS.getOrDefault(raceId, new ArrayList<>());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/races/{raceId}/results")
    public ResponseEntity<Void> submitRaceResults(@PathVariable Long raceId, @RequestBody List<Map<String, Object>> results) {
        RESULTS.put(raceId, results);
        
        // Update race status to RESULT_SUBMITTED
        for (Map<String, Object> race : RACES) {
            if (race.get("id").equals(raceId)) {
                race.put("status", "RESULT_SUBMITTED");
            }
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/races/{raceId}/violations")
    public ResponseEntity<Void> logViolation(@PathVariable Long raceId, @RequestBody Map<String, Object> violation) {
        List<Map<String, Object>> list = VIOLATIONS.computeIfAbsent(raceId, k -> new ArrayList<>());
        list.add(violation);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/races/{raceId}/reports")
    public ResponseEntity<Void> submitReport(@PathVariable Long raceId, @RequestBody Map<String, Object> report) {
        List<Map<String, Object>> list = REPORTS.computeIfAbsent(raceId, k -> new ArrayList<>());
        list.add(report);
        return ResponseEntity.ok().build();
    }
}
