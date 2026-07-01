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
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSetting;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettingRepository;
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
    private final PredictionSettingRepository predictionSettingRepo;

    @Autowired
    @Lazy
    private PredictionSettlementScheduler self;

    /** House takeout (margin) fallback for pari-mutuel single-race pools, e.g. 0.15 = keep 15%. */
    @org.springframework.beans.factory.annotation.Value("${app.prediction.takeout-rate:0.15}")
    private java.math.BigDecimal defaultTakeoutRate;

    /** Single end-margin for streak parlays (applied once to the multiplied fair odds). */
    @org.springframework.beans.factory.annotation.Value("${app.prediction.streak-takeout:0.20}")
    private java.math.BigDecimal streakTakeout;

    /** Hard cap on a streak ticket's total multiplier. */
    @org.springframework.beans.factory.annotation.Value("${app.prediction.max-total-odds:100}")
    private java.math.BigDecimal maxTotalOdds;

    /** Hard cap on any single payout (VND). */
    @org.springframework.beans.factory.annotation.Value("${app.prediction.max-payout:1000000000}")
    private long maxPayout;

    public PredictionSettlementScheduler(PredictionSettlementJobRepository jobRepo,
                                         RacePredictionRepository predictionRepo,
                                         RaceResultRepository resultRepo,
                                         WalletService walletService,
                                         StreakPredictionRepository streakPredictionRepo,
                                         StreakPredictionLegRepository streakPredictionLegRepo,
                                         PredictionSettingRepository predictionSettingRepo) {
        this.jobRepo = jobRepo;
        this.predictionRepo = predictionRepo;
        this.resultRepo = resultRepo;
        this.walletService = walletService;
        this.streakPredictionRepo = streakPredictionRepo;
        this.streakPredictionLegRepo = streakPredictionLegRepo;
        this.predictionSettingRepo = predictionSettingRepo;
    }

    private java.math.BigDecimal getTakeoutRate() {
        return predictionSettingRepo.findById(1L)
                .map(PredictionSetting::getTakeoutRate)
                .orElse(defaultTakeoutRate);
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

        Map<Long, Integer> participantPositions = results.stream()
            .filter(r -> r.getPosition() != null)
            .collect(Collectors.toMap(RaceResult::getParticipantId, RaceResult::getPosition, (p1, p2) -> p1));

        Map<Long, com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus> participantStatuses = results.stream()
            .collect(Collectors.toMap(RaceResult::getParticipantId, RaceResult::getResultStatus, (p1, p2) -> p1));

        Map<Long, java.math.BigDecimal> participantFinishTimes = results.stream()
            .filter(r -> r.getFinishTimeSeconds() != null)
            .collect(Collectors.toMap(RaceResult::getParticipantId, RaceResult::getFinishTimeSeconds, (p1, p2) -> p1));

        List<RacePrediction> predictions = predictionRepo.findByRace_Id(job.getRace().getId());

        // Invert the result table: finishing position -> the participant that finished there.
        Map<Integer, Long> horseAtPosition = new java.util.HashMap<>();
        participantPositions.forEach((pid, pos) -> horseAtPosition.put(pos, pid));

        // Pari-mutuel keep ratio (1 - takeout). Total payout of any pool == pool * keep,
        // so the house can never pay out more than it took in (zero house risk).
        java.math.BigDecimal keep = java.math.BigDecimal.ONE.subtract(getTakeoutRate());

        // Only PENDING / LOCKED bets are settled.
        List<RacePrediction> active = predictions.stream()
            .filter(p -> com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING.equals(p.getStatus())
                      || com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED.equals(p.getStatus()))
            .collect(Collectors.toList());

        int processedCount = active.size();
        int rewardedCount = 0;
        int failedCount = 0;

        // 1. Group bets into pools. Bets on a withdrawn horse leave the pool (refunded).
        //    EXACT_POSITION (+ legacy WINNER = position 1) -> one pool per finishing position.
        //    HEAD_TO_HEAD -> one 2-outcome pool per (unordered) matchup.
        Map<Integer, List<RacePrediction>> exactByPosition = new java.util.HashMap<>();
        Map<String, List<RacePrediction>> h2hByMatchup = new java.util.HashMap<>();

        for (RacePrediction p : active) {
            boolean withdrawn = com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus.WITHDRAWN
                    .equals(participantStatuses.get(p.getPredictedWinnerId()));
            if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(p.getPredictionType())) {
                withdrawn = withdrawn || com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus.WITHDRAWN
                        .equals(participantStatuses.get(p.getMatchupOpponentId()));
            }
            if (withdrawn) {
                refundBet(p, "Refund " + stakeOf(p) + " VND (horse withdrawn)");
                continue;
            }

            if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(p.getPredictionType())) {
                long a = p.getPredictedWinnerId();
                long b = p.getMatchupOpponentId();
                String key = Math.min(a, b) + "-" + Math.max(a, b);
                h2hByMatchup.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add(p);
            } else {
                int pos = (RacePrediction.TYPE_WINNER.equals(p.getPredictionType()) || p.getPredictedPosition() == null)
                        ? 1 : p.getPredictedPosition();
                exactByPosition.computeIfAbsent(pos, k -> new java.util.ArrayList<>()).add(p);
            }
        }

        // 2. EXACT_POSITION / WINNER pools: the winner of a column is the horse that finished there.
        for (Map.Entry<Integer, List<RacePrediction>> e : exactByPosition.entrySet()) {
            Long winningHorse = horseAtPosition.get(e.getKey());
            rewardedCount += settlePool(e.getValue(), winningHorse, keep);
        }

        // 3. HEAD_TO_HEAD pools: the winner is the horse that finished ahead (straight-up; ties/DNF -> refund).
        for (List<RacePrediction> bets : h2hByMatchup.values()) {
            Long winningSide = headToHeadWinner(bets.get(0), participantFinishTimes);
            rewardedCount += settlePool(bets, winningSide, keep);
        }

        log.info("Processed {} single race predictions for raceId={}. Rewarded: {}",
                 processedCount, job.getRace().getId(), rewardedCount);

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

    // ---- Pari-mutuel pool settlement helpers ----

    /** Effective stake of a bet (new wager, or legacy entry cost for old rows). */
    private long stakeOf(RacePrediction p) {
        return p.getWagerAmount() != null ? p.getWagerAmount() : p.getEntryCostPoints();
    }

    /** Refund one bet's full stake (idempotent by prediction id). House-neutral. */
    private void refundBet(RacePrediction p, String description) {
        p.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.REFUNDED);
        p.setEvaluatedAt(LocalDateTime.now());
        predictionRepo.save(p);
        walletService.adjust(
            p.getSpectator(), stakeOf(p), WalletTransactionType.BET_REFUND,
            WalletTransaction.REF_RACE_PREDICTION, p.getId(), description
        );
    }

    /**
     * Settle one pari-mutuel pool. A bet wins iff {@code predictedWinnerId == winningHorseId}.
     * Total paid out == pool * keep (<= pool), so the house can never lose on the pool.
     * If nobody backed the winner (or the market is void), every bet is refunded.
     * Returns the number of winning (paid) bets.
     */
    private int settlePool(List<RacePrediction> bets, Long winningHorseId, java.math.BigDecimal keep) {
        if (winningHorseId == null) {
            for (RacePrediction b : bets) {
                refundBet(b, "Refund " + stakeOf(b) + " VND (market voided)");
            }
            return 0;
        }
        long sWin = bets.stream()
            .filter(b -> winningHorseId.equals(b.getPredictedWinnerId()))
            .mapToLong(this::stakeOf).sum();
        if (sWin == 0) {
            for (RacePrediction b : bets) {
                refundBet(b, "Refund " + stakeOf(b) + " VND (no winning bet in pool)");
            }
            return 0;
        }
        long poolSum = bets.stream().mapToLong(this::stakeOf).sum();
        java.math.BigDecimal pNet = java.math.BigDecimal.valueOf(poolSum).multiply(keep);
        java.math.BigDecimal sWinBd = java.math.BigDecimal.valueOf(sWin);
        java.math.BigDecimal poolOdds = pNet.divide(sWinBd, 4, java.math.RoundingMode.HALF_UP);

        int rewarded = 0;
        for (RacePrediction b : bets) {
            if (winningHorseId.equals(b.getPredictedWinnerId())) {
                java.math.BigDecimal finalOdds = b.getLockedOdds() != null
                    && b.getLockedOdds().compareTo(java.math.BigDecimal.ZERO) > 0
                        ? b.getLockedOdds()
                        : poolOdds;
                long reward = java.math.BigDecimal.valueOf(stakeOf(b)).multiply(finalOdds)
                    .setScale(0, java.math.RoundingMode.DOWN).longValueExact();
                b.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.CORRECT);
                b.setLockedOdds(finalOdds);
                b.setRewardPoints(reward);
                b.setEvaluatedAt(LocalDateTime.now());
                predictionRepo.save(b);
                walletService.adjust(
                    b.getSpectator(), reward, WalletTransactionType.BET_PAYOUT,
                    WalletTransaction.REF_RACE_PREDICTION, b.getId(),
                    "Bet payout: +" + reward + " VND for prediction #" + b.getId()
                );
                rewarded++;
            } else {
                b.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.INCORRECT);
                b.setRewardPoints(0);
                b.setEvaluatedAt(LocalDateTime.now());
                predictionRepo.save(b);
            }
        }
        return rewarded;
    }

    /**
     * Straight-up Head-to-Head winner: the horse that finished ahead (smaller finish time).
     * Returns null for a push (exact tie) or when neither finished — caller refunds the pool.
     */
    private Long headToHeadWinner(RacePrediction sample, Map<Long, java.math.BigDecimal> finishTimes) {
        Long x = sample.getPredictedWinnerId();
        Long y = sample.getMatchupOpponentId();
        java.math.BigDecimal tx = finishTimes.get(x);
        java.math.BigDecimal ty = finishTimes.get(y);
        if (tx != null && ty != null) {
            int cmp = tx.compareTo(ty);
            if (cmp < 0) return x;
            if (cmp > 0) return y;
            return null; // exact tie -> push
        }
        if (tx != null) return x; // opponent did not finish
        if (ty != null) return y; // backed horse did not finish, opponent did
        return null; // both DNF -> refund
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
                int wonCount = 0;
                // True parlay: multiply the WON legs' fair odds. REFUNDED (void) legs contribute
                // factor 1.0 (skipped), never their odds — fixes the additive/void-leg overpay bug.
                java.math.BigDecimal product = java.math.BigDecimal.ONE;

                for (StreakPredictionLeg l : streak.getLegs()) {
                    if (com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.LOST.equals(l.getStatus())) {
                        hasLost = true;
                        break;
                    }
                    if (com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.PENDING.equals(l.getStatus())) {
                        allFinished = false;
                    } else if (com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.WON.equals(l.getStatus())) {
                        product = product.multiply(l.getLockedOdds());
                        wonCount++;
                    }
                }

                if (hasLost) {
                    streak.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.LOST);
                    streak.setEvaluatedAt(LocalDateTime.now());
                } else if (allFinished) {
                    streak.setEvaluatedAt(LocalDateTime.now());
                    if (wonCount == 0) {
                        // Every leg was voided -> refund the stake (house-neutral).
                        streak.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.REFUNDED);
                        streak.setTotalOdds(java.math.BigDecimal.ONE.setScale(2, java.math.RoundingMode.HALF_UP));
                        streak.setRewardPoints(streak.getWagerAmount());
                        walletService.adjust(
                            streak.getSpectator(), streak.getWagerAmount(), WalletTransactionType.BET_REFUND,
                            WalletTransaction.REF_STREAK_PREDICTION, streak.getId(),
                            "Streak refund (all legs voided) #" + streak.getId()
                        );
                    } else {
                        java.math.BigDecimal totalOdds = product.multiply(java.math.BigDecimal.ONE.subtract(streakTakeout));
                        if (totalOdds.compareTo(maxTotalOdds) > 0) {
                            totalOdds = maxTotalOdds;
                        }
                        streak.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.WON);
                        streak.setTotalOdds(totalOdds.setScale(2, java.math.RoundingMode.HALF_UP));
                        long reward = java.math.BigDecimal.valueOf(streak.getWagerAmount()).multiply(totalOdds)
                                .setScale(0, java.math.RoundingMode.DOWN).longValueExact();
                        if (reward > maxPayout) {
                            reward = maxPayout;
                        }
                        streak.setRewardPoints(reward);
                        walletService.adjust(
                            streak.getSpectator(), reward, WalletTransactionType.BET_PAYOUT,
                            WalletTransaction.REF_STREAK_PREDICTION, streak.getId(),
                            "Streak payout: +" + reward + " VND #" + streak.getId()
                        );
                    }
                } else {
                    streak.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.IN_PROGRESS);
                    java.math.BigDecimal partial = product.multiply(java.math.BigDecimal.ONE.subtract(streakTakeout));
                    if (partial.compareTo(maxTotalOdds) > 0) {
                        partial = maxTotalOdds;
                    }
                    streak.setTotalOdds(partial.setScale(2, java.math.RoundingMode.HALF_UP));
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
