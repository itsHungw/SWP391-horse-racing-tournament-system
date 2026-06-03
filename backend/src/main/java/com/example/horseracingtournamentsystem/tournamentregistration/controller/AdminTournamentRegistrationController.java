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

@RestController
@RequestMapping("/api/v1/admin/tournament-registrations")
@RequiredArgsConstructor
public class AdminTournamentRegistrationController {

    private final TournamentRegistrationService registrationService;

    @GetMapping
    public List<TournamentRegistrationResponse> list(@RequestParam(required = false) String status) {
        return registrationService.listAdminRegistrations(status);
    }

    @PostMapping("/{id}/approve")
    public TournamentRegistrationResponse approve(@PathVariable Long id, Authentication authentication) {
        return registrationService.approve(id, authentication.getName());
    }

    @PostMapping("/{id}/reject")
    public TournamentRegistrationResponse reject(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody RejectTournamentRegistrationRequest request
    ) {
        return registrationService.reject(id, authentication.getName(), request.reason());
    }
}
