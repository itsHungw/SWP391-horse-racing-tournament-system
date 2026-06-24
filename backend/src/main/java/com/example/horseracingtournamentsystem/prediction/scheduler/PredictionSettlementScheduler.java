package com.example.horseracingtournamentsystem.prediction.scheduler;

import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.entity.StreakPrediction;
import com.example.horseracingtournamentsystem.prediction.entity.StreakPredictionLeg;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionLegRepository;
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
    private final WalletService walletService;
    private final StreakPredictionRepository streakPredictionRepo;
    private final StreakPredictionLegRepository streakPredictionLegRepo;

    @Autowired
    @Lazy
    private PredictionSettlementScheduler self;

    public PredictionSettlementScheduler(PredictionSettlementJobRepository jobRepo,
                                         RacePredictionRepository predictionRepo,
                                         RaceResultRepository resultRepo,
                                         WalletService walletService,
                                         StreakPredictionRepository streakPredictionRepo,
                                         StreakPredictionLegRepository streakPredictionLegRepo) {
        this.jobRepo = jobRepo;
        this.predictionRepo = predictionRepo;
        this.resultRepo = resultRepo;
        this.walletService = walletService;
        this.streakPredictionRepo = streakPredictionRepo;
        this.streakPredictionLegRepo = streakPredictionLegRepo;
    }

    @Scheduled(fixedDelay = 5000)
    public void pollAndProcessJobs() {
        List<PredictionSettlementJob> pendingJobs = jobRepo.findByStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionSettlementJobStatus.PENDING);
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

        Map<Long, com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus> participantStatuses = results.stream()
            .collect(Collectors.toMap(RaceResult::getParticipantId, RaceResult::getResultStatus, (p1, p2) -> p1));

        Map<Long, java.math.BigDecimal> participantFinishTimes = results.stream()
            .filter(r -> r.getFinishTimeSeconds() != null)
            .collect(Collectors.toMap(RaceResult::getParticipantId, RaceResult::getFinishTimeSeconds, (p1, p2) -> p1));

        List<RacePrediction> predictions = predictionRepo.findByRace_Id(job.getRace().getId());

        int processedCount = 0;
        int rewardedCount = 0;
        int failedCount = 0;

        for (RacePrediction p : predictions) {
            // Check only PENDING or LOCKED predictions
            if (com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING.equals(p.getStatus()) || com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED.equals(p.getStatus())) {
                processedCount++;
                try {
                    boolean shouldRefund = false;
                    if (RacePrediction.TYPE_WINNER.equals(p.getPredictionType()) || RacePrediction.TYPE_EXACT_POSITION.equals(p.getPredictionType())) {
                        if (com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus.WITHDRAWN.equals(participantStatuses.get(p.getPredictedWinnerId()))) {
                            shouldRefund = true;
                        }
                    } else if (RacePrediction.TYPE_TOP3.equals(p.getPredictionType())) {
                        if (com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus.WITHDRAWN.equals(participantStatuses.get(p.getPredictedWinnerId())) ||
                            com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus.WITHDRAWN.equals(participantStatuses.get(p.getPredictedSecondId())) ||
                            com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus.WITHDRAWN.equals(participantStatuses.get(p.getPredictedThirdId()))) {
                            shouldRefund = true;
                        }
                    } else if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(p.getPredictionType())) {
                        if (com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus.WITHDRAWN.equals(participantStatuses.get(p.getPredictedWinnerId())) ||
                            com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus.WITHDRAWN.equals(participantStatuses.get(p.getMatchupOpponentId()))) {
                            shouldRefund = true;
                        }
                    }

                    if (shouldRefund) {
                        p.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.REFUNDED);
                        p.setEvaluatedAt(LocalDateTime.now());
                        predictionRepo.save(p);
                        long refundAmount = p.getWagerAmount() != null ? p.getWagerAmount() : p.getEntryCostPoints();
                        walletService.adjust(
                            p.getSpectator(), refundAmount, WalletTransactionType.BET_REFUND,
                            WalletTransaction.REF_RACE_PREDICTION, p.getId(),
                            "Refund " + refundAmount + " VND (horse withdrawn)"
                        );
                        continue;
                    }

                    boolean isCorrect = false;
                    long reward = 0;

                    if (RacePrediction.TYPE_WINNER.equals(p.getPredictionType())) {
                        Integer pos = participantPositions.get(p.getPredictedWinnerId());
                        if (pos != null && pos == 1) {
                            isCorrect = true;
                        }
                    } else if (RacePrediction.TYPE_EXACT_POSITION.equals(p.getPredictionType())) {
                        Integer pos = participantPositions.get(p.getPredictedWinnerId());
                        if (pos != null && pos.equals(p.getPredictedPosition())) {
                            isCorrect = true;
                        }
                    } else if (RacePrediction.TYPE_TOP3.equals(p.getPredictionType())) {
                        if (actualTop3.size() >= 3) {
                            Long actual1 = actualTop3.get(0);
                            Long actual2 = actualTop3.get(1);
                            Long actual3 = actualTop3.get(2);

                            if (p.getPredictedWinnerId().equals(actual1) &&
                                p.getPredictedSecondId().equals(actual2) &&
                                p.getPredictedThirdId().equals(actual3)) {
                                isCorrect = true; // Exact order
                            } else {
                                // Correct horses, wrong order
                                boolean hasWinner = actualTop3.contains(p.getPredictedWinnerId());
                                boolean hasSecond = actualTop3.contains(p.getPredictedSecondId());
                                boolean hasThird = actualTop3.contains(p.getPredictedThirdId());
                                if (hasWinner && hasSecond && hasThird) {
                                    isCorrect = true;
                                }
                            }
                        }
                    } else if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(p.getPredictionType())) {
                        java.math.BigDecimal timeA = participantFinishTimes.get(p.getPredictedWinnerId());
                        java.math.BigDecimal timeB = participantFinishTimes.get(p.getMatchupOpponentId());
                        if (timeA != null && timeB != null) {
                            java.math.BigDecimal effectiveTimeA = timeA.add(java.math.BigDecimal.valueOf(p.getHandicapSeconds() != null ? p.getHandicapSeconds() : 0.0));
                            if (effectiveTimeA.compareTo(timeB) < 0) {
                                isCorrect = true;
                            }
                        }
                    }

                    if (isCorrect) {
                        p.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.CORRECT);

                        // Dynamic Payout: wagerAmount * lockedOdds
                        // (Fallback to old logic if lockedOdds is null, for backward compatibility with old data)
                        if (p.getLockedOdds() != null && p.getWagerAmount() != null) {
                            java.math.BigDecimal payout = java.math.BigDecimal.valueOf(p.getWagerAmount()).multiply(p.getLockedOdds());
                            reward = payout.setScale(0, java.math.RoundingMode.HALF_UP).longValueExact();
                        }

                        p.setRewardPoints(reward);
                        p.setEvaluatedAt(LocalDateTime.now());
                        predictionRepo.save(p);

                        // Trả thưởng vào ví (idempotent theo prediction id)
                        walletService.adjust(
                            p.getSpectator(), reward, WalletTransactionType.BET_PAYOUT,
                            WalletTransaction.REF_RACE_PREDICTION, p.getId(),
                            "Bet payout: +" + reward + " VND for prediction #" + p.getId()
                        );
                        rewardedCount++;
                    } else {
                        p.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.INCORRECT);
                        p.setRewardPoints(0);
                        p.setEvaluatedAt(LocalDateTime.now());
                        predictionRepo.save(p);
                    }
                } catch (Exception ex) {
                    failedCount++;
                    log.error("Failed to evaluate prediction #{}", p.getId(), ex);
                }
            }
        }

        log.info("Processed {} single race predictions for raceId={}. Rewarded: {}, Failed: {}",
                 processedCount, job.getRace().getId(), rewardedCount, failedCount);

        // --- Process Streak Prediction Legs ---
        processStreakLegs(job.getRace().getId(), participantPositions, participantStatuses);

        job.setStatus(failedCount > 0 ? com.example.horseracingtournamentsystem.prediction.enums.PredictionSettlementJobStatus.FAILED : com.example.horseracingtournamentsystem.prediction.enums.PredictionSettlementJobStatus.COMPLETED);
        job.setProcessedCount(processedCount);
        job.setRewardedCount(rewardedCount);
        job.setFailedCount(failedCount);
        job.setCompletedAt(LocalDateTime.now());
        job.setErrorMessage(failedCount > 0 ? "Failed to evaluate " + failedCount + " predictions" : null);
        job.setUpdatedAt(LocalDateTime.now());
        jobRepo.save(job);
    }

    private void processStreakLegs(Long raceId, Map<Long, Integer> participantPositions, Map<Long, com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus> participantStatuses) {
        List<StreakPredictionLeg> legs = streakPredictionLegRepo.findByRace_Id(raceId);

        for (StreakPredictionLeg leg : legs) {
            if (!com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.PENDING.equals(leg.getStatus())) {
                continue;
            }

            Long winnerId = leg.getPredictedWinner().getId();

            if (com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus.WITHDRAWN.equals(participantStatuses.get(winnerId))) {
                leg.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.REFUNDED);
                leg.setLockedOdds(java.math.BigDecimal.ZERO);
            } else {
                Integer pos = participantPositions.get(winnerId);
                if (pos != null && pos == 1) {
                    leg.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.WON);
                } else {
                    leg.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.LOST);
                }
            }
            streakPredictionLegRepo.save(leg);

            StreakPrediction streak = leg.getStreakPrediction();
            if (com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.PENDING.equals(streak.getStatus()) || com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.IN_PROGRESS.equals(streak.getStatus())) {
                boolean hasLost = false;
                boolean allFinished = true;
                java.math.BigDecimal currentTotalOdds = java.math.BigDecimal.ZERO;

                for (StreakPredictionLeg l : streak.getLegs()) {
                    if (com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.LOST.equals(l.getStatus())) {
                        hasLost = true;
                        break;
                    }
                    if (com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.PENDING.equals(l.getStatus())) {
                        allFinished = false;
                    } else if (com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.WON.equals(l.getStatus()) || com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.REFUNDED.equals(l.getStatus())) {
                        currentTotalOdds = currentTotalOdds.add(l.getLockedOdds());
                    }
                }

                if (hasLost) {
                    streak.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.LOST);
                    streak.setEvaluatedAt(LocalDateTime.now());
                } else if (allFinished) {
                    streak.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.WON);
                    streak.setTotalOdds(currentTotalOdds.setScale(2, java.math.RoundingMode.HALF_UP));
                    streak.setEvaluatedAt(LocalDateTime.now());

                    long reward = java.math.BigDecimal.valueOf(streak.getWagerAmount()).multiply(streak.getTotalOdds())
                            .setScale(0, java.math.RoundingMode.HALF_UP).longValueExact();
                    streak.setRewardPoints(reward);

                    walletService.adjust(
                        streak.getSpectator(), reward, WalletTransactionType.BET_PAYOUT,
                        WalletTransaction.REF_STREAK_PREDICTION, streak.getId(),
                        "Streak payout: +" + reward + " VND #" + streak.getId()
                    );
                } else {
                    streak.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.IN_PROGRESS);
                    streak.setTotalOdds(currentTotalOdds.setScale(2, java.math.RoundingMode.HALF_UP));
                }
                streakPredictionRepo.save(streak);
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markJobAsFailed(Long jobId, String message) {
        PredictionSettlementJob job = jobRepo.findById(jobId).orElse(null);
        if (job != null) {
            job.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionSettlementJobStatus.FAILED);
            job.setErrorMessage(message);
            job.setCompletedAt(LocalDateTime.now());
            job.setUpdatedAt(LocalDateTime.now());
            jobRepo.save(job);
            
            // Refund predictions due to system error
            List<RacePrediction> predictions = predictionRepo.findByRace_Id(job.getRace().getId());
            for (RacePrediction p : predictions) {
                if (com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING.equals(p.getStatus()) || com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED.equals(p.getStatus())) {
                    p.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.REFUNDED);
                    p.setUpdatedAt(LocalDateTime.now());
                    predictionRepo.save(p);
                    long refundAmount = p.getWagerAmount() != null ? p.getWagerAmount() : p.getEntryCostPoints();
                    walletService.adjust(
                        p.getSpectator(), refundAmount, WalletTransactionType.BET_REFUND,
                        WalletTransaction.REF_RACE_PREDICTION, p.getId(),
                        "Refund " + refundAmount + " VND (system error during settlement)"
                    );
                }
            }
        }
    }
}
