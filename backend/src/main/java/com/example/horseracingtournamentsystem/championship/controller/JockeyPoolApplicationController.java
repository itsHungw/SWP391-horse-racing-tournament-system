package com.example.horseracingtournamentsystem.championship.controller;

import com.example.horseracingtournamentsystem.championship.dto.request.JockeyPoolApplicationRequest;
import com.example.horseracingtournamentsystem.championship.dto.request.RejectJockeyPoolApplicationRequest;
import com.example.horseracingtournamentsystem.championship.dto.response.JockeyChampionshipResponse;
import com.example.horseracingtournamentsystem.championship.dto.response.JockeyPoolApplicationResponse;
import com.example.horseracingtournamentsystem.championship.service.JockeyPoolApplicationService;
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
@RequiredArgsConstructor
public class JockeyPoolApplicationController {

    private final JockeyPoolApplicationService applicationService;

    @GetMapping("/api/v1/jockey/championships")
    public List<JockeyChampionshipResponse> listChampionshipsForJockey(Authentication authentication) {
        return applicationService.listChampionshipsForJockey(authentication.getName());
    }

    @GetMapping("/api/v1/jockey/championships/applications")
    public List<JockeyPoolApplicationResponse> listOwnApplications(Authentication authentication) {
        return applicationService.listOwnApplications(authentication.getName());
    }

    @PostMapping("/api/v1/jockey/championships/{championshipId}/pool-applications")
    public JockeyPoolApplicationResponse apply(
            @PathVariable Long championshipId,
            Authentication authentication,
            @Valid @RequestBody JockeyPoolApplicationRequest request
    ) {
        return applicationService.apply(championshipId, authentication.getName(), request.message());
    }

    @PostMapping("/api/v1/jockey/championships/{championshipId}/pool-applications/{applicationId}/withdraw")
    public JockeyPoolApplicationResponse withdraw(
            @PathVariable Long championshipId,
            @PathVariable Long applicationId,
            Authentication authentication
    ) {
        return applicationService.withdraw(championshipId, applicationId, authentication.getName());
    }

    @GetMapping("/api/v1/admin/championships/{championshipId}/jockey-pool-applications")
    public List<JockeyPoolApplicationResponse> listForAdmin(
            @PathVariable Long championshipId,
            @RequestParam(required = false) String status
    ) {
        return applicationService.listForAdmin(championshipId, status);
    }

    @PostMapping("/api/v1/admin/championships/{championshipId}/jockey-pool-applications/{applicationId}/approve")
    public JockeyPoolApplicationResponse approve(
            @PathVariable Long championshipId,
            @PathVariable Long applicationId,
            Authentication authentication
    ) {
        return applicationService.approve(championshipId, applicationId, authentication.getName());
    }

    @PostMapping("/api/v1/admin/championships/{championshipId}/jockey-pool-applications/{applicationId}/reject")
    public JockeyPoolApplicationResponse reject(
            @PathVariable Long championshipId,
            @PathVariable Long applicationId,
            Authentication authentication,
            @Valid @RequestBody RejectJockeyPoolApplicationRequest request
    ) {
        return applicationService.reject(championshipId, applicationId, authentication.getName(), request.reason());
    }

    @GetMapping("/api/v1/owner/championships/{championshipId}/jockey-pool")
    public List<JockeyPoolApplicationResponse> listApprovedPoolForOwner(@PathVariable Long championshipId) {
        return applicationService.listApprovedPoolForOwner(championshipId);
    }
}
