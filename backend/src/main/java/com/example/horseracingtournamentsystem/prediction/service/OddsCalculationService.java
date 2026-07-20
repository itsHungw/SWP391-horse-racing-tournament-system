package com.example.horseracingtournamentsystem.prediction.service;

import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionQuoteResponse;
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSetting;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettingRepository;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionOptionsResponse.HeadToHeadMatchup;

@Service
public class OddsCalculationService {

    private final RaceResultRepository resultRepo;
    private final RacePredictionRepository predictionRepo;
    private final PredictionSettingRepository predictionSettingRepo;
    private final com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionLegRepository streakLegRepo;
   
    /**
     * Tỷ lệ hoa hồng mặc định của nhà cái (takeout rate) làm fallback.
     */
    @Value("${app.prediction.takeout-rate:0.15}")
    private BigDecimal defaultTakeoutRate;

    /**
     * Lượng thanh khoản ảo mặc định (Virtual display seed) làm fallback.
     */
    @Value("${app.prediction.display-seed:200000}")
    private double defaultDisplaySeed;

    public OddsCalculationService(RaceResultRepository resultRepo, 
                                  RacePredictionRepository predictionRepo,
                                  PredictionSettingRepository predictionSettingRepo,
                                  com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionLegRepository streakLegRepo) {
        this.resultRepo = resultRepo;
        this.predictionRepo = predictionRepo;
        this.predictionSettingRepo = predictionSettingRepo;
        this.streakLegRepo = streakLegRepo;
    }

    private double getDisplaySeed() {
        return predictionSettingRepo.findById(1L)
                .map(PredictionSetting::getDisplaySeed)
                .orElse(defaultDisplaySeed);
    }

    public BigDecimal getTakeoutRate() {
        return predictionSettingRepo.findById(1L)
                .map(PredictionSetting::getTakeoutRate)
                .orElse(defaultTakeoutRate);
    }

    /**
     * Tính toán tỷ lệ cược (odds) dựa trên công thức Pari-mutuel kết hợp thanh khoản ảo.
     * Công thức: odds = (vPool + totalRealBets) * rMargin / (vHorse + realBetsOnHorse)
     *
     * @param vPool Lượng thanh khoản ảo của tổng quỹ (ví dụ: displaySeed).
     *              TÁC DỤNG VÀ LÝ DO SỬ DỤNG:
     *              1. Giải quyết bài toán "khởi đầu lạnh" (Cold Start) và chia cho 0: Khi trận đấu mới mở, chưa có ai đặt cược thật 
     *                 (totalRealBets = 0, realBetsOnHorse = 0), nếu không có vPool và vHorse thì không thể tính được tỷ lệ cược (lỗi chia cho 0). 
     *                 vPool giúp hiển thị một tỷ lệ cược mở màn hợp lý dựa trên dữ liệu lịch sử.
     *              2. Giảm thiểu biến động cực đoan (Price Smoothing): Tránh việc tỷ lệ cược bị nhảy vọt hoặc sụt giảm quá mức 
     *                 khi chỉ có một vài người chơi đặt các khoản cược nhỏ ban đầu. Lượng thanh khoản ảo hoạt động như một bộ đệm (buffer) 
     *                 giúp tỷ lệ thay đổi mượt mà hơn khi tiền cược thật được nạp thêm vào hệ thống.
     *              3. Không gây rủi ro tài chính cho nhà cái: vPool chỉ là giá trị "ảo" dùng để tính toán tỷ lệ hiển thị (display-only). 
     *                 Khi trận đấu kết thúc và thực hiện trả thưởng (settlement), hệ thống sẽ chỉ chia đều quỹ cược thật (Real Pool) 
     *                 cho những người thắng cuộc. Do đó, nhà cái không phải tự bỏ tiền túi ra trả cho phần vPool này.
     * @param totalRealBets Tổng tiền cược thực tế của người chơi cho vị trí/lựa chọn này
     * @param rMargin Tỷ lệ giữ lại để trả thưởng cho người chơi (1 - takeoutRate)
     * @param vHorse Lượng thanh khoản ảo được phân bổ cho ngựa/lựa chọn này
     * @param realBetsOnHorse Tiền cược thực tế đặt cho ngựa/lựa chọn này
     * @return Tỷ lệ cược (odds) sau khi tính toán, được làm tròn đến 2 chữ số thập phân
     */
    public BigDecimal calculateOdds(double vPool, double totalRealBets, double rMargin, double vHorse,
            double realBetsOnHorse) {
        double numerator = (vPool + totalRealBets) * rMargin;
        double denominator = vHorse + realBetsOnHorse;
        if (denominator == 0)
            return BigDecimal.ZERO;

        double rawOdds = numerator / denominator;
        return BigDecimal.valueOf(rawOdds).setScale(2, RoundingMode.HALF_UP);
    }

    public PredictionQuoteResponse quoteExactPosition(
            Long raceId,
            List<RaceParticipant> participants,
            Long participantId,
            Integer position,
            long stake
    ) {
        int n = participants.size();
        if (n == 0 || position == null || position < 1 || position > n) {
            throw new IllegalArgumentException("Invalid prediction parameters");
        }

        Map<Long, Map<Integer, Double>> rawProb = new HashMap<>();
        Map<Integer, Double> colSum = new HashMap<>();
        for (int j = 1; j <= n; j++) {
            colSum.put(j, 0.0);
        }

        for (RaceParticipant participant : participants) {
            Map<Integer, Double> participantProbs = new HashMap<>();
            Long horseId = participant.getHorse().getId();
            long totalRaces = resultRepo.countTotalRacesByHorseId(horseId);
            List<Object[]> posCounts = resultRepo.countPositionsByHorseId(horseId);

            Map<Integer, Long> counts = new HashMap<>();
            for (Object[] row : posCounts) {
                if (row[0] != null) {
                    counts.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
                }
            }

            for (int j = 1; j <= n; j++) {
                double probability = (counts.getOrDefault(j, 0L) + 1.0) / (totalRaces + n);
                participantProbs.put(j, probability);
                colSum.put(j, colSum.get(j) + probability);
            }
            rawProb.put(participant.getId(), participantProbs);
        }

        if (!rawProb.containsKey(participantId)) {
            throw new IllegalArgumentException("Predicted participant not found");
        }

        double playerPoolBefore = 0.0;
        double outcomeStakeBefore = 0.0;
        List<RacePrediction> activePredictions = predictionRepo.findByRace_IdAndStatus(raceId,
                com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING);
        activePredictions.addAll(predictionRepo.findByRace_IdAndStatus(raceId,
                com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED));

        for (RacePrediction prediction : activePredictions) {
            if (!RacePrediction.TYPE_EXACT_POSITION.equals(prediction.getPredictionType())
                    || prediction.getPredictedWinnerId() == null
                    || prediction.getPredictedPosition() == null
                    || prediction.getPredictedPosition().intValue() != position.intValue()) {
                continue;
            }
            double wager = prediction.getWagerAmount() != null ? prediction.getWagerAmount() : 0.0;
            playerPoolBefore += wager;
            if (prediction.getPredictedWinnerId().equals(participantId)) {
                outcomeStakeBefore += wager;
            }
        }

        double normalizedProb = rawProb.get(participantId).get(position) / colSum.get(position);
        double flat = (normalizedProb + 1.0 / n) / 2.0;
        double displaySeedVal = getDisplaySeed();
        double selectedPricingLiquidity = displaySeedVal * flat;
        double keep = 1.0 - getTakeoutRate().doubleValue();

        BigDecimal currentOdds = calculateOdds(displaySeedVal, playerPoolBefore, keep, selectedPricingLiquidity, outcomeStakeBefore);
        BigDecimal oddsAfterStake = calculateOdds(displaySeedVal, playerPoolBefore + stake, keep, selectedPricingLiquidity, outcomeStakeBefore + stake);

        return buildQuote(
                raceId,
                RacePrediction.TYPE_EXACT_POSITION,
                participantId,
                position,
                stake,
                currentOdds,
                oddsAfterStake,
                Math.round(playerPoolBefore),
                Math.round(playerPoolBefore + stake),
                Math.round(displaySeedVal),
                "Player pool is real VND. Pricing liquidity is virtual and only used to smooth the displayed odds."
        );
    }

    public PredictionQuoteResponse quoteHeadToHead(
            Long raceId,
            List<RaceParticipant> participants,
            Long participantId,
            long stake
    ) {
        List<HeadToHeadMatchup> matchups = calculateH2HMatchups(raceId, participants);
        HeadToHeadMatchup selected = matchups.stream()
                .filter(matchup -> matchup.getParticipantAId().equals(participantId)
                        || matchup.getParticipantBId().equals(participantId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid participant for H2H matchup"));

        long betsA = predictionRepo.sumWagersByRaceAndTypeAndParticipant(raceId, RacePrediction.TYPE_HEAD_TO_HEAD,
                selected.getParticipantAId());
        long betsB = predictionRepo.sumWagersByRaceAndTypeAndParticipant(raceId, RacePrediction.TYPE_HEAD_TO_HEAD,
                selected.getParticipantBId());

        double pricingPool = getDisplaySeed();
        double keep = 1.0 - getTakeoutRate().doubleValue();
        double sideLiquidity = pricingPool * 0.5;
        boolean selectedA = selected.getParticipantAId().equals(participantId);
        double selectedBetsBefore = selectedA ? betsA : betsB;
        double playerPoolBefore = betsA + betsB;
        BigDecimal currentOdds = selectedA ? selected.getOddsA() : selected.getOddsB();
        BigDecimal oddsAfterStake = calculateOdds(
                pricingPool,
                playerPoolBefore + stake,
                keep,
                sideLiquidity,
                selectedBetsBefore + stake
        );

        return buildQuote(
                raceId,
                RacePrediction.TYPE_HEAD_TO_HEAD,
                participantId,
                null,
                stake,
                currentOdds,
                oddsAfterStake,
                Math.round(playerPoolBefore),
                Math.round(playerPoolBefore + stake),
                Math.round(pricingPool),
                "Player pool is real VND. Pricing liquidity is virtual and only used to smooth the displayed odds."
        );
    }

    private PredictionQuoteResponse buildQuote(
            Long raceId,
            String predictionType,
            Long participantId,
            Integer position,
            long stake,
            BigDecimal currentOdds,
            BigDecimal oddsAfterStake,
            long playerPoolBefore,
            long playerPoolAfter,
            long pricingLiquidity,
            String liquidityNote
    ) {
        long estimatedReturn = oddsAfterStake.multiply(BigDecimal.valueOf(stake)).setScale(0, RoundingMode.DOWN).longValue();
        long houseFeeAmount = BigDecimal.valueOf(playerPoolAfter)
                .multiply(getTakeoutRate())
                .setScale(0, RoundingMode.DOWN)
                .longValue();
        BigDecimal impact = BigDecimal.ZERO;
        if (currentOdds.compareTo(BigDecimal.ZERO) > 0) {
            impact = oddsAfterStake.subtract(currentOdds)
                    .divide(currentOdds, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);
        }

        PredictionQuoteResponse response = new PredictionQuoteResponse();
        response.setRaceId(raceId);
        response.setPredictionType(predictionType);
        response.setPredictedWinnerId(participantId);
        response.setPredictedPosition(position);
        response.setWagerAmount(stake);
        response.setCurrentOdds(currentOdds);
        response.setOddsAfterStake(oddsAfterStake);
        response.setPriceImpactPercent(impact);
        response.setEstimatedReturn(estimatedReturn);
        response.setEstimatedProfit(estimatedReturn - stake);
        response.setPotentialLoss(stake);
        response.setPlayerPoolBefore(playerPoolBefore);
        response.setPlayerPoolAfter(playerPoolAfter);
        response.setHouseFeeAmount(houseFeeAmount);
        response.setNetPlayerPoolAfter(playerPoolAfter - houseFeeAmount);
        response.setPricingLiquidity(pricingLiquidity);
        response.setHouseFeePercent(getTakeoutRate().multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).intValue());
        response.setLiquidityNote(liquidityNote);
        return response;
    }

    public Map<Long, Map<Integer, BigDecimal>> calculatePositionOddsMatrix(Long raceId,
            List<RaceParticipant> participants) {
        int N = participants.size();
        if (N == 0)
            return new HashMap<>();

        Map<Long, Map<Integer, Double>> rawProb = new HashMap<>();
        Map<Integer, Double> colSum = new HashMap<>();

        for (int j = 1; j <= N; j++) {
            colSum.put(j, 0.0);
        }

        // 1. Calculate historical probabilities with one batched history load.
        HorseHistory history = loadHorseHistory(participants);
        for (RaceParticipant p : participants) {
            Map<Integer, Double> pProbs = new HashMap<>();
            Long horseId = p.getHorse().getId();
            long totalRaces = history.totalFor(horseId);
            Map<Integer, Long> counts = history.positionsFor(horseId);

            for (int j = 1; j <= N; j++) {
                double prob = (counts.getOrDefault(j, 0L) + 1.0) / (totalRaces + N); // Làm mịn Laplace (Laplace smoothing)
                pProbs.put(j, prob);
                colSum.put(j, colSum.get(j) + prob);
            }
            rawProb.put(p.getId(), pProbs);
        }

        // 2. Lấy thông tin các khoản đặt cược thực tế
        List<RacePrediction> activePredictions = predictionRepo.findByRace_IdAndStatus(raceId,
                com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING);
        activePredictions.addAll(predictionRepo.findByRace_IdAndStatus(raceId,
                com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED));

        Map<Integer, Double> totalRealBetsPos = new HashMap<>();
        Map<Long, Map<Integer, Double>> realBetsHorsePos = new HashMap<>();

        for (int j = 1; j <= N; j++) {
            totalRealBetsPos.put(j, 0.0);
        }
        for (RaceParticipant p : participants) {
            realBetsHorsePos.put(p.getId(), new HashMap<>());
            for (int j = 1; j <= N; j++) {
                realBetsHorsePos.get(p.getId()).put(j, 0.0);
            }
        }

        for (RacePrediction pred : activePredictions) {
            if ("EXACT_POSITION".equals(pred.getPredictionType()) && pred.getPredictedWinnerId() != null
                    && pred.getPredictedPosition() != null) {
                int pos = pred.getPredictedPosition();
                if (pos >= 1 && pos <= N) {
                    double wager = pred.getWagerAmount() != null ? pred.getWagerAmount() : 0.0;
                    totalRealBetsPos.put(pos, totalRealBetsPos.get(pos) + wager);

                    if (realBetsHorsePos.containsKey(pred.getPredictedWinnerId())) {
                        Map<Integer, Double> hp = realBetsHorsePos.get(pred.getPredictedWinnerId());
                        hp.put(pos, hp.get(pos) + wager);
                    }
                }
            }
        }

        // 3. Tỷ lệ cược hiển thị TẠM THỜI theo cơ chế Pari-mutuel (chỉ dùng để tham khảo).
        // Công thức tính tỷ lệ cược cho ngựa h ở vị trí j:
        // odds(h,j) = (seed + totalRealBets_j) * keep / (vHorse + realBets_h,j)
        // Trong đó:
        // - `seed` là lượng thanh khoản ảo chỉ dùng để hiển thị (displaySeed). Quỹ trả thưởng thực tế
        //   được tính dựa trên tổng quỹ cược THẬT (REAL pool) khi kết toán (xem trong PredictionSettlementScheduler.settlePool).
        //   Vì vậy, giá trị thanh khoản ảo này chỉ mang tính chất làm mượt tỷ lệ hiển thị, không tạo ra bất kỳ nghĩa vụ nợ nào cho nhà cái.
        // - Xác suất lịch sử của ngựa được làm mịn (flattened) hướng về phân phối đều (1/N)
        //   để những ngựa có lịch sử thi đấu quá chênh lệch (quá tốt hoặc quá tệ) không hiển thị tỷ lệ cược ban đầu quá phi lý.
        Map<Long, Map<Integer, BigDecimal>> matrix = new HashMap<>();
        double seed = getDisplaySeed();
        double margin = 1.0 - getTakeoutRate().doubleValue(); // Tỷ lệ giữ lại để trả thưởng cho người chơi = 1 - hoa hồng nhà cái

        for (RaceParticipant p : participants) {
            Map<Integer, BigDecimal> pOdds = new HashMap<>();
            for (int j = 1; j <= N; j++) {
                double normalizedProb = rawProb.get(p.getId()).get(j) / colSum.get(j);
                double flat = (normalizedProb + 1.0 / N) / 2.0; // Kéo các xác suất cực đoan về phân phối đều (vẫn bảo đảm tổng bằng 1)
                double vHorse = seed * flat;

                double totalRealBets = totalRealBetsPos.get(j);
                double realBetsOnHorse = realBetsHorsePos.get(p.getId()).get(j);

                BigDecimal odds = calculateOdds(seed, totalRealBets, margin, vHorse, realBetsOnHorse);
                // if (odds.compareTo(maxDisplayOdds) > 0) {
                // odds = maxDisplayOdds;
                // }
                pOdds.put(j, odds);
            }
            matrix.put(p.getId(), pOdds);
        }

        return matrix;
    }

    public Map<Long, BigDecimal> calculateStreakOddsMatrix(Long raceId, List<RaceParticipant> participants) {
        int N = participants.size();
        if (N == 0) return new HashMap<>();

        Map<Long, Double> rawProb = new HashMap<>();
        double colSum = 0.0;

        // 1. Calculate historical probabilities
        HorseHistory history = loadHorseHistory(participants);
        for (RaceParticipant p : participants) {
            Long horseId = p.getHorse().getId();
            long totalRaces = history.totalFor(horseId);
            long winCount = history.positionsFor(horseId).getOrDefault(1, 0L);
            double prob = (winCount + 1.0) / (totalRaces + N); // Laplace smoothing
            rawProb.put(p.getId(), prob);
            colSum += prob;
        }

        // 2. Lấy thông tin các khoản đặt cược từ Streak
        List<com.example.horseracingtournamentsystem.prediction.entity.StreakPredictionLeg> activeLegs = streakLegRepo.findActiveLegsByRaceId(raceId);
        
        double totalRealBets = 0.0;
        Map<Long, Double> realBetsHorse = new HashMap<>();
        for (RaceParticipant p : participants) {
            realBetsHorse.put(p.getId(), 0.0);
        }

        for (com.example.horseracingtournamentsystem.prediction.entity.StreakPredictionLeg leg : activeLegs) {
            if (leg.getPredictedWinner() != null) {
                // Toàn bộ tiền vé chuỗi được tính vào quỹ đua
                double wager = leg.getStreakPrediction().getWagerAmount() != null ? leg.getStreakPrediction().getWagerAmount() : 0.0;
                totalRealBets += wager;
                
                if (realBetsHorse.containsKey(leg.getPredictedWinner().getId())) {
                    realBetsHorse.put(leg.getPredictedWinner().getId(), realBetsHorse.get(leg.getPredictedWinner().getId()) + wager);
                }
            }
        }

        // 3. Tính tỷ lệ cược Pari-mutuel độc lập cho Streak
        Map<Long, BigDecimal> matrix = new HashMap<>();
        double seed = getDisplaySeed();
        double margin = 1.0 - getTakeoutRate().doubleValue();

        for (RaceParticipant p : participants) {
            double normalizedProb = rawProb.get(p.getId()) / colSum;
            double flat = (normalizedProb + 1.0 / N) / 2.0;
            double vHorse = seed * flat;

            double realBetsOnHorse = realBetsHorse.get(p.getId());

            BigDecimal odds = calculateOdds(seed, totalRealBets, margin, vHorse, realBetsOnHorse);
            matrix.put(p.getId(), odds);
        }

        return matrix;
    }

    public List<HeadToHeadMatchup> calculateH2HMatchups(Long raceId, List<RaceParticipant> participants) {
        List<HeadToHeadMatchup> matchups = new ArrayList<>();
        if (participants.size() < 2)
            return matchups;

        // Win rate per participant and H2H bets are both batched.
        HorseHistory history = loadHorseHistory(participants);
        Map<Long, Long> h2hBets = new HashMap<>();
        for (Object[] row : predictionRepo.sumWagersByRaceAndTypeGroupedByParticipant(raceId, RacePrediction.TYPE_HEAD_TO_HEAD)) {
            if (row[0] != null) {
                h2hBets.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            }
        }
        Map<Long, Double> winRates = new HashMap<>();
        for (RaceParticipant p : participants) {
            Long horseId = p.getHorse().getId();
            long totalRaces = history.totalFor(horseId);
            long wins = history.positionsFor(horseId).getOrDefault(1, 0L);
            double winRate = totalRaces > 0 ? (double) wins / totalRaces : 0.0;
            // Thêm một lượng rất nhỏ dựa trên ID để phân định khi tỷ lệ thắng bằng nhau, giúp sắp xếp nhất quán
            winRate += (p.getId() * 1e-9);
            winRates.put(p.getId(), winRate);
        }

        // Sắp xếp giảm dần theo tỷ lệ thắng để ghép cặp các ngựa có trình độ gần nhau nhất
        List<RaceParticipant> sorted = new ArrayList<>(participants);
        sorted.sort((p1, p2) -> Double.compare(winRates.get(p2.getId()), winRates.get(p1.getId())));

        // Nhóm thành từng cặp đối đầu (cặp 0 vs 1, cặp 2 vs 3, v.v.)
        for (int i = 0; i < sorted.size() - 1; i += 2) {
            RaceParticipant pA = sorted.get(i);
            RaceParticipant pB = sorted.get(i + 1);

            Double avgTimeA = history.avgFor(pA.getHorse().getId());
            Double avgTimeB = history.avgFor(pB.getHorse().getId());

            double handicap = 0.0;
            if (avgTimeA != null && avgTimeB != null) {
                // Nếu A nhanh hơn (thời gian trung bình nhỏ hơn), A chấp B (A phải hoàn thành sớm hơn B ít nhất X giây)
                // số_giây_chấp (handicapSeconds) = avgTimeB - avgTimeA
                handicap = avgTimeB - avgTimeA;
                // Cap handicap to avoid absurd values
                if (handicap > 10.0)
                    handicap = 10.0;
                if (handicap < -10.0)
                    handicap = -10.0;
            }

            // Tính toán tỷ lệ cược (odds) theo mô hình tạo lập thị trường tự động (AMM)
            double vPool = getDisplaySeed();
            double rMargin = 1.0 - getTakeoutRate().doubleValue();
            double vA = vPool * 0.5;
            double vB = vPool * 0.5;

            long betsA = h2hBets.getOrDefault(pA.getId(), 0L);
            long betsB = h2hBets.getOrDefault(pB.getId(), 0L);

            BigDecimal oddsA = calculateOdds(vPool, betsA + betsB, rMargin, vA, betsA);
            BigDecimal oddsB = calculateOdds(vPool, betsA + betsB, rMargin, vB, betsB);

            HeadToHeadMatchup matchup = new HeadToHeadMatchup();
            matchup.setParticipantAId(pA.getId());
            matchup.setParticipantBId(pB.getId());
            // Làm tròn số giây chấp đến 1 chữ số thập phân để hiển thị
            matchup.setHandicapSeconds(Math.round(handicap * 10.0) / 10.0);
            matchup.setOddsA(oddsA);
            matchup.setOddsB(oddsB);

            matchups.add(matchup);
        }

        return matchups;
    }

    /**
     * Tính toán xác suất thắng cuộc công bằng (về đích thứ 1) cho mỗi người tham gia,
     * được làm mịn bằng phương pháp Laplace và chuẩn hóa để có tổng bằng 1.
     * 
     * Mục đích: Được sử dụng để định giá các chặng trong cược xiên chuỗi (streak parlay legs)
     * dưới dạng tỷ lệ cược thập phân công bằng (1/p) với một biên độ lợi nhuận cuối cùng —
     * tuyệt đối không dùng làm tỷ lệ cược trực tiếp để thanh toán trả thưởng.
     * 
     * @param participants Danh sách người tham gia cuộc đua
     * @return Bản đồ ánh xạ từ ID người tham gia sang xác suất thắng P(win) dạng BigDecimal.
     */
    public Map<Long, BigDecimal> getWinProbabilities(List<RaceParticipant> participants) {
        int N = participants.size();
        Map<Long, Double> raw = new HashMap<>();
        double colSum = 0.0;

        HorseHistory history = loadHorseHistory(participants);
        for (RaceParticipant p : participants) {
            Long horseId = p.getHorse().getId();
            long totalRaces = history.totalFor(horseId);
            long winCount = history.positionsFor(horseId).getOrDefault(1, 0L);
            double prob = (winCount + 1.0) / (totalRaces + N); // Laplace add-one smoothing
            raw.put(p.getId(), prob);
            colSum += prob;
        }

        Map<Long, BigDecimal> out = new HashMap<>();
        for (Map.Entry<Long, Double> e : raw.entrySet()) {
            double normalized = colSum > 0 ? e.getValue() / colSum : (N > 0 ? 1.0 / N : 0.0);
            out.put(e.getKey(), BigDecimal.valueOf(normalized));
        }
        return out;
    }

    // ── Batch history loading: one query per aggregate for ALL horses, replacing the per-horse
    //    count/avg fan-out that made prediction-options issue dozens of queries (2N+ -> 3 per call). ──
    private HorseHistory loadHorseHistory(List<RaceParticipant> participants) {
        List<Long> horseIds = participants.stream()
                .map(p -> p.getHorse().getId())
                .distinct()
                .toList();
        Map<Long, Long> totals = new HashMap<>();
        Map<Long, Map<Integer, Long>> positions = new HashMap<>();
        Map<Long, Double> avg = new HashMap<>();
        if (horseIds.isEmpty()) {
            return new HorseHistory(totals, positions, avg);
        }
        for (Object[] row : resultRepo.countTotalRacesByHorseIds(horseIds)) {
            totals.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        for (Object[] row : resultRepo.countPositionsByHorseIds(horseIds)) {
            if (row[1] == null) {
                continue;
            }
            Long horseId = ((Number) row[0]).longValue();
            positions.computeIfAbsent(horseId, k -> new HashMap<>())
                    .put(((Number) row[1]).intValue(), ((Number) row[2]).longValue());
        }
        for (Object[] row : resultRepo.getAverageFinishTimeByHorseIds(horseIds)) {
            if (row[1] != null) {
                avg.put(((Number) row[0]).longValue(), ((Number) row[1]).doubleValue());
            }
        }
        return new HorseHistory(totals, positions, avg);
    }

    private record HorseHistory(
            Map<Long, Long> totalRaces,
            Map<Long, Map<Integer, Long>> positionCounts,
            Map<Long, Double> avgFinishTime
    ) {
        long totalFor(Long horseId) {
            return totalRaces.getOrDefault(horseId, 0L);
        }

        Map<Integer, Long> positionsFor(Long horseId) {
            return positionCounts.getOrDefault(horseId, Map.of());
        }

        Double avgFor(Long horseId) {
            return avgFinishTime.get(horseId);
        }
    }
}
