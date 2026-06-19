package com.example.horseracingtournamentsystem.prediction.service;

import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
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

    public OddsCalculationService(RaceResultRepository resultRepo, RacePredictionRepository predictionRepo) {
        this.resultRepo = resultRepo;
        this.predictionRepo = predictionRepo;
    }

    public BigDecimal calculateOdds(double vPool, double totalRealBets, double rMargin, double vHorse, double realBetsOnHorse) {
        double numerator = (vPool + totalRealBets) * rMargin;
        double denominator = vHorse + realBetsOnHorse;
        if (denominator == 0) return BigDecimal.ZERO;
        
        double rawOdds = numerator / denominator;
        return BigDecimal.valueOf(rawOdds).setScale(2, RoundingMode.HALF_UP);
    }

    public Map<Long, Map<Integer, BigDecimal>> calculatePositionOddsMatrix(Long raceId, List<RaceParticipant> participants) {
        int N = participants.size();
        if (N == 0) return new HashMap<>();

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
        List<RacePrediction> activePredictions = predictionRepo.findByRace_IdAndStatus(raceId, com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING);
        activePredictions.addAll(predictionRepo.findByRace_IdAndStatus(raceId, com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED));

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
            if ("EXACT_POSITION".equals(pred.getPredictionType()) && pred.getPredictedWinnerId() != null && pred.getPredictedPosition() != null) {
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

        // 3. Calculate odds using AMM
        Map<Long, Map<Integer, BigDecimal>> matrix = new HashMap<>();
        double vPool = 100000.0;
        double rMargin = 0.85;

        for (RaceParticipant p : participants) {
            Map<Integer, BigDecimal> pOdds = new HashMap<>();
            for (int j = 1; j <= N; j++) {
                double normalizedProb = rawProb.get(p.getId()).get(j) / colSum.get(j);
                double vHorse = vPool * normalizedProb;
                
                double totalRealBets = totalRealBetsPos.get(j);
                double realBetsOnHorse = realBetsHorsePos.get(p.getId()).get(j);
                
                BigDecimal odds = calculateOdds(vPool, totalRealBets, rMargin, vHorse, realBetsOnHorse);
                pOdds.put(j, odds);
            }
            matrix.put(p.getId(), pOdds);
        }

        return matrix;
    }

    public List<HeadToHeadMatchup> calculateH2HMatchups(Long raceId, List<RaceParticipant> participants) {
        List<HeadToHeadMatchup> matchups = new ArrayList<>();
        if (participants.size() < 2) return matchups;

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
            // Add a small tie-breaker based on ID to ensure consistent sorting when win rates are equal
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
                // If A is faster (smaller time), A gives handicap to B (A must finish at least X seconds before B)
                // handicapSeconds = avgTimeB - avgTimeA
                handicap = avgTimeB - avgTimeA;
                // Cap handicap to avoid absurd values
                if (handicap > 10.0) handicap = 10.0;
                if (handicap < -10.0) handicap = -10.0;
            }

            // Calculate AMM Odds
            double vPool = 100000.0;
            double rMargin = 0.85;
            double vA = vPool * 0.5;
            double vB = vPool * 0.5;

            long betsA = predictionRepo.sumWagersByRaceAndTypeAndParticipant(raceId, RacePrediction.TYPE_HEAD_TO_HEAD, pA.getId());
            long betsB = predictionRepo.sumWagersByRaceAndTypeAndParticipant(raceId, RacePrediction.TYPE_HEAD_TO_HEAD, pB.getId());

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
}
