package com.example.horseracingtournamentsystem.tournamentregistration.controller;

import com.example.horseracingtournamentsystem.tournamentregistration.dto.request.TournamentRegistrationRequest;
import com.example.horseracingtournamentsystem.tournamentregistration.dto.response.TournamentRegistrationResponse;
import com.example.horseracingtournamentsystem.tournamentregistration.service.TournamentRegistrationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/owner/tournament-registrations")
@RequiredArgsConstructor
public class OwnerTournamentRegistrationController {

    private final TournamentRegistrationService registrationService;

    @GetMapping
    public List<TournamentRegistrationResponse> listMine(Authentication authentication) {
        return registrationService.listOwnerRegistrations(authentication.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TournamentRegistrationResponse create(
            Authentication authentication,
            @Valid @RequestBody TournamentRegistrationRequest request
    ) {
        return registrationService.create(authentication.getName(), request);
    }

    @PostMapping("/{id}/withdraw")
    public TournamentRegistrationResponse withdraw(@PathVariable Long id, Authentication authentication) {
        return registrationService.withdraw(authentication.getName(), id);
    }
}
