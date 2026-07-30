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

    // Lấy công việc (job) để xử lý (đảm bảo atomic/đồng bộ giữa các thread nếu có)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int claimJob(Long jobId) {
        return jobRepo.claimJobAtomic(jobId);
    }

    // Xử lý trả thưởng / hoàn tiền cho một job đã được lấy
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processJob(Long jobId) {
        PredictionSettlementJob job = jobRepo.findById(jobId)
            .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        log.info("Processing prediction settlement job #{} for raceId={}", job.getId(), job.getRace().getId());

        // Lấy kết quả chính thức của cuộc đua
        List<RaceResult> results = resultRepo.findByRace_Id(job.getRace().getId());

        // Map lưu vị trí về đích của từng ngựa đua (Mã ngựa -> Vị trí)
        Map<Long, Integer> participantPositions = results.stream()
            .filter(r -> r.getPosition() != null)
            .collect(Collectors.toMap(RaceResult::getParticipantId, RaceResult::getPosition, (p1, p2) -> p1));

        // Map lưu trạng thái về đích của ngựa (Hoàn thành, DNF, Bỏ cuộc...)
        Map<Long, com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus> participantStatuses = results.stream()
            .collect(Collectors.toMap(RaceResult::getParticipantId, RaceResult::getResultStatus, (p1, p2) -> p1));

        // Map lưu thời gian hoàn thành vòng đua của ngựa
        Map<Long, java.math.BigDecimal> participantFinishTimes = results.stream()
            .filter(r -> r.getFinishTimeSeconds() != null)
            .collect(Collectors.toMap(RaceResult::getParticipantId, RaceResult::getFinishTimeSeconds, (p1, p2) -> p1));

        // Lấy tất cả dự đoán cho cuộc đua này
        List<RacePrediction> predictions = predictionRepo.findByRace_Id(job.getRace().getId());

        // Đảo ngược bảng kết quả: Vị trí về đích -> Ngựa nào về vị trí đó
        Map<Integer, Long> horseAtPosition = new java.util.HashMap<>();
        participantPositions.forEach((pid, pos) -> horseAtPosition.put(pos, pid));

        // Tỷ lệ giữ lại của nhà cái trong mô hình pari-mutuel (1 - takeout). 
        // Tổng tiền trả thưởng của bất kỳ nhóm (pool) nào = pool * keep
        // Do đó nhà cái không bao giờ trả thưởng nhiều hơn số tiền thu vào (không có rủi ro cho nhà cái).
        java.math.BigDecimal keep = java.math.BigDecimal.ONE.subtract(getTakeoutRate());

        // Chỉ những vé cược đang ở trạng thái PENDING hoặc LOCKED mới được xử lý trả thưởng
        List<RacePrediction> active = predictions.stream()
            .filter(p -> com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING.equals(p.getStatus())
                      || com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED.equals(p.getStatus()))
            .collect(Collectors.toList());

        int processedCount = active.size();
        int rewardedCount = 0;
        int failedCount = 0;

        // 1. Nhóm các cược vào các pool (nhóm cược). Các cược vào ngựa đã rút lui sẽ bị loại khỏi pool (được hoàn tiền).
        //    EXACT_POSITION (Cược vị trí chính xác) -> mỗi vị trí là một pool.
        //    HEAD_TO_HEAD (Đối đầu) -> mỗi cặp đấu là một pool gồm 2 kết quả.
        Map<Integer, List<RacePrediction>> exactByPosition = new java.util.HashMap<>();
        Map<String, List<RacePrediction>> h2hByMatchup = new java.util.HashMap<>();

        for (RacePrediction p : active) {
            // Kiểm tra xem ngựa cược (hoặc đối thủ trong kèo đối đầu) có bị rút lui hay không
            boolean withdrawn = com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus.WITHDRAWN
                    .equals(participantStatuses.get(p.getPredictedWinnerId()));
            if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(p.getPredictionType())) {
                withdrawn = withdrawn || com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus.WITHDRAWN
                        .equals(participantStatuses.get(p.getMatchupOpponentId()));
            }
            if (withdrawn) {
                // Hoàn tiền cho những vé cược mà ngựa bị rút lui
                refundBet(p, "Refund " + stakeOf(p) + " VND (horse withdrawn)");
                continue;
            }

            // Phân loại cược vào các pool tương ứng
            if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(p.getPredictionType())) {
                long a = p.getPredictedWinnerId();
                long b = p.getMatchupOpponentId();
                String key = Math.min(a, b) + "-" + Math.max(a, b); // Khóa chung cho 2 ngựa đối đầu
                h2hByMatchup.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add(p);
            } else {
                int pos = (RacePrediction.TYPE_WINNER.equals(p.getPredictionType()) || p.getPredictedPosition() == null)
                        ? 1 : p.getPredictedPosition(); // Mặc định là vị trí 1 nếu không chỉ định
                exactByPosition.computeIfAbsent(pos, k -> new java.util.ArrayList<>()).add(p);
            }
        }

        // 2. Xử lý trả thưởng cho cược vị trí chính xác (EXACT_POSITION): người thắng pool là người đoán trúng ngựa về đúng vị trí đó
        for (Map.Entry<Integer, List<RacePrediction>> e : exactByPosition.entrySet()) {
            Long winningHorse = horseAtPosition.get(e.getKey());
            rewardedCount += settlePool(e.getValue(), winningHorse, keep);
        }

        // 3. Xử lý trả thưởng cho cược đối đầu (HEAD_TO_HEAD): người thắng pool là người đoán trúng ngựa có thời gian hoàn thành nhỏ hơn. Nếu hòa hoặc không về đích -> hoàn tiền.
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

    // ---- Các hàm hỗ trợ tính toán pool (Pari-mutuel) ----

    /** Lấy số tiền cược hợp lệ (tiền cược hiện tại hoặc chi phí vé vào cũ). */
    private long stakeOf(RacePrediction p) {
        return p.getWagerAmount() != null ? p.getWagerAmount() : p.getEntryCostPoints();
    }

    /** Hoàn trả toàn bộ tiền cược cho một vé (idempotent qua ID cược). Không ảnh hưởng rủi ro nhà cái. */
    private void refundBet(RacePrediction p, String description) {
        p.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.REFUNDED); // Đặt trạng thái Hoàn tiền
        p.setEvaluatedAt(LocalDateTime.now());
        predictionRepo.save(p);
        walletService.adjust(
            p.getSpectator(), stakeOf(p), WalletTransactionType.BET_REFUND,
            WalletTransaction.REF_RACE_PREDICTION, p.getId(), description
        );
    }

    /**
     * Xử lý trả thưởng cho một pool (nhóm cược). Một vé thắng nếu {@code predictedWinnerId == winningHorseId}.
     * Tổng số tiền trả thưởng = tổng tiền pool * keep (<= pool), đảm bảo nhà cái không bao giờ lỗ.
     * Nếu không ai cược trúng ngựa thắng (hoặc kèo bị hủy), mọi vé đều được hoàn tiền.
     * Trả về số lượng vé thắng được trả thưởng.
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
     * Xác định người chiến thắng đối đầu (Head-to-Head) trực tiếp: ngựa hoàn thành vòng đua với thời gian ngắn hơn.
     * Trả về null nếu hòa (thời gian bằng nhau) hoặc cả 2 không về đích -> hàm gọi sẽ hoàn tiền cả pool.
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
        if (tx != null) return x; // đối thủ không về đích
        if (ty != null) return y; // ngựa mình cược không về đích, nhưng đối thủ về đích
        return null; // cả 2 đều không hoàn thành (DNF) -> hoàn tiền
    }

    private void processStreakLegs(Long raceId, Map<Long, Integer> participantPositions, Map<Long, com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus> participantStatuses) {
        // Lấy tất cả các chân cược (legs) thuộc về cuộc đua này
        List<StreakPredictionLeg> legs = streakPredictionLegRepo.findByRace_Id(raceId);

        for (StreakPredictionLeg leg : legs) {
            if (!com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.PENDING.equals(leg.getStatus())) {
                continue;
            }

            Long winnerId = leg.getPredictedWinner().getId();

            // Nếu ngựa được chọn bị rút lui -> hoàn tiền chân cược này (đổi odds thành 0)
            if (com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus.WITHDRAWN.equals(participantStatuses.get(winnerId))) {
                leg.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.REFUNDED);
                leg.setLockedOdds(java.math.BigDecimal.ZERO);
            } else {
                Integer pos = participantPositions.get(winnerId);
                // Nếu ngựa về đích đầu tiên (vị trí 1) -> chân cược thắng
                if (pos != null && pos == 1) {
                    leg.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.WON);
                } else {
                    // Nếu không -> chân cược thua
                    leg.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.LOST);
                }
            }
            streakPredictionLegRepo.save(leg);

            // Kiểm tra trạng thái toàn bộ chuỗi xiên (Streak Prediction) sau khi cập nhật chân cược này
            StreakPrediction streak = leg.getStreakPrediction();
            if (com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.PENDING.equals(streak.getStatus()) || com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.IN_PROGRESS.equals(streak.getStatus())) {
                boolean hasLost = false;
                boolean allFinished = true;
                int wonCount = 0;
                // Cược xiên thực sự (True parlay) được sửa đổi: tính tổng tỷ lệ cược công bằng của các chân cược THẮNG. 
                java.math.BigDecimal sumOdds = java.math.BigDecimal.ZERO;

                for (StreakPredictionLeg l : streak.getLegs()) {
                    if (com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.LOST.equals(l.getStatus())) {
                        hasLost = true; // Chỉ cần 1 chân thua -> toàn bộ xiên thua
                        break;
                    }
                    if (com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.PENDING.equals(l.getStatus())) {
                        allFinished = false; // Vẫn còn chân cược chưa có kết quả
                    } else if (com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.WON.equals(l.getStatus())) {
                        sumOdds = sumOdds.add(l.getLockedOdds()); // Cộng dồn tỷ lệ cược của các chân thắng
                        wonCount++;
                    }
                }

                if (hasLost) {
                    streak.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.LOST);
                    streak.setEvaluatedAt(LocalDateTime.now());
                } else if (allFinished) {
                    streak.setEvaluatedAt(LocalDateTime.now());
                    if (wonCount == 0) {
                        // Mọi chân cược đều bị hủy (ví dụ: ngựa rút lui hết) -> hoàn tiền vé xiên (không ảnh hưởng nhà cái).
                        streak.setStatus(com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus.REFUNDED);
                        streak.setTotalOdds(java.math.BigDecimal.ONE.setScale(2, java.math.RoundingMode.HALF_UP));
                        streak.setRewardPoints(streak.getWagerAmount());
                        walletService.adjust(
                            streak.getSpectator(), streak.getWagerAmount(), WalletTransactionType.BET_REFUND,
                            WalletTransaction.REF_STREAK_PREDICTION, streak.getId(),
                            "Streak refund (all legs voided) #" + streak.getId()
                        );
                    } else {
                        java.math.BigDecimal totalOdds = sumOdds;
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
                    java.math.BigDecimal partial = sumOdds;
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
                    LocalDateTime refundedAt = LocalDateTime.now();
                    p.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.REFUNDED);
                    p.setEvaluatedAt(refundedAt);
                    p.setUpdatedAt(refundedAt);
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
