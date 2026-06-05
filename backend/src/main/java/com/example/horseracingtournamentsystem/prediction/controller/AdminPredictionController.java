package com.example.horseracingtournamentsystem.prediction.controller;

import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.result.entity.RaceResult;
import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;
import com.example.horseracingtournamentsystem.prediction.dto.response.AdminRaceSummaryResponse;
import com.example.horseracingtournamentsystem.prediction.dto.response.AdminRaceDetailResponse;
import com.example.horseracingtournamentsystem.prediction.dto.response.AdminAuditPredictionResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/predictions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPredictionController {

    private final PredictionSettlementJobRepository jobRepo;
    private final RacePredictionRepository predictionRepo;
    private final RaceRepository raceRepo;
    private final RaceResultRepository resultRepo;

    public AdminPredictionController(PredictionSettlementJobRepository jobRepo,
                                     RacePredictionRepository predictionRepo,
                                     RaceRepository raceRepo,
                                     RaceResultRepository resultRepo) {
        this.jobRepo = jobRepo;
        this.predictionRepo = predictionRepo;
        this.raceRepo = raceRepo;
        this.resultRepo = resultRepo;
    }

    @GetMapping("/races")
    public ResponseEntity<List<AdminRaceSummaryResponse>> getRaces() {
        List<Race> races = raceRepo.findAll();
        List<AdminRaceSummaryResponse> response = races.stream().map(r -> {
            AdminRaceSummaryResponse s = new AdminRaceSummaryResponse();
            s.setRaceId(r.getId());
            s.setRaceName(r.getName());
            s.setRoundName(r.getRoundName());
            if (r.getTournament() != null) {
                s.setTournamentId(r.getTournament().getId());
                s.setTournamentName(r.getTournament().getName());
            }
            s.setRaceAt(r.getRaceAt());
            s.setRaceStatus(r.getStatus());

            // Counts
            List<RacePrediction> preds = predictionRepo.findByRaceId(r.getId());
            s.setTotalPredictions(preds.size());
            s.setWinnerPickCount(preds.stream().filter(p -> RacePrediction.TYPE_WINNER.equals(p.getPredictionType())).count());
            s.setTop3PickCount(preds.stream().filter(p -> RacePrediction.TYPE_TOP3.equals(p.getPredictionType())).count());

            // Settlement Job Status
            PredictionSettlementJob job = jobRepo.findByRaceId(r.getId()).orElse(null);
            String predStatus = "OPEN";
            if ("CANCELLED".equals(r.getStatus())) {
                predStatus = "REFUNDED";
            } else if (job != null) {
                // Map job status directly to UI prediction status
                if (PredictionSettlementJob.STATUS_PENDING.equals(job.getStatus())) {
                    predStatus = "SETTLEMENT_PENDING";
                } else {
                    predStatus = job.getStatus(); // PROCESSING, COMPLETED, FAILED
                }
                s.setSettlementJobStatus(job.getStatus());
            } else if (!"SCHEDULED".equals(r.getStatus())) {
                predStatus = "LOCKED";
            }
            s.setPredictionStatus(predStatus);

            // Correct/Incorrect totals
            s.setCorrectWinnerCount(preds.stream().filter(p -> RacePrediction.TYPE_WINNER.equals(p.getPredictionType()) && RacePrediction.STATUS_CORRECT.equals(p.getStatus())).count());
            s.setExactTop3Count(preds.stream().filter(p -> RacePrediction.TYPE_TOP3.equals(p.getPredictionType()) && p.getRewardPoints() == 30).count());
            s.setPartialTop3Count(preds.stream().filter(p -> RacePrediction.TYPE_TOP3.equals(p.getPredictionType()) && p.getRewardPoints() == 15).count());
            s.setIncorrectCount(preds.stream().filter(p -> RacePrediction.STATUS_INCORRECT.equals(p.getStatus())).count());

            return s;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/races/{raceId}")
    public ResponseEntity<AdminRaceDetailResponse> getRaceDetail(@PathVariable Long raceId) {
        Race r = raceRepo.findById(raceId)
            .orElseThrow(() -> new IllegalArgumentException("Race not found: " + raceId));

        AdminRaceDetailResponse d = new AdminRaceDetailResponse();
        d.setRaceId(r.getId());
        d.setRaceName(r.getName());
        d.setRoundName(r.getRoundName());
        if (r.getTournament() != null) {
            d.setTournamentName(r.getTournament().getName());
        }
        d.setRaceStatus(r.getStatus());

        PredictionSettlementJob job = jobRepo.findByRaceId(r.getId()).orElse(null);
        String predStatus = "OPEN";
        if ("CANCELLED".equals(r.getStatus())) {
            predStatus = "REFUNDED";
        } else if (job != null) {
            if (PredictionSettlementJob.STATUS_PENDING.equals(job.getStatus())) {
                predStatus = "SETTLEMENT_PENDING";
            } else {
                predStatus = job.getStatus();
            }
        } else if (!"SCHEDULED".equals(r.getStatus())) {
            predStatus = "LOCKED";
        }
        d.setPredictionStatus(predStatus);

        List<RacePrediction> preds = predictionRepo.findByRaceId(r.getId());
        AdminRaceDetailResponse.SummaryInfo s = new AdminRaceDetailResponse.SummaryInfo();
        s.setTotalPredictions(preds.size());
        s.setWinnerPickCount(preds.stream().filter(p -> RacePrediction.TYPE_WINNER.equals(p.getPredictionType())).count());
        s.setTop3PickCount(preds.stream().filter(p -> RacePrediction.TYPE_TOP3.equals(p.getPredictionType())).count());

        s.setWinnerCorrectCount(preds.stream().filter(p -> RacePrediction.TYPE_WINNER.equals(p.getPredictionType()) && RacePrediction.STATUS_CORRECT.equals(p.getStatus())).count());
        s.setExactTop3Count(preds.stream().filter(p -> RacePrediction.TYPE_TOP3.equals(p.getPredictionType()) && p.getRewardPoints() == 30).count());
        s.setTop3AnyOrderCount(preds.stream().filter(p -> RacePrediction.TYPE_TOP3.equals(p.getPredictionType()) && p.getRewardPoints() == 15).count());
        s.setIncorrectCount(preds.stream().filter(p -> RacePrediction.STATUS_INCORRECT.equals(p.getStatus())).count());
        s.setRefundedCount(preds.stream().filter(p -> RacePrediction.STATUS_REFUNDED.equals(p.getStatus())).count());
        s.setRewardedPoints(preds.stream().mapToLong(RacePrediction::getRewardPoints).sum());
        d.setSummary(s);

        if (job != null) {
            AdminRaceDetailResponse.SettlementJobInfo j = new AdminRaceDetailResponse.SettlementJobInfo();
            j.setId(job.getId());
            j.setStatus(job.getStatus());
            j.setProcessedCount(job.getProcessedCount());
            j.setRewardedCount(job.getRewardedCount());
            j.setFailedCount(job.getFailedCount());
            j.setRetryCount(job.getRetryCount());
            j.setErrorMessage(job.getErrorMessage());
            j.setStartedAt(job.getStartedAt());
            j.setCompletedAt(job.getCompletedAt());
            d.setSettlementJob(j);
        }

        return ResponseEntity.ok(d);
    }

    @GetMapping("/races/{raceId}/predictions")
    public ResponseEntity<List<AdminAuditPredictionResponse>> getRacePredictions(@PathVariable Long raceId) {
        List<RacePrediction> preds = predictionRepo.findByRaceId(raceId);
        
        // Fetch participant horse names map to construct displays
        List<Object[]> rawHorses = predictionRepo.findParticipantHorseNamesByRaceId(raceId);
        Map<Long, String> participantHorseNames = rawHorses.stream()
            .collect(Collectors.toMap(
                row -> ((Number) row[0]).longValue(),
                row -> (String) row[1],
                (h1, h2) -> h1
            ));

        List<AdminAuditPredictionResponse> response = preds.stream().map(p -> {
            AdminAuditPredictionResponse r = new AdminAuditPredictionResponse();
            r.setPredictionId(p.getId());
            if (p.getSpectator() != null) {
                r.setSpectatorName(p.getSpectator().getFullName());
                r.setSpectatorEmail(p.getSpectator().getEmail());
            }
            r.setPredictionType(p.getPredictionType());
            
            // Build selected horse names list
            List<String> selections = new ArrayList<>();
            selections.add(participantHorseNames.getOrDefault(p.getPredictedWinnerId(), "Unknown (#" + p.getPredictedWinnerId() + ")"));
            if (RacePrediction.TYPE_TOP3.equals(p.getPredictionType())) {
                if (p.getPredictedSecondId() != null) {
                    selections.add(participantHorseNames.getOrDefault(p.getPredictedSecondId(), "Unknown (#" + p.getPredictedSecondId() + ")"));
                }
                if (p.getPredictedThirdId() != null) {
                    selections.add(participantHorseNames.getOrDefault(p.getPredictedThirdId(), "Unknown (#" + p.getPredictedThirdId() + ")"));
                }
            }
            r.setSelections(selections);
            r.setEntryCostPoints(p.getEntryCostPoints());
            r.setStatus(p.getStatus());
            
            // Map display statuses
            String displayStatus = p.getStatus();
            String resCategory = "Pending";
            
            if (RacePrediction.STATUS_PENDING.equals(p.getStatus())) {
                displayStatus = "Submitted";
                resCategory = "Pending";
            } else if (RacePrediction.STATUS_LOCKED.equals(p.getStatus())) {
                displayStatus = "Locked";
                resCategory = "Locked";
            } else if (RacePrediction.STATUS_REFUNDED.equals(p.getStatus())) {
                displayStatus = "Refunded";
                resCategory = "Refunded";
            } else if (RacePrediction.STATUS_INCORRECT.equals(p.getStatus())) {
                displayStatus = "Lost";
                resCategory = "Incorrect";
            } else if (RacePrediction.STATUS_CORRECT.equals(p.getStatus())) {
                displayStatus = "Won";
                if (RacePrediction.TYPE_WINNER.equals(p.getPredictionType())) {
                    resCategory = "Winner Correct";
                } else {
                    resCategory = p.getRewardPoints() == 30 ? "Exact Top 3" : "Top 3 Any Order";
                }
            }
            
            r.setDisplayStatus(displayStatus);
            r.setResultCategory(resCategory);
            r.setRewardPoints(p.getRewardPoints());
            r.setSubmittedAt(p.getCreatedAt());
            r.setEvaluatedAt(p.getEvaluatedAt());

            return r;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/settlement-jobs/{jobId}/retry")
    public ResponseEntity<Void> retryJob(@PathVariable Long jobId) {
        PredictionSettlementJob job = jobRepo.findById(jobId)
            .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        if (PredictionSettlementJob.STATUS_FAILED.equals(job.getStatus())) {
            job.setStatus(PredictionSettlementJob.STATUS_PENDING);
            job.setErrorMessage(null);
            job.setUpdatedAt(LocalDateTime.now());
            jobRepo.save(job);
        }
        return ResponseEntity.ok().build();
    }
}
