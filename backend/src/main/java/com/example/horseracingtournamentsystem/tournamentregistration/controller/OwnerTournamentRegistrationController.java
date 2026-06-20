package com.example.horseracingtournamentsystem.tournamentregistration.controller;

import com.example.horseracingtournamentsystem.tournamentregistration.dto.request.TournamentRegistrationRequest;
import com.example.horseracingtournamentsystem.tournamentregistration.dto.response.TournamentRegistrationResponse;
import com.example.horseracingtournamentsystem.tournamentregistration.service.TournamentRegistrationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/owner/tournament-registrations")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "07 · Owner · Horse registration", description = "Owner enters an approved horse into an open tournament.")
public class OwnerTournamentRegistrationController {

    private final TournamentRegistrationService registrationService;

    @GetMapping
    public List<TournamentRegistrationResponse> listMine(Authentication authentication) {
        return registrationService.listOwnerRegistrations(authentication.getName());
    }

    @GetMapping(params = {"page", "size"})
    public Page<TournamentRegistrationResponse> listMinePage(
            Authentication authentication,
            Pageable pageable,
            @RequestParam(required = false) Long horseId,
            @RequestParam(required = false) Long focusId
    ) {
        return registrationService.listOwnerRegistrations(
                authentication.getName(),
                horseId,
                focusId,
                ownerPageable(pageable)
        );
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

    private Pageable ownerPageable(Pageable pageable) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(Math.max(1, pageable.getPageSize()), 50);
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"));
        return PageRequest.of(page, size, sort);
    }
}
