package com.example.horseracingtournamentsystem.championship.controller;

import com.example.horseracingtournamentsystem.championship.dto.request.InviteRefereeRequest;
import com.example.horseracingtournamentsystem.championship.dto.request.RefereeContractActionRequest;
import com.example.horseracingtournamentsystem.championship.dto.response.RefereeContractResponse;
import com.example.horseracingtournamentsystem.championship.service.RefereeContractService;
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

/**
 * Organizer-side referee hiring. Bảo vệ bằng prefix /api/v1/organizer/** -> hasRole('ORGANIZER').
 * Service kiểm tra thêm: user phải là chủ tổ chức sở hữu giải.
 */
@RestController
@RequestMapping("/api/v1/organizer")
@RequiredArgsConstructor
public class OrganizerRefereeContractController {

    private final RefereeContractService refereeContractService;

    @PostMapping("/tournaments/{tournamentId}/referee-contracts")
    @ResponseStatus(HttpStatus.CREATED)
    public RefereeContractResponse invite(
            @PathVariable Long tournamentId,
            Authentication authentication,
            @Valid @RequestBody InviteRefereeRequest request
    ) {
        return refereeContractService.invite(authentication.getName(), tournamentId, request);
    }

    @GetMapping("/tournaments/{tournamentId}/referee-contracts")
    public List<RefereeContractResponse> listForTournament(
            @PathVariable Long tournamentId,
            Authentication authentication
    ) {
        return refereeContractService.listForTournament(authentication.getName(), tournamentId);
    }

    @PostMapping("/referee-contracts/{contractId}/terminate")
    public RefereeContractResponse terminate(
            @PathVariable Long contractId,
            Authentication authentication,
            @RequestBody(required = false) RefereeContractActionRequest request
    ) {
        return refereeContractService.terminate(
                contractId, authentication.getName(), request == null ? null : request.reason());
    }
}
