package com.example.horseracingtournamentsystem.leaderboard.service;

import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.leaderboard.dto.response.ChampionshipStandingResponse;
import com.example.horseracingtournamentsystem.leaderboard.dto.response.SpectatorStandingResponse;
import com.example.horseracingtournamentsystem.point.entity.UserPointAccount;
import com.example.horseracingtournamentsystem.point.repository.UserPointAccountRepository;
import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.result.entity.RaceResult;
import com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus;
import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeaderboardService {

    private static final List<ResultRecordStatus> CONFIRMED_RESULT_STATUSES = List.of(
            ResultRecordStatus.CONFIRMED, ResultRecordStatus.PUBLISHED);
    private static final List<PredictionStatus> SETTLED_PREDICTION_STATUSES = List.of(
            PredictionStatus.CORRECT, PredictionStatus.INCORRECT);
    private static final Set<String> EXCLUDED_ROLES = Set.of("ADMIN", "REFEREE");

    private final RaceResultRepository raceResultRepo;
    private final RacePredictionRepository predictionRepo;
    private final UserPointAccountRepository pointAccountRepo;

    public LeaderboardService(RaceResultRepository raceResultRepo,
                              RacePredictionRepository predictionRepo,
                              UserPointAccountRepository pointAccountRepo) {
        this.raceResultRepo = raceResultRepo;
        this.predictionRepo = predictionRepo;
        this.pointAccountRepo = pointAccountRepo;
    }

    /**
     * Horse or Jockey standings. {@code championshipId == null} aggregates across all seasons.
     */
    @Transactional(readOnly = true)
    public List<ChampionshipStandingResponse> getChampionshipStandings(Long championshipId, String type) {
        boolean jockeyBoard = "JOCKEY".equalsIgnoreCase(type);
        Map<Long, Accumulator> byEntity = new LinkedHashMap<>();

        for (RaceResult result : raceResultRepo.findByStatusIn(CONFIRMED_RESULT_STATUSES)) {
            Race race = result.getRace();
            if (race == null) {
                continue;
            }
            if (championshipId != null) {
                Tournament tournament = race.getTournament();
                if (tournament == null || !championshipId.equals(tournament.getId())) {
                    continue;
                }
            }
            RaceParticipant participant = result.getParticipant();
            if (participant == null) {
                continue;
            }

            Long key;
            String name;
            String subtitle = null;
            if (jockeyBoard) {
                User jockey = participant.getJockey();
                if (jockey == null) {
                    continue;
                }
                key = jockey.getId();
                name = jockey.getFullName();
            } else {
                Horse horse = participant.getHorse();
                if (horse == null) {
                    continue;
                }
                key = horse.getId();
                name = horse.getName();
                User owner = participant.getOwner();
                subtitle = owner != null ? owner.getFullName() : null;
            }

            Accumulator accumulator = byEntity.get(key);
            if (accumulator == null) {
                accumulator = new Accumulator(name, subtitle);
                byEntity.put(key, accumulator);
            }
            accumulator.add(result.getPoints(), result.getPosition(), race.getRaceAt());
        }

        List<Accumulator> sorted = new ArrayList<>(byEntity.values());
        sorted.sort(Comparator
                .comparingLong((Accumulator a) -> a.points).reversed()
                .thenComparing(Comparator.comparingLong((Accumulator a) -> a.wins).reversed())
                .thenComparing(Comparator.comparingLong((Accumulator a) -> a.podiums).reversed()));

        List<ChampionshipStandingResponse> response = new ArrayList<>(sorted.size());
        int rank = 1;
        for (Accumulator acc : sorted) {
            response.add(new ChampionshipStandingResponse(
                    rank++, acc.name, acc.subtitle, acc.points, acc.wins, acc.podiums, acc.starts, acc.recentForm()));
        }
        return response;
    }

    /**
     * Spectator points leaderboard. {@code championshipId == null} counts predictions across all seasons.
     * Excludes staff (admin/referee), inactive and soft-deleted accounts, and empty accounts.
     */
    @Transactional(readOnly = true)
    public List<SpectatorStandingResponse> getSpectatorLeaderboard(Long championshipId, int limit) {
        Map<Long, long[]> counts = new LinkedHashMap<>(); // userId -> [correct, total]
        for (RacePrediction prediction : predictionRepo.findByStatusIn(SETTLED_PREDICTION_STATUSES)) {
            if (championshipId != null) {
                Race race = prediction.getRace();
                Tournament tournament = race != null ? race.getTournament() : null;
                if (tournament == null || !championshipId.equals(tournament.getId())) {
                    continue;
                }
            }
            User spectator = prediction.getSpectator();
            if (spectator == null) {
                continue;
            }
            long[] tally = counts.computeIfAbsent(spectator.getId(), k -> new long[2]);
            tally[1]++;
            if (PredictionStatus.CORRECT == prediction.getStatus()) {
                tally[0]++;
            }
        }

        List<Row> rows = new ArrayList<>();
        for (UserPointAccount account : pointAccountRepo.findAll()) {
            User user = account.getUser();
            if (user == null || user.getDeletedAt() != null || UserStatus.ACTIVE != user.getStatus()) {
                continue;
            }
            Set<String> roles = user.getActiveRoleNames();
            if (roles.stream().anyMatch(EXCLUDED_ROLES::contains)) {
                continue;
            }
            long[] tally = counts.getOrDefault(user.getId(), new long[2]);
            long points = account.getPointBalance();
            if (points <= 0 && tally[1] == 0) {
                continue; // nothing to show for this account
            }
            rows.add(new Row(user.getFullName(), points, tally[0], tally[1]));
        }

        rows.sort(Comparator
                .comparingLong((Row r) -> r.points).reversed()
                .thenComparing(Comparator.comparingLong((Row r) -> r.correct).reversed()));

        int safeLimit = limit <= 0 ? 50 : Math.min(limit, 200);
        List<SpectatorStandingResponse> response = new ArrayList<>();
        int rank = 1;
        for (Row row : rows) {
            if (response.size() >= safeLimit) {
                break;
            }
            response.add(new SpectatorStandingResponse(rank++, row.name, row.points, row.correct, row.total));
        }
        return response;
    }

    private static final class Accumulator {
        private final String name;
        private final String subtitle;
        private long points;
        private long wins;
        private long podiums;
        private long starts;
        private final List<FormPoint> formPoints = new ArrayList<>();

        Accumulator(String name, String subtitle) {
            this.name = name;
            this.subtitle = subtitle;
        }

        void add(int resultPoints, Integer position, LocalDateTime raceAt) {
            this.points += resultPoints;
            this.starts++;
            if (position != null) {
                if (position == 1) {
                    this.wins++;
                }
                if (position <= 3) {
                    this.podiums++;
                }
            }
            this.formPoints.add(new FormPoint(raceAt, position));
        }

        List<String> recentForm() {
            this.formPoints.sort(Comparator.comparing(
                    fp -> fp.raceAt, Comparator.nullsFirst(Comparator.naturalOrder())));
            int from = Math.max(0, this.formPoints.size() - 5);
            List<String> form = new ArrayList<>();
            for (FormPoint fp : this.formPoints.subList(from, this.formPoints.size())) {
                if (fp.position == null) {
                    form.add("-");
                } else if (fp.position == 1) {
                    form.add("W");
                } else if (fp.position <= 3) {
                    form.add("P");
                } else {
                    form.add("-");
                }
            }
            return form;
        }
    }

    private record FormPoint(LocalDateTime raceAt, Integer position) {
    }

    private static final class Row {
        private final String name;
        private final long points;
        private final long correct;
        private final long total;

        Row(String name, long points, long correct, long total) {
            this.name = name;
            this.points = points;
            this.correct = correct;
            this.total = total;
        }
    }
}
