package com.example.horseracingtournamentsystem.championship.controller;

import com.example.horseracingtournamentsystem.championship.dto.request.OwnerContractRequest;
import com.example.horseracingtournamentsystem.championship.dto.request.RejectJockeyContractRequest;
import com.example.horseracingtournamentsystem.championship.dto.response.JockeyInvitationResponse;
import com.example.horseracingtournamentsystem.championship.dto.response.LockParticipantsResponse;
import com.example.horseracingtournamentsystem.championship.dto.response.TournamentParticipantResponse;
import com.example.horseracingtournamentsystem.championship.service.JockeyInvitationContractService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "11 · Owner & Jockey · Jockey contracts", description = "Owner contracts an approved jockey for a horse; jockey accepts/declines.")
public class JockeyInvitationContractController {

    private final JockeyInvitationContractService contractService;

    @PostMapping("/api/v1/owner/championships/{championshipId}/contracts")
    public ResponseEntity<JockeyInvitationResponse> sendContract(
            @PathVariable Long championshipId,
            Authentication authentication,
            @Valid @RequestBody OwnerContractRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contractService.sendContract(championshipId, authentication.getName(), request));
    }

    @GetMapping("/api/v1/owner/championships/{championshipId}/contracts")
    public List<JockeyInvitationResponse> listOwnerContracts(
            @PathVariable Long championshipId,
            Authentication authentication
    ) {
        return contractService.listOwnerContracts(championshipId, authentication.getName());
    }

    @GetMapping("/api/v1/jockey/contracts")
    public List<JockeyInvitationResponse> listJockeyContracts(Authentication authentication) {
        return contractService.listJockeyContracts(authentication.getName());
    }

    @GetMapping("/api/v1/jockey/participants")
    public List<TournamentParticipantResponse> listJockeyParticipants(Authentication authentication) {
        return contractService.listJockeyParticipants(authentication.getName());
    }

    @PostMapping("/api/v1/jockey/contracts/{contractId}/accept")
    public JockeyInvitationResponse acceptContract(
            @PathVariable Long contractId,
            Authentication authentication
    ) {
        return contractService.acceptContract(contractId, authentication.getName());
    }

    @PostMapping("/api/v1/jockey/contracts/{contractId}/reject")
    public JockeyInvitationResponse rejectContract(
            @PathVariable Long contractId,
            Authentication authentication,
            @Valid @RequestBody RejectJockeyContractRequest request
    ) {
        return contractService.rejectContract(contractId, authentication.getName(), request);
    }

    @PostMapping("/api/v1/admin/championships/{championshipId}/lock-participants")
    public LockParticipantsResponse lockParticipants(@PathVariable Long championshipId) {
        return contractService.lockParticipants(championshipId);
    }

    @PostMapping("/api/v1/admin/championships/{championshipId}/unlock-participants")
    public void unlockParticipants(@PathVariable Long championshipId) {
        contractService.unlockParticipants(championshipId);
    }

    @GetMapping("/api/v1/admin/championships/{championshipId}/participants")
    public List<TournamentParticipantResponse> listParticipants(@PathVariable Long championshipId) {
        return contractService.listParticipants(championshipId);
    }
}
