package com.example.horseracingtournamentsystem.tournamentregistration.controller;

import com.example.horseracingtournamentsystem.tournamentregistration.dto.request.RejectTournamentRegistrationRequest;
import com.example.horseracingtournamentsystem.tournamentregistration.dto.response.TournamentRegistrationResponse;
import com.example.horseracingtournamentsystem.tournamentregistration.service.TournamentRegistrationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Cổng đăng ký của Ban tổ chức (BR-09): organizer tự duyệt/từ chối ngựa+nài đăng ký vào
 * giải CỦA MÌNH. Prefix /api/v1/organizer/** -> hasRole('ORGANIZER'); service kiểm tra
 * thêm quyền sở hữu giải qua Tournament.isManagedBy, và BR-15 (sức chứa) khi duyệt.
 */
@RestController
@RequestMapping("/api/v1/organizer/tournament-registrations")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "09 · Organizer · Approve horse entries", description = "Organizer approves/rejects horse registrations for their tournament (BR-15 capacity).")
public class OrganizerTournamentRegistrationController {

    private final TournamentRegistrationService registrationService;

    @GetMapping
    public List<TournamentRegistrationResponse> list(
            @RequestParam Long tournamentId,
            @RequestParam(required = false) String status,
            Authentication authentication
    ) {
        return registrationService.listForOrganizer(tournamentId, status, authentication.getName());
    }

    @PostMapping("/{id}/approve")
    public TournamentRegistrationResponse approve(@PathVariable Long id, Authentication authentication) {
        return registrationService.approveAsOrganizer(id, authentication.getName());
    }

    @PostMapping("/{id}/reject")
    public TournamentRegistrationResponse reject(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody RejectTournamentRegistrationRequest request
    ) {
        return registrationService.rejectAsOrganizer(id, authentication.getName(), request.reason());
    }
}
