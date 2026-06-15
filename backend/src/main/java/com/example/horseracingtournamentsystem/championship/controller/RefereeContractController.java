package com.example.horseracingtournamentsystem.championship.controller;

import com.example.horseracingtournamentsystem.championship.dto.request.RefereeContractActionRequest;
import com.example.horseracingtournamentsystem.championship.dto.response.RefereeContractResponse;
import com.example.horseracingtournamentsystem.championship.service.RefereeContractService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Referee-side hợp đồng: xem lời mời, đồng ý / từ chối.
 * Prefix /api/v1/referee/** -> hasRole('REFEREE') trong SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1/referee/contracts")
@PreAuthorize("hasRole('REFEREE')")
@RequiredArgsConstructor
public class RefereeContractController {

    private final RefereeContractService refereeContractService;

    @GetMapping
    public List<RefereeContractResponse> listMine(Authentication authentication) {
        return refereeContractService.listMine(authentication.getName());
    }

    @PostMapping("/{contractId}/accept")
    public RefereeContractResponse accept(@PathVariable Long contractId, Authentication authentication) {
        return refereeContractService.accept(contractId, authentication.getName());
    }

    @PostMapping("/{contractId}/decline")
    public RefereeContractResponse decline(
            @PathVariable Long contractId,
            Authentication authentication,
            @RequestBody(required = false) RefereeContractActionRequest request
    ) {
        return refereeContractService.decline(
                contractId, authentication.getName(), request == null ? null : request.reason());
    }
}
