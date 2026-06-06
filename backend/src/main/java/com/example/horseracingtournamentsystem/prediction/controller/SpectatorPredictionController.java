package com.example.horseracingtournamentsystem.prediction.controller;

import com.example.horseracingtournamentsystem.points.service.PointsService;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.dto.request.SubmitPredictionRequest;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionOptionsResponse;
import com.example.horseracingtournamentsystem.prediction.dto.response.OpenRacePredictionResponse;
import com.example.horseracingtournamentsystem.prediction.dto.response.UserPredictionResponse;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.service.PredictionService;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class SpectatorPredictionController {

    private final PredictionService predictionService;
    private final RacePredictionRepository predictionRepo;
    private final RaceRepository raceRepo;
    private final UserRepository userRepo;
    private final PointsService pointsService;

    public SpectatorPredictionController(PredictionService predictionService,
                                         RacePredictionRepository predictionRepo,
                                         RaceRepository raceRepo,
                                         UserRepository userRepo,
                                         PointsService pointsService) {
        this.predictionService = predictionService;
        this.predictionRepo = predictionRepo;
        this.raceRepo = raceRepo;
        this.userRepo = userRepo;
        this.pointsService = pointsService;
    }

    @GetMapping("/races/open-for-prediction")
    public ResponseEntity<List<OpenRacePredictionResponse>> getOpenForPredictions(Authentication authentication) {
        List<Race> openRaces = raceRepo.findOpenRacesForPrediction();
        
        // Filter out races with less than 2 participants
        List<Race> validRaces = openRaces.stream()
            .filter(r -> predictionRepo.findActiveParticipantsByRaceId(r.getId()).size() >= 2)
            .collect(Collectors.toList());

        User user = null;
        if (authentication != null) {
            user = userRepo.findByEmail(authentication.getName()).orElse(null);
        }
        final User currentUser = user;

        List<OpenRacePredictionResponse> response = validRaces.stream().map(r -> {
            OpenRacePredictionResponse item = new OpenRacePredictionResponse();
            item.setRaceId(r.getId());
            item.setRaceName(r.getName());
            item.setRoundName(r.getRoundName());
            if (r.getTournament() != null) {
                item.setTournamentId(r.getTournament().getId());
                item.setTournamentName(r.getTournament().getName());
            }
            item.setRaceAt(r.getRaceAt());
            item.setStatus(r.getStatus());
            item.setTotalPredictions(predictionRepo.countByRaceId(r.getId()));

            OpenRacePredictionResponse.UserPredictionStatus status = new OpenRacePredictionResponse.UserPredictionStatus();
            if (currentUser != null) {
                List<RacePrediction> myPreds = predictionRepo.findBySpectatorId(currentUser.getId());
                List<String> types = myPreds.stream()
                    .filter(p -> p.getRace().getId().equals(r.getId()))
                    .map(RacePrediction::getPredictionType)
                    .collect(Collectors.toList());
                status.setHasPredicted(!types.isEmpty());
                status.setTypes(types);
            } else {
                status.setHasPredicted(false);
                status.setTypes(List.of());
            }
            item.setPredictedByUser(status);
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/races/{raceId}/prediction-options")
    public ResponseEntity<PredictionOptionsResponse> getOptions(@PathVariable Long raceId, Authentication authentication) {
        Race race = raceRepo.findById(raceId)
            .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        PredictionOptionsResponse res = new PredictionOptionsResponse();
        res.setRaceId(race.getId());
        res.setRaceName(race.getName());
        res.setRaceStatus(race.getStatus());
        res.setPredictionOpen("SCHEDULED".equals(race.getStatus()) && race.getRaceAt().isAfter(java.time.LocalDateTime.now()));

        List<Object[]> rawOptions = predictionRepo.findActiveParticipantsByRaceId(raceId);
        List<PredictionOptionsResponse.Option> options = rawOptions.stream().map(row -> {
            PredictionOptionsResponse.Option opt = new PredictionOptionsResponse.Option();
            opt.setRaceParticipantId(((Number) row[0]).longValue());
            opt.setStartNumber(row[1] != null ? ((Number) row[1]).intValue() : null);
            opt.setLaneNumber(row[2] != null ? ((Number) row[2]).intValue() : null);
            opt.setHorseName((String) row[3]);
            opt.setJockeyName(row[4] != null ? (String) row[4] : "TBD");
            return opt;
        }).collect(Collectors.toList());
        res.setOptions(options);

        boolean hasWinnerPred = false;
        boolean hasTop3Pred = false;

        if (authentication != null) {
            User user = userRepo.findByEmail(authentication.getName()).orElse(null);
            if (user != null) {
                List<RacePrediction> myPreds = predictionRepo.findBySpectatorId(user.getId());
                List<RacePrediction> racePreds = myPreds.stream()
                    .filter(p -> p.getRace().getId().equals(raceId))
                    .collect(Collectors.toList());
                res.setMyPredictions(racePreds.stream().map(UserPredictionResponse::from).toList());

                hasWinnerPred = racePreds.stream().anyMatch(p -> "WINNER".equals(p.getPredictionType()));
                hasTop3Pred = racePreds.stream().anyMatch(p -> "TOP3".equals(p.getPredictionType()));
            }
        } else {
            res.setMyPredictions(List.of());
        }
        res.setWinnerDistributionVisible(hasWinnerPred);
        res.setTop3DistributionVisible(hasTop3Pred);

        // Compute rates if visible
        List<RacePrediction> allPredictions = predictionRepo.findByRaceId(raceId);
        long totalWinnerPreds = allPredictions.stream().filter(p -> "WINNER".equals(p.getPredictionType())).count();
        long totalTop3Preds = allPredictions.stream().filter(p -> "TOP3".equals(p.getPredictionType())).count();

        for (PredictionOptionsResponse.Option opt : res.getOptions()) {
            if (hasWinnerPred && totalWinnerPreds > 0) {
                long winnerSelections = allPredictions.stream()
                    .filter(p -> "WINNER".equals(p.getPredictionType()) && p.getPredictedWinnerId().equals(opt.getRaceParticipantId()))
                    .count();
                opt.setCommunityWinnerRate((double) winnerSelections / totalWinnerPreds);
            } else {
                opt.setCommunityWinnerRate(null);
            }

            if (hasTop3Pred && totalTop3Preds > 0) {
                long top3Selections = allPredictions.stream()
                    .filter(p -> "TOP3".equals(p.getPredictionType()) && 
                        (opt.getRaceParticipantId().equals(p.getPredictedWinnerId()) || 
                         opt.getRaceParticipantId().equals(p.getPredictedSecondId()) || 
                         opt.getRaceParticipantId().equals(p.getPredictedThirdId())))
                    .count();
                opt.setCommunityTop3Rate((double) top3Selections / totalTop3Preds);
            } else {
                opt.setCommunityTop3Rate(null);
            }
        }

        return ResponseEntity.ok(res);
    }

    @PostMapping("/predictions")
    public ResponseEntity<UserPredictionResponse> submitPrediction(@Valid @RequestBody SubmitPredictionRequest request, Authentication authentication) {
        User spectator = userRepo.findByEmail(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("Spectator user not found"));

        RacePrediction prediction = predictionService.submitPrediction(spectator, request);
        return ResponseEntity.ok(UserPredictionResponse.from(prediction));
    }

    @PutMapping("/predictions/{id}")
    public ResponseEntity<UserPredictionResponse> updatePrediction(@PathVariable Long id, @Valid @RequestBody SubmitPredictionRequest request, Authentication authentication) {
        User spectator = userRepo.findByEmail(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("Spectator user not found"));

        RacePrediction prediction = predictionService.updatePrediction(spectator, id, request);
        return ResponseEntity.ok(UserPredictionResponse.from(prediction));
    }

    @GetMapping("/predictions/my")
    public ResponseEntity<List<UserPredictionResponse>> getMyPredictions(Authentication authentication) {
        User spectator = userRepo.findByEmail(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("Spectator user not found"));

        List<RacePrediction> predictions = predictionService.getMyPredictions(spectator);
        return ResponseEntity.ok(predictions.stream().map(UserPredictionResponse::from).toList());
    }

    @GetMapping("/point-accounts/me")
    public ResponseEntity<Map<String, Object>> getMyPoints(Authentication authentication) {
        User spectator = userRepo.findByEmail(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("Spectator user not found"));

        int balance = pointsService.getBalance(spectator.getId());
        return ResponseEntity.ok(Map.of(
            "userId", spectator.getId(),
            "pointBalance", balance
        ));
    }
}
