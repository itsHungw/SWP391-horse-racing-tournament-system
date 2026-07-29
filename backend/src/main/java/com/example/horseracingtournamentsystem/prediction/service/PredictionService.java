package com.example.horseracingtournamentsystem.prediction.service;

import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.dto.request.SubmitPredictionRequest;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionQuoteResponse;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionOptionsResponse.HeadToHeadMatchup;

@Service
public class PredictionService {

    private final RacePredictionRepository predictionRepo;
    private final PredictionSettlementJobRepository jobRepo;
    private final RaceRepository raceRepo;
    private final WalletService walletService;
    private final OddsCalculationService oddsCalculationService;
    private final RaceParticipantRepository raceParticipantRepository;

    /** Minimum stake per bet (VND). */
    @Value("${app.prediction.min-wager:10000}")
    private long minWager;

    public PredictionService(RacePredictionRepository predictionRepo,
                             PredictionSettlementJobRepository jobRepo,
                             RaceRepository raceRepo,
                             WalletService walletService,
                             OddsCalculationService oddsCalculationService,
                             RaceParticipantRepository raceParticipantRepository) {
        this.predictionRepo = predictionRepo;
        this.jobRepo = jobRepo;
        this.raceRepo = raceRepo;
        this.walletService = walletService;
        this.oddsCalculationService = oddsCalculationService;
        this.raceParticipantRepository = raceParticipantRepository;
    }

    @Transactional
    public RacePrediction submitPrediction(User spectator, SubmitPredictionRequest request) {
        Race race = raceRepo.findById(request.getRaceId())
            .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        // Rule: Submission is ONLY allowed when the race is SCHEDULED
        if (RaceStatus.SCHEDULED != race.getStatus()) {
            throw new IllegalStateException("Predictions can only be made when the race is SCHEDULED");
        }

        // TOP3 market has been removed; reject any lingering client/API submissions.
        if (!RacePrediction.TYPE_EXACT_POSITION.equals(request.getPredictionType())
                && !RacePrediction.TYPE_HEAD_TO_HEAD.equals(request.getPredictionType())) {
            throw new IllegalArgumentException("Unsupported prediction type: " + request.getPredictionType());
        }

        long cost = request.getWagerAmount();
        if (cost < minWager) {
            throw new IllegalArgumentException("Minimum wager is " + minWager + " VND");
        }
        Long opponentId = null;
        Double handicapSeconds = null;

        // Calculate Odds
        RaceParticipant participant = raceParticipantRepository.findById(request.getPredictedWinnerId())
            .orElseThrow(() -> new IllegalArgumentException("Predicted participant not found"));

        if (RacePrediction.TYPE_EXACT_POSITION.equals(request.getPredictionType())) {
            if (request.getPredictedPosition() == null) {
                throw new IllegalArgumentException("Predicted position is required for EXACT_POSITION");
            }
            List<RaceParticipant> participants = raceParticipantRepository.findAllByRaceAndStatusNotOrderByLane(race.getId(), com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.WITHDRAWN);
            Map<Long, Map<Integer, java.math.BigDecimal>> oddsMatrix = oddsCalculationService.calculatePositionOddsMatrix(race.getId(), participants);
            Map<Integer, java.math.BigDecimal> horseOdds = oddsMatrix.get(request.getPredictedWinnerId());
            if (horseOdds == null || !horseOdds.containsKey(request.getPredictedPosition())) {
                throw new IllegalArgumentException("Invalid prediction parameters or participant is withdrawn");
            }
        } else if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(request.getPredictionType())) {
            List<RaceParticipant> participants = raceParticipantRepository.findAllByRaceAndStatusNotOrderByLane(race.getId(), com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.WITHDRAWN);
            List<HeadToHeadMatchup> h2hMatchups = oddsCalculationService.calculateH2HMatchups(race.getId(), participants);

            HeadToHeadMatchup selectedMatchup = h2hMatchups.stream()
                .filter(m -> m.getParticipantAId().equals(request.getPredictedWinnerId()) || m.getParticipantBId().equals(request.getPredictedWinnerId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid participant for H2H matchup"));

            if (selectedMatchup.getParticipantAId().equals(request.getPredictedWinnerId())) {
                opponentId = selectedMatchup.getParticipantBId();
                handicapSeconds = selectedMatchup.getHandicapSeconds();
            } else {
                opponentId = selectedMatchup.getParticipantAId();
                handicapSeconds = -selectedMatchup.getHandicapSeconds();
            }
        }

        // 1. Create and flush the prediction first to get the database-generated ID
        RacePrediction prediction = RacePrediction.create(
            race, spectator, request.getPredictionType(),
            request.getPredictedWinnerId(), request.getPredictedPosition(),
            opponentId, handicapSeconds, cost
        );
        prediction.setWagerAmount(cost);
        RacePrediction saved = predictionRepo.saveAndFlush(prediction);

        // 2. Trừ tiền cược khỏi ví (idempotent theo prediction id) và ghi sổ cái
        walletService.adjust(
            spectator, -cost, WalletTransactionType.BET_PLACED,
            WalletTransaction.REF_RACE_PREDICTION, saved.getId(),
            "Placed bet of " + cost + " VND on race prediction #" + saved.getId()
        );

        return saved;
    }

    @Transactional(readOnly = true)
    public PredictionQuoteResponse quotePrediction(SubmitPredictionRequest request) {
        Race race = raceRepo.findById(request.getRaceId())
            .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        if (RaceStatus.SCHEDULED != race.getStatus()) {
            throw new IllegalStateException("Predictions can only be quoted when the race is SCHEDULED");
        }

        long stake = request.getWagerAmount();
        if (stake < minWager) {
            throw new IllegalArgumentException("Minimum wager is " + minWager + " VND");
        }

        List<RaceParticipant> participants = raceParticipantRepository.findAllByRaceAndStatusNotOrderByLane(
                race.getId(), com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.WITHDRAWN);

        if (RacePrediction.TYPE_EXACT_POSITION.equals(request.getPredictionType())) {
            if (request.getPredictedPosition() == null) {
                throw new IllegalArgumentException("Predicted position is required for EXACT_POSITION");
            }
            return oddsCalculationService.quoteExactPosition(
                    race.getId(),
                    participants,
                    request.getPredictedWinnerId(),
                    request.getPredictedPosition(),
                    stake
            );
        }

        if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(request.getPredictionType())) {
            return oddsCalculationService.quoteHeadToHead(
                    race.getId(),
                    participants,
                    request.getPredictedWinnerId(),
                    stake
            );
        }

        throw new IllegalArgumentException("Unsupported prediction type: " + request.getPredictionType());
    }

    @Transactional
    public void lockPredictionsForRace(Long raceId) {
        List<RacePrediction> pendingPredictions = predictionRepo.findByRace_IdAndStatus(raceId, com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING);
        List<RaceParticipant> participants = raceParticipantRepository.findAllByRaceAndStatusNotOrderByLane(
            raceId, com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.WITHDRAWN);
        Map<Long, Map<Integer, java.math.BigDecimal>> positionOdds = oddsCalculationService.calculatePositionOddsMatrix(raceId, participants);
        List<HeadToHeadMatchup> h2hMatchups = oddsCalculationService.calculateH2HMatchups(raceId, participants);

        for (RacePrediction p : pendingPredictions) {
            p.setLockedOdds(resolveLockedOdds(p, positionOdds, h2hMatchups));
            p.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED);
            p.setLockedAt(LocalDateTime.now());
            predictionRepo.save(p);
        }
    }

    private java.math.BigDecimal resolveLockedOdds(
            RacePrediction prediction,
            Map<Long, Map<Integer, java.math.BigDecimal>> positionOdds,
            List<HeadToHeadMatchup> h2hMatchups
    ) {
        if (RacePrediction.TYPE_EXACT_POSITION.equals(prediction.getPredictionType())) {
            return positionOdds.getOrDefault(prediction.getPredictedWinnerId(), Map.of())
                .getOrDefault(prediction.getPredictedPosition(), java.math.BigDecimal.ZERO);
        }

        if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(prediction.getPredictionType())) {
            return h2hMatchups.stream()
                .filter(m -> Objects.equals(m.getParticipantAId(), prediction.getPredictedWinnerId())
                        || Objects.equals(m.getParticipantBId(), prediction.getPredictedWinnerId()))
                .findFirst()
                .map(m -> Objects.equals(m.getParticipantAId(), prediction.getPredictedWinnerId())
                        ? m.getOddsA()
                        : m.getOddsB())
                .orElse(java.math.BigDecimal.ZERO);
        }

        return java.math.BigDecimal.ZERO;
    }

    @Transactional
    public void refundCancelledRace(Long raceId) {
        List<RacePrediction> predictions = predictionRepo.findByRace_Id(raceId);
        for (RacePrediction p : predictions) {
            if (com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING == p.getStatus() || com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED == p.getStatus()) {
                LocalDateTime refundedAt = LocalDateTime.now();
                p.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.REFUNDED);
                p.setEvaluatedAt(refundedAt);
                p.setUpdatedAt(refundedAt);
                predictionRepo.save(p);

                // Hoàn tiền cược (idempotent theo prediction id)
                walletService.adjust(
                    p.getSpectator(), p.getEntryCostPoints(), WalletTransactionType.BET_REFUND,
                    WalletTransaction.REF_RACE_PREDICTION, p.getId(),
                    "Refund " + p.getEntryCostPoints() + " VND for cancelled race"
                );
            }
        }
    }

    @Transactional
    public void createSettlementJob(Long raceId) {
        Race race = raceRepo.findById(raceId)
            .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        if (jobRepo.findByRace_Id(raceId).isEmpty()) {
            PredictionSettlementJob job = PredictionSettlementJob.create(race);
            jobRepo.save(job);
        }
    }

    public List<RacePrediction> getMyPredictions(User spectator) {
        return predictionRepo.findBySpectatorId(spectator.getId());
    }
}
