package com.example.horseracingtournamentsystem.organization.service;

import com.example.horseracingtournamentsystem.organization.dto.request.RegisterOrganizationRequest;
import com.example.horseracingtournamentsystem.organization.dto.response.OrganizationResponse;
import com.example.horseracingtournamentsystem.organization.entity.Organization;
import com.example.horseracingtournamentsystem.organization.repository.OrganizationRepository;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrganizationService {

    private static final String ORGANIZER_ROLE = "ORGANIZER";

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    @Transactional
    public OrganizationResponse register(String email, RegisterOrganizationRequest request) {
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        Organization existing = organizationRepository.findByOwner_EmailAndDeletedAtIsNull(email).orElse(null);
        if (existing != null && !Organization.STATUS_REJECTED.equals(existing.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You already have an organization application or account");
        }

        // Resubmit after a rejection: reuse the same record so the DB stays clean (KYB resubmit loop).
        if (existing != null) {
            existing.resubmit(
                    request.name().trim(),
                    request.licenseNumber().trim(),
                    request.contactEmail().trim(),
                    normalize(request.contactPhone()),
                    normalize(request.description()),
                    normalize(request.evidenceUrl()),
                    normalize(request.logoUrl()),
                    request.applicationNote().trim()
            );
            return OrganizationResponse.from(organizationRepository.save(existing));
        }

        String code = "ORG_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Organization organization = Organization.application(
                owner,
                code,
                request.name().trim(),
                request.licenseNumber().trim(),
                request.contactEmail().trim(),
                normalize(request.contactPhone()),
                normalize(request.description()),
                normalize(request.evidenceUrl()),
                normalize(request.logoUrl()),
                request.applicationNote().trim()
        );
        return OrganizationResponse.from(organizationRepository.save(organization));
    }

    public OrganizationResponse getMine(String email) {
        return organizationRepository.findByOwner_EmailAndDeletedAtIsNull(email.trim().toLowerCase())
                .map(OrganizationResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No organization found"));
    }

    public List<OrganizationResponse> listForAdmin(String status) {
        List<Organization> organizations = (status == null || status.isBlank())
                ? organizationRepository.findAllByOrderByCreatedAtDesc()
                : organizationRepository.findAllByStatusOrderByCreatedAtDesc(status.trim().toUpperCase());
        return organizations.stream().map(OrganizationResponse::from).toList();
    }

    @Transactional
    public OrganizationResponse approve(Long id, String adminEmail) {
        Organization organization = getOrganization(id);
        User reviewer = getReviewer(adminEmail);
        organization.approve(reviewer);
        grantOrganizerRole(organization.getOwner(), reviewer);
        return OrganizationResponse.from(organizationRepository.save(organization));
    }

    @Transactional
    public OrganizationResponse reject(Long id, String adminEmail, String reason) {
        Organization organization = getOrganization(id);
        User reviewer = getReviewer(adminEmail);
        organization.reject(reviewer, reason == null ? null : reason.trim());
        return OrganizationResponse.from(organizationRepository.save(organization));
    }

    @Transactional
    public OrganizationResponse suspend(Long id) {
        Organization organization = getOrganization(id);
        organization.suspend();
        return OrganizationResponse.from(organizationRepository.save(organization));
    }

    @Transactional
    public OrganizationResponse reactivate(Long id) {
        Organization organization = getOrganization(id);
        organization.reactivate();
        return OrganizationResponse.from(organizationRepository.save(organization));
    }

    private void grantOrganizerRole(User owner, User reviewer) {
        Role role = roleRepository.findByName(ORGANIZER_ROLE).orElse(null);
        if (role == null) {
            return;
        }
        boolean alreadyAssigned = userRoleRepository
                .findByUserIdAndStatus(owner.getId(), com.example.horseracingtournamentsystem.user.enums.UserRoleStatus.ACTIVE)
                .stream()
                .anyMatch(userRole -> userRole.getRole().getName().equals(ORGANIZER_ROLE));
        if (!alreadyAssigned) {
            userRoleRepository.save(UserRole.active(owner, role, reviewer));
        }
    }

    private Organization getOrganization(Long id) {
        return organizationRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found"));
    }

    private User getReviewer(String adminEmail) {
        return userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Reviewer not found"));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
