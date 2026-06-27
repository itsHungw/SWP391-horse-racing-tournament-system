package com.example.horseracingtournamentsystem.prediction.controller;

import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.dto.request.SubmitPredictionRequest;
import com.example.horseracingtournamentsystem.prediction.dto.request.SubmitStreakPredictionRequest;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionOptionsResponse;
import com.example.horseracingtournamentsystem.prediction.dto.response.OpenRacePredictionResponse;
import com.example.horseracingtournamentsystem.prediction.dto.response.PredictionQuoteResponse;
import com.example.horseracingtournamentsystem.prediction.dto.response.StreakPredictionResponse;
import com.example.horseracingtournamentsystem.prediction.dto.response.UserPredictionResponse;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.service.PredictionService;
import com.example.horseracingtournamentsystem.prediction.service.OddsCalculationService;
import com.example.horseracingtournamentsystem.prediction.service.StreakPredictionService;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
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
    private final WalletService walletService;
    private final OddsCalculationService oddsCalculationService;
    private final RaceParticipantRepository raceParticipantRepository;
    private final StreakPredictionService streakPredictionService;

    public SpectatorPredictionController(PredictionService predictionService,
                                         RacePredictionRepository predictionRepo,
                                         RaceRepository raceRepo,
                                         UserRepository userRepo,
                                         WalletService walletService,
                                         OddsCalculationService oddsCalculationService,
                                         RaceParticipantRepository raceParticipantRepository,
                                         StreakPredictionService streakPredictionService) {
        this.predictionService = predictionService;
        this.predictionRepo = predictionRepo;
        this.raceRepo = raceRepo;
        this.userRepo = userRepo;
        this.walletService = walletService;
        this.oddsCalculationService = oddsCalculationService;
        this.raceParticipantRepository = raceParticipantRepository;
        this.streakPredictionService = streakPredictionService;
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
        res.setRaceStatus(race.getStatus().name());
        res.setPredictionOpen(RaceStatus.SCHEDULED.equals(race.getStatus()) && race.getRaceAt().isAfter(java.time.LocalDateTime.now()));

        // Cá cược nay dùng tiền thật + odds động: không còn entry-cost/reward cố định.
        // Giữ entryCost/rewardConfig mặc định 0 để không phá hợp đồng JSON với FE.

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
            }
        } else {
            res.setMyPredictions(List.of());
        }
        res.setWinnerDistributionVisible(hasWinnerPred);

        List<RaceParticipant> participants = raceParticipantRepository.findAllByRace_IdAndStatusNotOrderByCreatedAtAsc(raceId, com.example.horseracingtournamentsystem.race.enums.ParticipantStatus.WITHDRAWN);
        res.setPositionOddsMatrix(oddsCalculationService.calculatePositionOddsMatrix(raceId, participants));
        res.setH2hMatchups(oddsCalculationService.calculateH2HMatchups(raceId, participants));

        // Fair win odds (1/p) per runner — used by the streak parlay so its preview matches settlement.
        Map<Long, java.math.BigDecimal> winProbs = oddsCalculationService.getWinProbabilities(participants);
        for (PredictionOptionsResponse.Option opt : res.getOptions()) {
            java.math.BigDecimal p = winProbs.get(opt.getRaceParticipantId());
            if (p != null && p.compareTo(java.math.BigDecimal.ZERO) > 0) {
                opt.setWinOdds(java.math.BigDecimal.ONE.divide(p, 2, java.math.RoundingMode.HALF_UP));
            }
        }

        // Compute rates if visible
        List<RacePrediction> allPredictions = predictionRepo.findByRace_Id(raceId);
        long totalWinnerPreds = allPredictions.stream().filter(p -> "WINNER".equals(p.getPredictionType())).count();

        for (PredictionOptionsResponse.Option opt : res.getOptions()) {
            if (hasWinnerPred && totalWinnerPreds > 0) {
                long winnerSelections = allPredictions.stream()
                    .filter(p -> "WINNER".equals(p.getPredictionType()) && p.getPredictedWinnerId().equals(opt.getRaceParticipantId()))
                    .count();
                opt.setCommunityWinnerRate((double) winnerSelections / totalWinnerPreds);
            } else {
                opt.setCommunityWinnerRate(null);
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

    @PostMapping("/predictions/quote")
    public ResponseEntity<PredictionQuoteResponse> quotePrediction(@Valid @RequestBody SubmitPredictionRequest request) {
        return ResponseEntity.ok(predictionService.quotePrediction(request));
    }

    @PutMapping("/predictions/{id}")
    public ResponseEntity<UserPredictionResponse> rejectPredictionUpdate(@PathVariable Long id) {
        throw new ResponseStatusException(HttpStatus.METHOD_NOT_ALLOWED, "Predictions cannot be edited after placement.");
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

    @PostMapping("/streak")
    public ResponseEntity<StreakPredictionResponse> submitStreakPrediction(
            Authentication authentication,
            @RequestBody SubmitStreakPredictionRequest request) {

        User spectator = userRepo.findByEmail(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("Spectator user not found"));

        StreakPredictionResponse response = streakPredictionService.submitStreakPrediction(spectator.getId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/streak")
    public ResponseEntity<List<StreakPredictionResponse>> getSpectatorStreaks(
            Authentication authentication) {

        User spectator = userRepo.findByEmail(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("Spectator user not found"));

        List<StreakPredictionResponse> streaks = streakPredictionService.getSpectatorStreaks(spectator.getId());
        return ResponseEntity.ok(streaks);
    }

    private Map<Long, String> getHorseNamesForPredictions(List<RacePrediction> preds) {
        java.util.Set<Long> ids = new java.util.HashSet<>();
        for (RacePrediction p : preds) {
            if (p.getPredictedWinnerId() != null) ids.add(p.getPredictedWinnerId());
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

        long balance = walletService.getBalance(spectator.getId());
        return ResponseEntity.ok(Map.of(
            "userId", spectator.getId(),
            "pointBalance", balance
        ));
    }
}
