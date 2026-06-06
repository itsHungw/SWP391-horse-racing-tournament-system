package com.example.horseracingtournamentsystem.prediction.service;

import com.example.horseracingtournamentsystem.points.service.PointsService;
import com.example.horseracingtournamentsystem.points.entity.PointTransaction;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.dto.request.SubmitPredictionRequest;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PredictionService {

    private final RacePredictionRepository predictionRepo;
    private final PredictionSettlementJobRepository jobRepo;
    private final RaceRepository raceRepo;
    private final PointsService pointsService;

    public PredictionService(RacePredictionRepository predictionRepo,
                             PredictionSettlementJobRepository jobRepo,
                             RaceRepository raceRepo,
                             PointsService pointsService) {
        this.predictionRepo = predictionRepo;
        this.jobRepo = jobRepo;
        this.raceRepo = raceRepo;
        this.pointsService = pointsService;
    }

    @Transactional
    public RacePrediction submitPrediction(User spectator, SubmitPredictionRequest request) {
        Race race = raceRepo.findById(request.getRaceId())
            .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        // Rule: Submission is ONLY allowed when the race is SCHEDULED
        if (!"SCHEDULED".equals(race.getStatus())) {
            throw new IllegalStateException("Predictions can only be made when the race is SCHEDULED");
        }

        // Rule: Duplicate predictions of the same type for this race are not allowed
        if (predictionRepo.existsByRaceIdAndSpectatorIdAndPredictionType(race.getId(), spectator.getId(), request.getPredictionType())) {
            throw new IllegalStateException("You have already submitted a prediction of type " + request.getPredictionType() + " for this race");
        }

        int cost = RacePrediction.TYPE_WINNER.equals(request.getPredictionType()) ? 5 : 10;

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

        // 1. Create and flush the prediction first to get the database-generated ID
        RacePrediction prediction = RacePrediction.create(
            race, spectator, request.getPredictionType(), 
            request.getPredictedWinnerId(), request.getPredictedSecondId(), request.getPredictedThirdId(), 
            cost
        );
        RacePrediction saved = predictionRepo.saveAndFlush(prediction);

        // 2. Adjust points (deduct cost) and reference it back in the transaction ledger
        pointsService.adjustPoints(
            spectator, -cost, PointTransaction.TX_PREDICTION_ENTRY, 
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

        if (!RacePrediction.STATUS_PENDING.equals(prediction.getStatus())) {
            throw new IllegalStateException("Only pending predictions can be updated");
        }

        Race race = prediction.getRace();
        if (!"SCHEDULED".equals(race.getStatus())) {
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
        prediction.setPredictedSecondId(request.getPredictedSecondId());
        prediction.setPredictedThirdId(request.getPredictedThirdId());
        prediction.setUpdatedAt(LocalDateTime.now());

        return predictionRepo.save(prediction);
    }

    @Transactional
    public void lockPredictionsForRace(Long raceId) {
        List<RacePrediction> pendingPredictions = predictionRepo.findByRace_IdAndStatus(raceId, RacePrediction.STATUS_PENDING);
        for (RacePrediction p : pendingPredictions) {
            p.setStatus(RacePrediction.STATUS_LOCKED);
            p.setLockedAt(LocalDateTime.now());
            predictionRepo.save(p);
        }
    }

    @Transactional
    public void refundCancelledRace(Long raceId) {
        List<RacePrediction> predictions = predictionRepo.findByRace_Id(raceId);
        for (RacePrediction p : predictions) {
            if (RacePrediction.STATUS_PENDING.equals(p.getStatus()) || RacePrediction.STATUS_LOCKED.equals(p.getStatus())) {
                p.setStatus(RacePrediction.STATUS_REFUNDED);
                p.setUpdatedAt(LocalDateTime.now());
                predictionRepo.save(p);

                // Refund the points (Idempotency checked by adjustPoints using index)
                pointsService.adjustPoints(
                    p.getSpectator(), p.getEntryCostPoints(), PointTransaction.TX_RACE_CANCEL_REFUND, 
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
