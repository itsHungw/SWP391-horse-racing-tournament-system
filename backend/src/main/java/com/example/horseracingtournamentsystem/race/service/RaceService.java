package com.example.horseracingtournamentsystem.race.service;

import com.example.horseracingtournamentsystem.race.dto.request.RaceRequest;
import com.example.horseracingtournamentsystem.race.dto.response.RaceResponse;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RaceService {

    private final RaceRepository raceRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;

    private static final Map<String, Set<String>> ALLOWED_STATUS_TRANSITIONS = Map.of(
            "SCHEDULED", Set.of("CHECKING", "CANCELLED"),
            "CHECKING", Set.of("READY", "CANCELLED"),
            "READY", Set.of("ONGOING", "CANCELLED"),
            "ONGOING", Set.of("FINISHED", "CANCELLED"),
            "FINISHED", Set.of("RESULT_SUBMITTED"),
            "RESULT_SUBMITTED", Set.of("RESULT_CONFIRMED"),
            "RESULT_CONFIRMED", Set.of("PUBLISHED"),
            "PUBLISHED", Set.of()
    );

    @Transactional
    public RaceResponse createRace(RaceRequest req, String creatorEmail) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(req.getTournamentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));

        if (raceRepository.existsByCodeAndDeletedAtIsNull(req.getCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race code already exists");
        }

        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Creator not found"));

        Race race = Race.create(
                tournament, req.getName(), req.getCode(), req.getRaceDateTime(),
                req.getDistanceMeters(), req.getMaxParticipants(), creator
        );

        raceRepository.save(race);
        return mapToResponse(race);
    }

    @Transactional
    public RaceResponse updateRace(Long id, RaceRequest req) {
        Race race = raceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));

        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(req.getTournamentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));

        if (raceRepository.existsByCodeAndIdNotAndDeletedAtIsNull(req.getCode(), id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race code already exists");
        }

        race.update(tournament, req.getName(), req.getRaceDateTime(), req.getDistanceMeters(), req.getMaxParticipants());
        raceRepository.save(race);
        return mapToResponse(race);
    }

    @Transactional
    public void deleteRace(Long id) {
        Race race = raceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));
        race.cancel();
        race.softDelete();
        raceRepository.save(race);
    }

    public RaceResponse getRaceDetail(Long id) {
        Race race = raceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));
        return mapToResponse(race);
    }

    public List<RaceResponse> getAdminRaces(Long tournamentId) {
        List<Race> races = tournamentId == null
                ? raceRepository.findAllByDeletedAtIsNullOrderByRaceAtAsc()
                : raceRepository.findAllByTournamentIdAndDeletedAtIsNullOrderByRaceAtAsc(tournamentId);

        return races.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RaceResponse updateRaceStatus(Long id, String targetStatus) {
        Race race = raceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));

        String normalizedStatus = targetStatus == null ? "" : targetStatus.trim().toUpperCase();
        if (!ALLOWED_STATUS_TRANSITIONS.containsKey(normalizedStatus) && !"CANCELLED".equals(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported race status");
        }

        Set<String> allowedTargets = ALLOWED_STATUS_TRANSITIONS.getOrDefault(race.getStatus(), Set.of());
        if (!allowedTargets.contains(normalizedStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Race status cannot move from " + race.getStatus() + " to " + normalizedStatus
            );
        }

        race.updateStatus(normalizedStatus);
        raceRepository.save(race);
        return mapToResponse(race);
    }

    public List<RaceResponse> getPublicRaces(Long tournamentId) {
        List<Race> races;
        if (tournamentId != null) {
            races = raceRepository.findAllByTournamentIdAndDeletedAtIsNull(tournamentId);
        } else {
            races = raceRepository.findAllByDeletedAtIsNull();
        }
        return races.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private RaceResponse mapToResponse(Race r) {
        return RaceResponse.builder()
                .id(r.getId())
                .tournamentId(r.getTournament().getId())
                .tournamentName(r.getTournament().getName())
                .name(r.getName())
                .code(r.getCode())
                .raceDateTime(r.getRaceAt())
                .distanceMeters(r.getDistanceMeter())
                .maxParticipants(r.getMaxParticipants())
                .status(r.getStatus())
                .creatorName(r.getCreatedBy().getFullName())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
