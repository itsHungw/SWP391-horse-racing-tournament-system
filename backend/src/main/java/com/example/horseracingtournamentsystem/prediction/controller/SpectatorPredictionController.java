package com.example.horseracingtournamentsystem.prediction.controller;

import com.example.horseracingtournamentsystem.point.entity.PointSettingKey;
import com.example.horseracingtournamentsystem.point.service.PointSettingsService;
import com.example.horseracingtournamentsystem.point.service.PointAccountService;
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
    private final PointAccountService pointsService;
    private final PointSettingsService pointSettingsService;

    public SpectatorPredictionController(PredictionService predictionService,
                                         RacePredictionRepository predictionRepo,
                                         RaceRepository raceRepo,
                                         UserRepository userRepo,
                                         PointAccountService pointsService,
                                         PointSettingsService pointSettingsService) {
        this.predictionService = predictionService;
        this.predictionRepo = predictionRepo;
        this.raceRepo = raceRepo;
        this.userRepo = userRepo;
        this.pointsService = pointsService;
        this.pointSettingsService = pointSettingsService;
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

        res.getEntryCost().setWinner(pointSettingsService.getInt(PointSettingKey.PREDICTION_WINNER_ENTRY_COST));
        res.getEntryCost().setTop3(pointSettingsService.getInt(PointSettingKey.PREDICTION_TOP3_ENTRY_COST));

        res.getRewardConfig().setWinnerReward(pointSettingsService.getInt(PointSettingKey.PREDICTION_WINNER_REWARD));
        res.getRewardConfig().setTop3ExactReward(pointSettingsService.getInt(PointSettingKey.PREDICTION_TOP3_EXACT_REWARD));
        res.getRewardConfig().setTop3AnyOrderReward(pointSettingsService.getInt(PointSettingKey.PREDICTION_TOP3_ANY_ORDER_REWARD));

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
                Map<Long, String> horseNames = getHorseNamesForPredictions(racePreds);
                Map<Long, Integer> roundNumbers = getRoundNumbersForRaces(racePreds.stream().map(RacePrediction::getRace).toList());
                res.setMyPredictions(racePreds.stream().map(p -> UserPredictionResponse.from(p, horseNames, roundNumbers.get(p.getRace().getId()))).toList());

                hasWinnerPred = racePreds.stream().anyMatch(p -> "WINNER".equals(p.getPredictionType()));
                hasTop3Pred = racePreds.stream().anyMatch(p -> "TOP3".equals(p.getPredictionType()));
            }
        } else {
            res.setMyPredictions(List.of());
        }
        res.setWinnerDistributionVisible(hasWinnerPred);
        res.setTop3DistributionVisible(hasTop3Pred);

        // Compute rates if visible
        List<RacePrediction> allPredictions = predictionRepo.findByRace_Id(raceId);
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
        Map<Long, Integer> roundNumbers = getRoundNumbersForRaces(List.of(prediction.getRace()));
        return ResponseEntity.ok(UserPredictionResponse.from(prediction, getHorseNamesForPredictions(List.of(prediction)), roundNumbers.get(prediction.getRace().getId())));
    }

    @PutMapping("/predictions/{id}")
    public ResponseEntity<UserPredictionResponse> updatePrediction(@PathVariable Long id, @Valid @RequestBody SubmitPredictionRequest request, Authentication authentication) {
        User spectator = userRepo.findByEmail(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("Spectator user not found"));

        RacePrediction prediction = predictionService.updatePrediction(spectator, id, request);
        Map<Long, Integer> roundNumbers = getRoundNumbersForRaces(List.of(prediction.getRace()));
        return ResponseEntity.ok(UserPredictionResponse.from(prediction, getHorseNamesForPredictions(List.of(prediction)), roundNumbers.get(prediction.getRace().getId())));
    }

    @GetMapping("/predictions/my")
    public ResponseEntity<List<UserPredictionResponse>> getMyPredictions(Authentication authentication) {
        User spectator = userRepo.findByEmail(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("Spectator user not found"));

        List<RacePrediction> predictions = predictionService.getMyPredictions(spectator);
        Map<Long, String> horseNames = getHorseNamesForPredictions(predictions);
        Map<Long, Integer> roundNumbers = getRoundNumbersForRaces(predictions.stream().map(RacePrediction::getRace).toList());
        return ResponseEntity.ok(predictions.stream().map(p -> UserPredictionResponse.from(p, horseNames, roundNumbers.get(p.getRace().getId()))).toList());
    }

    private Map<Long, String> getHorseNamesForPredictions(List<RacePrediction> preds) {
        java.util.Set<Long> ids = new java.util.HashSet<>();
        for (RacePrediction p : preds) {
            if (p.getPredictedWinnerId() != null) ids.add(p.getPredictedWinnerId());
            if (p.getPredictedSecondId() != null) ids.add(p.getPredictedSecondId());
            if (p.getPredictedThirdId() != null) ids.add(p.getPredictedThirdId());
        }
        if (ids.isEmpty()) return java.util.Map.of();
        
        List<Object[]> names = predictionRepo.findParticipantHorseNamesByIds(ids);
        java.util.Map<Long, String> map = new java.util.HashMap<>();
        for (Object[] row : names) {
            map.put(((Number) row[0]).longValue(), (String) row[1]);
        }
        return map;
    }

    private java.util.Map<Long, Integer> getRoundNumbersForRaces(List<Race> races) {
        java.util.Map<Long, Integer> roundNumbers = new java.util.HashMap<>();
        for (Race r : races) {
            roundNumbers.put(r.getId(), 1); // Fallback default
        }

        java.util.Set<Long> tournamentIds = races.stream()
                .filter(r -> r.getTournament() != null)
                .map(r -> r.getTournament().getId())
                .collect(Collectors.toSet());

        for (Long tId : tournamentIds) {
            List<Race> tRaces = raceRepo.findAllByTournamentIdAndDeletedAtIsNullOrderByRaceAtAsc(tId);
            for (int i = 0; i < tRaces.size(); i++) {
                roundNumbers.put(tRaces.get(i).getId(), i + 1);
            }
        }
        return roundNumbers;
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
