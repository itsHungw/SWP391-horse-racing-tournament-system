package com.example.horseracingtournamentsystem.prediction.scheduler;

import com.example.horseracingtournamentsystem.points.entity.PointTransaction;
import com.example.horseracingtournamentsystem.points.service.PointsService;
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.result.entity.RaceResult;
import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class PredictionSettlementScheduler {

    private static final Logger log = LoggerFactory.getLogger(PredictionSettlementScheduler.class);

    private final PredictionSettlementJobRepository jobRepo;
    private final RacePredictionRepository predictionRepo;
    private final RaceResultRepository resultRepo;
    private final PointsService pointsService;

    @Autowired
    @Lazy
    private PredictionSettlementScheduler self;

    public PredictionSettlementScheduler(PredictionSettlementJobRepository jobRepo,
                                         RacePredictionRepository predictionRepo,
                                         RaceResultRepository resultRepo,
                                         PointsService pointsService) {
        this.jobRepo = jobRepo;
        this.predictionRepo = predictionRepo;
        this.resultRepo = resultRepo;
        this.pointsService = pointsService;
    }

    @Scheduled(fixedDelay = 5000)
    public void pollAndProcessJobs() {
        List<PredictionSettlementJob> pendingJobs = jobRepo.findByStatus(PredictionSettlementJob.STATUS_PENDING);
        for (PredictionSettlementJob job : pendingJobs) {
            int affected = self.claimJob(job.getId());
            if (affected == 1) {
                try {
                    self.processJob(job.getId());
                } catch (Exception e) {
                    log.error("Failed to process settlement job #{}", job.getId(), e);
                    self.markJobAsFailed(job.getId(), e.getMessage());
                }
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int claimJob(Long jobId) {
        return jobRepo.claimJobAtomic(jobId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processJob(Long jobId) {
        PredictionSettlementJob job = jobRepo.findById(jobId)
            .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        log.info("Processing prediction settlement job #{} for raceId={}", job.getId(), job.getRace().getId());

        // Fetch official results
        List<RaceResult> results = resultRepo.findByRace_Id(job.getRace().getId());
        
        // Find top 3 actual positions (sorted by position ascending: 1, 2, 3)
        List<Long> actualTop3 = results.stream()
            .filter(r -> r.getPosition() != null && r.getPosition() <= 3)
            .sorted((r1, r2) -> Integer.compare(r1.getPosition(), r2.getPosition()))
            .map(RaceResult::getParticipantId)
            .collect(Collectors.toList());

        Map<Long, Integer> participantPositions = results.stream()
            .filter(r -> r.getPosition() != null)
            .collect(Collectors.toMap(RaceResult::getParticipantId, RaceResult::getPosition, (p1, p2) -> p1));

        Map<Long, String> participantStatuses = results.stream()
            .collect(Collectors.toMap(RaceResult::getParticipantId, RaceResult::getResultStatus, (p1, p2) -> p1));

        List<RacePrediction> predictions = predictionRepo.findByRace_Id(job.getRace().getId());

        int processedCount = 0;
        int rewardedCount = 0;
        int failedCount = 0;

        for (RacePrediction p : predictions) {
            // Check only PENDING or LOCKED predictions
            if (RacePrediction.STATUS_PENDING.equals(p.getStatus()) || RacePrediction.STATUS_LOCKED.equals(p.getStatus())) {
                processedCount++;
                try {
                    boolean shouldRefund = false;
                    if (RacePrediction.TYPE_WINNER.equals(p.getPredictionType())) {
                        if (RaceResult.RESULT_STATUS_WITHDRAWN.equals(participantStatuses.get(p.getPredictedWinnerId()))) {
                            shouldRefund = true;
                        }
                    } else if (RacePrediction.TYPE_TOP3.equals(p.getPredictionType())) {
                        if (RaceResult.RESULT_STATUS_WITHDRAWN.equals(participantStatuses.get(p.getPredictedWinnerId())) ||
                            RaceResult.RESULT_STATUS_WITHDRAWN.equals(participantStatuses.get(p.getPredictedSecondId())) ||
                            RaceResult.RESULT_STATUS_WITHDRAWN.equals(participantStatuses.get(p.getPredictedThirdId()))) {
                            shouldRefund = true;
                        }
                    }

                    if (shouldRefund) {
                        p.setStatus(RacePrediction.STATUS_REFUNDED);
                        p.setEvaluatedAt(LocalDateTime.now());
                        predictionRepo.save(p);
                        pointsService.adjustPoints(
                            p.getSpectator(), p.getEntryCostPoints(), PointTransaction.TX_RACE_CANCEL_REFUND, 
                            PointTransaction.REF_RACE_PREDICTION, p.getId(), 
                            "Refunded " + p.getEntryCostPoints() + " entry cost points due to horse withdrawal"
                        );
                        continue;
                    }

                    boolean isCorrect = false;
                    int reward = 0;

                    if (RacePrediction.TYPE_WINNER.equals(p.getPredictionType())) {
                        Integer pos = participantPositions.get(p.getPredictedWinnerId());
                        if (pos != null && pos == 1) {
                            isCorrect = true;
                            reward = 10;
                        }
                    } else if (RacePrediction.TYPE_TOP3.equals(p.getPredictionType())) {
                        if (actualTop3.size() >= 3) {
                            Long actual1 = actualTop3.get(0);
                            Long actual2 = actualTop3.get(1);
                            Long actual3 = actualTop3.get(2);

                            if (p.getPredictedWinnerId().equals(actual1) &&
                                p.getPredictedSecondId().equals(actual2) &&
                                p.getPredictedThirdId().equals(actual3)) {
                                isCorrect = true;
                                reward = 30; // Exact order
                            } else {
                                // Correct horses, wrong order
                                boolean hasWinner = actualTop3.contains(p.getPredictedWinnerId());
                                boolean hasSecond = actualTop3.contains(p.getPredictedSecondId());
                                boolean hasThird = actualTop3.contains(p.getPredictedThirdId());
                                if (hasWinner && hasSecond && hasThird) {
                                    isCorrect = true;
                                    reward = 15;
                                }
                            }
                        }
                    }

                    if (isCorrect) {
                        p.setStatus(RacePrediction.STATUS_CORRECT);
                        p.setRewardPoints(reward);
                        p.setEvaluatedAt(LocalDateTime.now());
                        predictionRepo.save(p);

                        // Credit reward (Idempotency checked by adjustPoints using index)
                        pointsService.adjustPoints(
                            p.getSpectator(), reward, PointTransaction.TX_PREDICTION_REWARD, 
                            PointTransaction.REF_RACE_PREDICTION, p.getId(), 
                            "Awarded " + reward + " reward points for correct prediction #" + p.getId()
                        );
                        rewardedCount++;
                    } else {
                        p.setStatus(RacePrediction.STATUS_INCORRECT);
                        p.setRewardPoints(0);
                        p.setEvaluatedAt(LocalDateTime.now());
                        predictionRepo.save(p);
                    }
                } catch (Exception ex) {
                    log.error("Failed to evaluate prediction #{}", p.getId(), ex);
                    failedCount++;
                }
            }
        }

        job.setProcessedCount(processedCount);
        job.setRewardedCount(rewardedCount);
        job.setFailedCount(failedCount);
        job.setStatus(failedCount > 0 ? PredictionSettlementJob.STATUS_FAILED : PredictionSettlementJob.STATUS_COMPLETED);
        job.setCompletedAt(LocalDateTime.now());
        job.setErrorMessage(failedCount > 0 ? "Failed to evaluate " + failedCount + " predictions" : null);
        job.setUpdatedAt(LocalDateTime.now());
        jobRepo.save(job);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markJobAsFailed(Long jobId, String message) {
        PredictionSettlementJob job = jobRepo.findById(jobId).orElse(null);
        if (job != null) {
            job.setStatus(PredictionSettlementJob.STATUS_FAILED);
            job.setErrorMessage(message);
            job.setCompletedAt(LocalDateTime.now());
            job.setUpdatedAt(LocalDateTime.now());
            jobRepo.save(job);
            
            // Refund predictions due to system error
            List<RacePrediction> predictions = predictionRepo.findByRace_Id(job.getRace().getId());
            for (RacePrediction p : predictions) {
                if (RacePrediction.STATUS_PENDING.equals(p.getStatus()) || RacePrediction.STATUS_LOCKED.equals(p.getStatus())) {
                    p.setStatus(RacePrediction.STATUS_REFUNDED);
                    p.setUpdatedAt(LocalDateTime.now());
                    predictionRepo.save(p);
                    pointsService.adjustPoints(
                        p.getSpectator(), p.getEntryCostPoints(), PointTransaction.TX_RACE_CANCEL_REFUND, 
                        PointTransaction.REF_RACE_PREDICTION, p.getId(), 
                        "Refunded " + p.getEntryCostPoints() + " entry cost points due to system error processing results"
                    );
                }
            }
        }
    }
}
