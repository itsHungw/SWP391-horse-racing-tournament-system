package com.example.horseracingtournamentsystem.organization.controller;

import com.example.horseracingtournamentsystem.organization.dto.request.RegisterOrganizationRequest;
import com.example.horseracingtournamentsystem.organization.dto.response.OrganizationResponse;
import com.example.horseracingtournamentsystem.organization.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Self-service đăng ký Ban tổ chức (Cổng 1). Mở cho mọi user đã đăng nhập —
 * vì người nộp chưa có role ORGANIZER. Admin duyệt qua AdminOrganizationController.
 */
@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "02 · Organizer onboarding (KYB)", description = "A user submits a business profile to become an Organizer.")
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrganizationResponse register(
            Authentication authentication,
            @Valid @RequestBody RegisterOrganizationRequest request
    ) {
        return organizationService.register(authentication.getName(), request);
    }

    @GetMapping("/my")
    public OrganizationResponse getMine(Authentication authentication) {
        return organizationService.getMine(authentication.getName());
    }
}
