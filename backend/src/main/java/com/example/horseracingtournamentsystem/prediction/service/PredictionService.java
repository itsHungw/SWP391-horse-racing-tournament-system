package com.example.horseracingtournamentsystem.prediction.service;

import com.example.horseracingtournamentsystem.point.entity.PointTransaction;
import com.example.horseracingtournamentsystem.point.entity.PointTransactionType;
import com.example.horseracingtournamentsystem.point.entity.PointSettingKey;
import com.example.horseracingtournamentsystem.point.service.PointAccountService;
import com.example.horseracingtournamentsystem.point.service.PointSettingsService;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.dto.request.SubmitPredictionRequest;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
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
    private final PointAccountService pointsService;
    private final PointSettingsService pointSettingsService;
    private final OddsCalculationService oddsCalculationService;
    private final RaceParticipantRepository raceParticipantRepository;

    public PredictionService(RacePredictionRepository predictionRepo,
                             PredictionSettlementJobRepository jobRepo,
                             RaceRepository raceRepo,
                             PointAccountService pointsService,
                             PointSettingsService pointSettingsService,
                             OddsCalculationService oddsCalculationService,
                             RaceParticipantRepository raceParticipantRepository) {
        this.predictionRepo = predictionRepo;
        this.jobRepo = jobRepo;
        this.raceRepo = raceRepo;
        this.pointsService = pointsService;
        this.pointSettingsService = pointSettingsService;
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

        // Rule: Duplicate predictions of the same type for this race are not allowed
        if (predictionRepo.existsByRaceIdAndSpectatorIdAndPredictionType(race.getId(), spectator.getId(), request.getPredictionType())) {
            throw new IllegalStateException("You have already submitted a prediction of type " + request.getPredictionType() + " for this race");
        }

        int cost = request.getWagerAmount();
        if (cost < 10000) {
            throw new IllegalArgumentException("Minimum wager is 10000 points");
        }

        // Perform validations for TOP3 selections
        if (RacePrediction.TYPE_TOP3.equals(request.getPredictionType())) {
            if (request.getPredictedSecondId() == null || request.getPredictedThirdId() == null) {
                throw new IllegalArgumentException("Top 3 prediction requires selecting 1st, 2nd, and 3rd participants");
            }
            if (request.getPredictedWinnerId().equals(request.getPredictedSecondId()) ||
                request.getPredictedWinnerId().equals(request.getPredictedThirdId()) ||
                request.getPredictedSecondId().equals(request.getPredictedThirdId())) {
                throw new IllegalArgumentException("Top 3 participants must be distinct");
            }
        }

        Long opponentId = null;
        Double handicapSeconds = null;

        // Calculate Odds
        RaceParticipant participant = raceParticipantRepository.findById(request.getPredictedWinnerId())
            .orElseThrow(() -> new IllegalArgumentException("Predicted participant not found"));
        java.math.BigDecimal lockedOdds = java.math.BigDecimal.ZERO;

        if (RacePrediction.TYPE_EXACT_POSITION.equals(request.getPredictionType())) {
            if (request.getPredictedPosition() == null) {
                throw new IllegalArgumentException("Predicted position is required for EXACT_POSITION");
            }
            List<RaceParticipant> participants = raceParticipantRepository.findAllByRace_IdAndStatusNotOrderByCreatedAtAsc(race.getId(), com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.WITHDRAWN);
            Map<Long, Map<Integer, java.math.BigDecimal>> oddsMatrix = oddsCalculationService.calculatePositionOddsMatrix(race.getId(), participants);
            Map<Integer, java.math.BigDecimal> horseOdds = oddsMatrix.get(request.getPredictedWinnerId());
            if (horseOdds == null || !horseOdds.containsKey(request.getPredictedPosition())) {
                throw new IllegalArgumentException("Invalid prediction parameters or participant is withdrawn");
            }
            lockedOdds = horseOdds.get(request.getPredictedPosition());
        } else if (RacePrediction.TYPE_HEAD_TO_HEAD.equals(request.getPredictionType())) {
            List<RaceParticipant> participants = raceParticipantRepository.findAllByRace_IdAndStatusNotOrderByCreatedAtAsc(race.getId(), com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.WITHDRAWN);
            List<HeadToHeadMatchup> h2hMatchups = oddsCalculationService.calculateH2HMatchups(race.getId(), participants);

            HeadToHeadMatchup selectedMatchup = h2hMatchups.stream()
                .filter(m -> m.getParticipantAId().equals(request.getPredictedWinnerId()) || m.getParticipantBId().equals(request.getPredictedWinnerId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid participant for H2H matchup"));

            if (selectedMatchup.getParticipantAId().equals(request.getPredictedWinnerId())) {
                opponentId = selectedMatchup.getParticipantBId();
                handicapSeconds = selectedMatchup.getHandicapSeconds();
                lockedOdds = selectedMatchup.getOddsA();
            } else {
                opponentId = selectedMatchup.getParticipantAId();
                handicapSeconds = -selectedMatchup.getHandicapSeconds();
                lockedOdds = selectedMatchup.getOddsB();
            }
        } else {
            // Old fallback (if someone still submits WINNER or TOP3)
            double vPool = 100000.0; // Virtual pool baseline
            double vHorse = vPool * participant.getBaseWinProbability().doubleValue();
            double rMargin = 0.85; // House margin 15%
            long totalRealBets = predictionRepo.sumWagersByRaceAndType(race.getId(), request.getPredictionType());
            long realBetsOnHorse = predictionRepo.sumWagersByRaceAndTypeAndParticipant(race.getId(), request.getPredictionType(), participant.getId());
            lockedOdds = oddsCalculationService.calculateOdds(vPool, totalRealBets, rMargin, vHorse, realBetsOnHorse);
        }

        // 1. Create and flush the prediction first to get the database-generated ID
        RacePrediction prediction = RacePrediction.create(
            race, spectator, request.getPredictionType(),
            request.getPredictedWinnerId(), request.getPredictedPosition(), request.getPredictedSecondId(), request.getPredictedThirdId(),
            opponentId, handicapSeconds, cost
        );
        prediction.setWagerAmount(cost);
        prediction.setLockedOdds(lockedOdds);
        RacePrediction saved = predictionRepo.saveAndFlush(prediction);

        // 2. Adjust points (deduct cost) and reference it back in the transaction ledger
        pointsService.adjustPoints(
            spectator, -cost, PointTransactionType.PREDICTION_ENTRY,
            PointTransaction.REF_RACE_PREDICTION, saved.getId(),
            "Deducted " + cost + " virtual points for race prediction entry #" + saved.getId()
        );

        return saved;
    }

    @Transactional
    public RacePrediction updatePrediction(User spectator, Long predictionId, SubmitPredictionRequest request) {
        RacePrediction prediction = predictionRepo.findById(predictionId)
            .orElseThrow(() -> new IllegalArgumentException("Prediction not found"));

        if (!prediction.getSpectator().getId().equals(spectator.getId())) {
            throw new IllegalArgumentException("Unauthorized to modify this prediction");
        }

        if (com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING != prediction.getStatus()) {
            throw new IllegalStateException("Only pending predictions can be updated");
        }

        Race race = prediction.getRace();
        if (RaceStatus.SCHEDULED != race.getStatus()) {
            throw new IllegalStateException("Predictions are locked since race is no longer in SCHEDULED state");
        }

        if (!prediction.getPredictionType().equals(request.getPredictionType())) {
            throw new IllegalArgumentException("Cannot change prediction type");
        }

        if (RacePrediction.TYPE_TOP3.equals(request.getPredictionType())) {
            if (request.getPredictedSecondId() == null || request.getPredictedThirdId() == null) {
                throw new IllegalArgumentException("Top 3 prediction requires selecting 1st, 2nd, and 3rd participants");
            }
            if (request.getPredictedWinnerId().equals(request.getPredictedSecondId()) ||
                request.getPredictedWinnerId().equals(request.getPredictedThirdId()) ||
                request.getPredictedSecondId().equals(request.getPredictedThirdId())) {
                throw new IllegalArgumentException("Top 3 participants must be distinct");
            }
        }

        prediction.setPredictedWinnerId(request.getPredictedWinnerId());
        prediction.setPredictedPosition(request.getPredictedPosition());
        prediction.setPredictedSecondId(request.getPredictedSecondId());
        prediction.setPredictedThirdId(request.getPredictedThirdId());
        prediction.setUpdatedAt(LocalDateTime.now());

        return predictionRepo.save(prediction);
    }

    @Transactional
    public void lockPredictionsForRace(Long raceId) {
        List<RacePrediction> pendingPredictions = predictionRepo.findByRace_IdAndStatus(raceId, com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING);
        for (RacePrediction p : pendingPredictions) {
            p.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED);
            p.setLockedAt(LocalDateTime.now());
            predictionRepo.save(p);
        }
    }

    @Transactional
    public void refundCancelledRace(Long raceId) {
        List<RacePrediction> predictions = predictionRepo.findByRace_Id(raceId);
        for (RacePrediction p : predictions) {
            if (com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.PENDING == p.getStatus() || com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.LOCKED == p.getStatus()) {
                p.setStatus(com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus.REFUNDED);
                p.setUpdatedAt(LocalDateTime.now());
                predictionRepo.save(p);

                // Refund the points (Idempotency checked by adjustPoints using index)
                pointsService.adjustPoints(
                    p.getSpectator(), p.getEntryCostPoints(), PointTransactionType.RACE_CANCEL_REFUND,
                    PointTransaction.REF_RACE_PREDICTION, p.getId(),
                    "Refunded " + p.getEntryCostPoints() + " entry cost points for cancelled race"
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
