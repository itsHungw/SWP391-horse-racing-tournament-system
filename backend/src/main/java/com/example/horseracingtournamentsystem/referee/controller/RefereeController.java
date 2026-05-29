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
        RACES.add(createRace(3L, "Kentucky Derby - Triple Crown Leg 1", "R-2026-003", 2000, "SCHEDULED"));
        RACES.add(createRace(4L, "Melbourne Cup - Steeplechase Qualifier", "R-2026-004", 3200, "ACTIVE"));
        RACES.add(createRace(5L, "Grand National - Handicap Chase", "R-2026-005", 1800, "RESULT_SUBMITTED"));

        // Initialize participants for Race 1
        List<Map<String, Object>> race1Parts = new ArrayList<>();
        race1Parts.add(createParticipant(1L, "Thunderstrike (H-002)", "Julian Sterling", 54.5, true, true, "PASSED"));
        race1Parts.add(createParticipant(2L, "Golden Mane (H-005)", "Michael Chang", 56.0, false, false, "PENDING"));
        PARTICIPANTS.put(1L, race1Parts);

        // Initialize participants for Race 2
        List<Map<String, Object>> race2Parts = new ArrayList<>();
        race2Parts.add(createParticipant(3L, "Windrunner (H-009)", "Sarah Jenkins", 53.0, true, true, "PASSED"));
        PARTICIPANTS.put(2L, race2Parts);

        // Initialize participants for Race 3 (New - Scheduled, all pending)
        List<Map<String, Object>> race3Parts = new ArrayList<>();
        race3Parts.add(createParticipant(4L, "Silver Bullet (H-012)", "Alan Smith", 55.0, false, false, "PENDING"));
        race3Parts.add(createParticipant(5L, "Midnight Rider (H-015)", "Bruce Wayne", 54.0, false, false, "PENDING"));
        race3Parts.add(createParticipant(6L, "Desert Fox (H-018)", "Clark Kent", 56.5, false, false, "PENDING"));
        PARTICIPANTS.put(3L, race3Parts);

        // Initialize participants for Race 4 (New - Active, passed & failed)
        List<Map<String, Object>> race4Parts = new ArrayList<>();
        race4Parts.add(createParticipant(7L, "Shadowfax (H-021)", "Gandalf Grey", 53.5, true, true, "PASSED"));
        race4Parts.add(createParticipant(8L, "Artax (H-022)", "Atreyu Green", 52.0, true, true, "PASSED"));
        race4Parts.add(createParticipant(9L, "Pegaso (H-023)", "Hercules Gold", 58.0, false, false, "FAILED"));
        PARTICIPANTS.put(4L, race4Parts);

        // Initialize participants for Race 5 (New - Completed)
        List<Map<String, Object>> race5Parts = new ArrayList<>();
        race5Parts.add(createParticipant(10L, "Jolly Jumper (H-031)", "Lucky Luke", 55.0, true, true, "PASSED"));
        race5Parts.add(createParticipant(11L, "Black Beauty (H-032)", "Anna Sewell", 54.0, true, true, "PASSED"));
        PARTICIPANTS.put(5L, race5Parts);

        // Initialize results template for Race 1
        List<Map<String, Object>> race1Results = new ArrayList<>();
        race1Results.add(createResult(1L, "Thunderstrike", "Julian Sterling", "", "", "FINISHED"));
        race1Results.add(createResult(2L, "Golden Mane", "Michael Chang", "", "", "FINISHED"));
        RESULTS.put(1L, race1Results);

        // Initialize results template for Race 2
        List<Map<String, Object>> race2Results = new ArrayList<>();
        race2Results.add(createResult(3L, "Windrunner", "Sarah Jenkins", "", "", "FINISHED"));
        RESULTS.put(2L, race2Results);

        // Initialize results template for Race 3
        List<Map<String, Object>> race3Results = new ArrayList<>();
        race3Results.add(createResult(4L, "Silver Bullet", "Alan Smith", "", "", "FINISHED"));
        race3Results.add(createResult(5L, "Midnight Rider", "Bruce Wayne", "", "", "FINISHED"));
        race3Results.add(createResult(6L, "Desert Fox", "Clark Kent", "", "", "FINISHED"));
        RESULTS.put(3L, race3Results);

        // Initialize results template for Race 4
        List<Map<String, Object>> race4Results = new ArrayList<>();
        race4Results.add(createResult(7L, "Shadowfax", "Gandalf Grey", "", "", "FINISHED"));
        race4Results.add(createResult(8L, "Artax", "Atreyu Green", "", "", "FINISHED"));
        race4Results.add(createResult(9L, "Pegaso", "Hercules Gold", "", "", "FINISHED"));
        RESULTS.put(4L, race4Results);

        // Initialize submitted results for Race 5
        List<Map<String, Object>> race5Results = new ArrayList<>();
        race5Results.add(createResult(10L, "Jolly Jumper", "Lucky Luke", 1, 92.4, "FINISHED"));
        race5Results.add(createResult(11L, "Black Beauty", "Anna Sewell", 2, 94.1, "FINISHED"));
        RESULTS.put(5L, race5Results);
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

    @PostMapping("/races/{raceId}/next-step")
    public ResponseEntity<Map<String, String>> transitionRaceState(@PathVariable Long raceId) {
        // Find the target race from static store
        Map<String, Object> targetRace = null;
        for (Map<String, Object> race : RACES) {
            if (race.get("id").equals(raceId)) {
                targetRace = race;
                break;
            }
        }

        if (targetRace == null) {
            return ResponseEntity.badRequest().build();
        }

        String currentStatus = (String) targetRace.get("status");
        String nextStatus;

        switch (currentStatus) {
            case "SCHEDULED":
                nextStatus = "PRE_CHECKING";
                break;

            case "PRE_CHECKING":
                // Guard: Enforce 0% PENDING Checks
                List<Map<String, Object>> parts = PARTICIPANTS.getOrDefault(raceId, new java.util.ArrayList<>());
                for (Map<String, Object> p : parts) {
                    if ("PENDING".equals(p.get("status"))) {
                        return ResponseEntity.status(400).body(Map.of("message", "All participants must be verified before proceeding."));
                    }
                }

                // Perform scratching for failed entries
                for (Map<String, Object> p : parts) {
                    if ("FAILED".equals(p.get("status"))) {
                        p.put("status", "WITHDRAWN");
                    }
                }

                nextStatus = "READY";
                break;

            case "READY":
                nextStatus = "ONGOING";
                break;

            case "ONGOING":
                nextStatus = "FINISHED";
                break;

            case "FINISHED":
                nextStatus = "RESULT_SUBMITTED";
                break;

            default:
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid race status path."));
        }

        targetRace.put("status", nextStatus);
        return ResponseEntity.ok(Map.of("status", nextStatus));
    }
}
