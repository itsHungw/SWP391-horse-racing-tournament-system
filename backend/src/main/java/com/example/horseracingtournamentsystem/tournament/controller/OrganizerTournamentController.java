package com.example.horseracingtournamentsystem.tournament.controller;

import com.example.horseracingtournamentsystem.tournament.dto.request.TournamentRequest;
import com.example.horseracingtournamentsystem.tournament.dto.response.TournamentResponse;
import com.example.horseracingtournamentsystem.tournament.service.TournamentService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Organizer tự vận hành giải của tổ chức mình (BR-09). Prefix /api/v1/organizer/**
 * -> hasRole('ORGANIZER'); service kiểm tra thêm quyền sở hữu tổ chức.
 * Vòng đời: tạo (DRAFT) -> submit (PENDING_APPROVAL) -> [admin duyệt: APPROVED]
 * -> mở đăng ký (OPEN_REGISTRATION) -> ... (BR-17 chặn mở đăng ký nếu chưa APPROVED).
 */
@RestController
@RequestMapping("/api/v1/organizer/tournaments")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "04 · Organizer · Tournament lifecycle", description = "Create, submit for approval, then drive status (open registration, publish schedule, …).")
public class OrganizerTournamentController {

    private final TournamentService tournamentService;

    @GetMapping
    public List<TournamentResponse> myTournaments(Authentication authentication) {
        return tournamentService.getMyTournaments(authentication.getName());
    }

    @GetMapping("/{id}")
    public TournamentResponse detail(@PathVariable Long id, Authentication authentication) {
        return tournamentService.getOrganizerTournamentDetail(id, authentication.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TournamentResponse create(
            @Valid @RequestBody TournamentRequest req,
            Authentication authentication
    ) {
        return tournamentService.createForOrganizer(req, authentication.getName());
    }

    @PutMapping("/{id}")
    public TournamentResponse update(
            @PathVariable Long id,
            @Valid @RequestBody TournamentRequest req,
            Authentication authentication
    ) {
        return tournamentService.updateTournamentForOrganizer(id, req, authentication.getName());
    }

    @PostMapping("/{id}/submit")
    public TournamentResponse submitForApproval(@PathVariable Long id, Authentication authentication) {
        return tournamentService.submitForApproval(id, authentication.getName());
    }

    @PutMapping("/{id}/status")
    public void updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            Authentication authentication
    ) {
        tournamentService.updateStatusForOrganizer(id, status, authentication.getName());
    }
}
