package com.example.horseracingtournamentsystem.prediction.service;

import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionQuoteResponse;
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
   
    /**
     * House takeout — keep = 1 - takeout. Same rate the pari-mutuel settlement
     * uses.
     */
    @Value("${app.prediction.takeout-rate:0.15}")
    private BigDecimal takeoutRate;

    /**
     * Virtual DISPLAY-ONLY seed liquidity for the live line (never paid out;
     * settlement uses the real pool).
     */
    @Value("${app.prediction.display-seed:200000}")
    private double displaySeed;

    /**
     * Clamp on displayed odds so a thin/lopsided market never shows an absurd
     * indicative line.
     */
    // @Value("${app.prediction.max-display-odds:50}")
    // private BigDecimal maxDisplayOdds;

    public OddsCalculationService(RaceResultRepository resultRepo, RacePredictionRepository predictionRepo) {
        this.resultRepo = resultRepo;
        this.predictionRepo = predictionRepo;
    }

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
        double selectedPricingLiquidity = displaySeed * flat;
        double keep = 1.0 - takeoutRate.doubleValue();

        BigDecimal currentOdds = calculateOdds(displaySeed, playerPoolBefore, keep, selectedPricingLiquidity, outcomeStakeBefore);
        BigDecimal oddsAfterStake = calculateOdds(displaySeed, playerPoolBefore + stake, keep, selectedPricingLiquidity, outcomeStakeBefore + stake);

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
                Math.round(displaySeed),
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

        double pricingPool = 10000000.0;
        double keep = 1.0 - takeoutRate.doubleValue();
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
                .multiply(takeoutRate)
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
        response.setHouseFeePercent(takeoutRate.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).intValue());
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

        // 1. Calculate historical probabilities
        for (RaceParticipant p : participants) {
            Map<Integer, Double> pProbs = new HashMap<>();
            Long horseId = p.getHorse().getId();
            long totalRaces = resultRepo.countTotalRacesByHorseId(horseId);
            List<Object[]> posCounts = resultRepo.countPositionsByHorseId(horseId);

            Map<Integer, Long> counts = new HashMap<>();
            for (Object[] row : posCounts) {
                if (row[0] != null) {
                    counts.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
                }
            }

            for (int j = 1; j <= N; j++) {
                double prob = (counts.getOrDefault(j, 0L) + 1.0) / (totalRaces + N); // Laplace smoothing
                pProbs.put(j, prob);
                colSum.put(j, colSum.get(j) + prob);
            }
            rawProb.put(p.getId(), pProbs);
        }

        // 2. Fetch real bets
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

        // 3. Pari-mutuel PROVISIONAL display line (indicative only).
        // odds(h,j) = (seed + totalRealBets_j) * keep / (seed_h,j + realBets_h,j)
        // - `seed` is virtual display-only liquidity; the actual payout is computed
        // from the
        // REAL pool at settlement (PredictionSettlementScheduler.settlePool), so this
        // number
        // never creates house liability — it only previews "your share of the pool".
        // - the historical prior is flattened toward uniform (1/N) so a horse with
        // lopsided
        // history cannot show an absurd opening line, and the result is clamped to
        // maxDisplayOdds.
        Map<Long, Map<Integer, BigDecimal>> matrix = new HashMap<>();
        double seed = displaySeed;
        double margin = 1.0 - takeoutRate.doubleValue(); // keep = 1 - takeout

        for (RaceParticipant p : participants) {
            Map<Integer, BigDecimal> pOdds = new HashMap<>();
            for (int j = 1; j <= N; j++) {
                double normalizedProb = rawProb.get(p.getId()).get(j) / colSum.get(j);
                double flat = (normalizedProb + 1.0 / N) / 2.0; // pull extremes toward uniform (still sums to 1)
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

    public List<HeadToHeadMatchup> calculateH2HMatchups(Long raceId, List<RaceParticipant> participants) {
        List<HeadToHeadMatchup> matchups = new ArrayList<>();
        if (participants.size() < 2)
            return matchups;

        // Calculate win rate for each participant
        Map<Long, Double> winRates = new HashMap<>();
        for (RaceParticipant p : participants) {
            Long horseId = p.getHorse().getId();
            long totalRaces = resultRepo.countTotalRacesByHorseId(horseId);
            List<Object[]> posCounts = resultRepo.countPositionsByHorseId(horseId);
            long wins = 0;
            for (Object[] row : posCounts) {
                if (row[0] != null && ((Number) row[0]).intValue() == 1) {
                    wins = ((Number) row[1]).longValue();
                    break;
                }
            }
            double winRate = totalRaces > 0 ? (double) wins / totalRaces : 0.0;
            // Add a small tie-breaker based on ID to ensure consistent sorting when win
            // rates are equal
            winRate += (p.getId() * 1e-9);
            winRates.put(p.getId(), winRate);
        }

        // Sort by win rate descending to pair closest skilled horses
        List<RaceParticipant> sorted = new ArrayList<>(participants);
        sorted.sort((p1, p2) -> Double.compare(winRates.get(p2.getId()), winRates.get(p1.getId())));

        // Group into pairs (0 vs 1, 2 vs 3, etc.)
        for (int i = 0; i < sorted.size() - 1; i += 2) {
            RaceParticipant pA = sorted.get(i);
            RaceParticipant pB = sorted.get(i + 1);

            Double avgTimeA = resultRepo.getAverageFinishTimeByHorseId(pA.getHorse().getId());
            Double avgTimeB = resultRepo.getAverageFinishTimeByHorseId(pB.getHorse().getId());

            double handicap = 0.0;
            if (avgTimeA != null && avgTimeB != null) {
                // If A is faster (smaller time), A gives handicap to B (A must finish at least
                // X seconds before B)
                // handicapSeconds = avgTimeB - avgTimeA
                handicap = avgTimeB - avgTimeA;
                // Cap handicap to avoid absurd values
                if (handicap > 10.0)
                    handicap = 10.0;
                if (handicap < -10.0)
                    handicap = -10.0;
            }

            // Calculate AMM Odds
            double vPool = 10000000.0;
            double rMargin = 0.85;
            double vA = vPool * 0.5;
            double vB = vPool * 0.5;

            long betsA = predictionRepo.sumWagersByRaceAndTypeAndParticipant(raceId, RacePrediction.TYPE_HEAD_TO_HEAD,
                    pA.getId());
            long betsB = predictionRepo.sumWagersByRaceAndTypeAndParticipant(raceId, RacePrediction.TYPE_HEAD_TO_HEAD,
                    pB.getId());

            BigDecimal oddsA = calculateOdds(vPool, betsA + betsB, rMargin, vA, betsA);
            BigDecimal oddsB = calculateOdds(vPool, betsA + betsB, rMargin, vB, betsB);

            HeadToHeadMatchup matchup = new HeadToHeadMatchup();
            matchup.setParticipantAId(pA.getId());
            matchup.setParticipantBId(pB.getId());
            // Round handicap to 1 decimal place for display
            matchup.setHandicapSeconds(Math.round(handicap * 10.0) / 10.0);
            matchup.setOddsA(oddsA);
            matchup.setOddsB(oddsB);

            matchups.add(matchup);
        }

        return matchups;
    }

    /**
     * Fair win (position-1) probability per participant, Laplace-smoothed and
     * normalised to sum 1.
     * Used to price streak parlay legs as fair decimal odds (1/p) with a single
     * end-margin —
     * never as a payout-driving odds itself. Returns participantId -> P(win).
     */
    public Map<Long, BigDecimal> getWinProbabilities(List<RaceParticipant> participants) {
        int N = participants.size();
        Map<Long, Double> raw = new HashMap<>();
        double colSum = 0.0;

        for (RaceParticipant p : participants) {
            Long horseId = p.getHorse().getId();
            long totalRaces = resultRepo.countTotalRacesByHorseId(horseId);
            List<Object[]> posCounts = resultRepo.countPositionsByHorseId(horseId);
            long winCount = 0;
            for (Object[] row : posCounts) {
                if (row[0] != null && ((Number) row[0]).intValue() == 1) {
                    winCount = ((Number) row[1]).longValue();
                    break;
                }
            }
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
}
