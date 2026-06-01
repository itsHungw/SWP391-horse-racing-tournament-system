package com.example.horseracingtournamentsystem.tournament.service;

import com.example.horseracingtournamentsystem.tournament.dto.request.TournamentRequest;
import com.example.horseracingtournamentsystem.tournament.dto.response.TournamentResponse;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;

    @Transactional
    public TournamentResponse createTournament(TournamentRequest req, String creatorEmail) {
        if (tournamentRepository.existsByCodeAndDeletedAtIsNull(req.getCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tournament code already exists");
        }
        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date cannot be before start date");
        }
        if (req.getRegistrationEndAt().isBefore(req.getRegistrationStartAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Registration end time cannot be before start time");
        }

        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Creator user not found"));

        Tournament tournament = Tournament.create(
                req.getName(), req.getCode(), req.getDescription(), req.getLocation(),
                req.getStartDate(), req.getEndDate(), req.getRegistrationStartAt(),
                req.getRegistrationEndAt(), req.getMaxHorses(), creator
        );

        tournamentRepository.save(tournament);
        return mapToResponse(tournament);
    }

    @Transactional
    public TournamentResponse updateTournament(Long id, TournamentRequest req) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));

        if (!java.util.List.of("DRAFT", "POSTPONED").contains(tournament.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tournament settings can only be modified when in DRAFT or POSTPONED status");
        }
        if (tournamentRepository.existsByCodeAndIdNotAndDeletedAtIsNull(req.getCode(), id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tournament code already exists");
        }
        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date cannot be before start date");
        }
        if (req.getRegistrationEndAt().isBefore(req.getRegistrationStartAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Registration end time cannot be before start time");
        }

        tournament.update(
                req.getName(), req.getDescription(), req.getLocation(),
                req.getStartDate(), req.getEndDate(), req.getRegistrationStartAt(),
                req.getRegistrationEndAt(), req.getMaxHorses()
        );

        tournamentRepository.save(tournament);
        return mapToResponse(tournament);
    }

    @Transactional
    public void deleteTournament(Long id) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
        if (!"DRAFT".equals(tournament.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft tournaments can be deleted. Please postpone active tournaments instead");
        }
        tournament.postpone();
        tournament.softDelete();
        tournamentRepository.save(tournament);
    }

    public TournamentResponse getTournamentDetail(Long id) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
        return mapToResponse(tournament);
    }

    public List<TournamentResponse> getAdminTournaments() {
        return tournamentRepository.findAllByDeletedAtIsNull().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TournamentResponse> getPublicTournaments() {
        return tournamentRepository.findAllByStatusInAndDeletedAtIsNull(
                List.of("OPEN_REGISTRATION", "CLOSED_REGISTRATION", "ONGOING", "COMPLETED")
        ).stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void updateStatus(Long id, String status) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
        
        String upperStatus = status.toUpperCase();
        switch (upperStatus) {
            case "OPEN_REGISTRATION":
                tournament.openRegistration();
                break;
            case "CLOSED_REGISTRATION":
                tournament.closeRegistration();
                break;
            case "ONGOING":
                tournament.startOngoing();
                break;
            case "COMPLETED":
                tournament.completeTournament();
                break;
            case "POSTPONED":
                tournament.postpone();
                break;
            default:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid tournament status: " + status);
        }
        tournamentRepository.save(tournament);
    }

    private TournamentResponse mapToResponse(Tournament t) {
        return TournamentResponse.builder()
                .id(t.getId())
                .name(t.getName())
                .code(t.getCode())
                .description(t.getDescription())
                .location(t.getLocation())
                .startDate(t.getStartDate())
                .endDate(t.getEndDate())
                .registrationStartAt(t.getRegistrationStartAt())
                .registrationEndAt(t.getRegistrationEndAt())
                .maxHorses(t.getMaxHorses())
                .status(t.getStatus())
                .creatorName(t.getCreatedBy().getFullName())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
