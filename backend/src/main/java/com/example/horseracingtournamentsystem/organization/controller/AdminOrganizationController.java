package com.example.horseracingtournamentsystem.organization.controller;

import com.example.horseracingtournamentsystem.organization.dto.request.RejectOrganizationRequest;
import com.example.horseracingtournamentsystem.organization.dto.response.OrganizationResponse;
import com.example.horseracingtournamentsystem.organization.service.OrganizationService;
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
 * Cổng 1 — Admin xét duyệt / đình chỉ Ban tổ chức.
 * Bảo vệ bằng prefix /api/v1/admin/** -> hasRole('ADMIN') trong SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1/admin/organizations")
@RequiredArgsConstructor
public class AdminOrganizationController {

    private final OrganizationService organizationService;

    @GetMapping
    public List<OrganizationResponse> list(@RequestParam(required = false) String status) {
        return organizationService.listForAdmin(status);
    }

    @PostMapping("/{id}/approve")
    public OrganizationResponse approve(@PathVariable Long id, Authentication authentication) {
        return organizationService.approve(id, authentication.getName());
    }

    @PostMapping("/{id}/reject")
    public OrganizationResponse reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectOrganizationRequest request,
            Authentication authentication
    ) {
        return organizationService.reject(id, authentication.getName(), request.reason());
    }

    @PostMapping("/{id}/suspend")
    public OrganizationResponse suspend(@PathVariable Long id) {
        return organizationService.suspend(id);
    }

    @PostMapping("/{id}/reactivate")
    public OrganizationResponse reactivate(@PathVariable Long id) {
        return organizationService.reactivate(id);
    }
}
