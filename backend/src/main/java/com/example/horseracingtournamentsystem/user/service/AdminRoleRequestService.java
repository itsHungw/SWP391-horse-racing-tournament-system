package com.example.horseracingtournamentsystem.user.service;

import com.example.horseracingtournamentsystem.user.dto.response.AdminRoleRequestResponse;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.RoleRequest;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.RoleRequestRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.example.horseracingtournamentsystem.user.enums.RoleRequestStatus;

@Service
@RequiredArgsConstructor
public class AdminRoleRequestService {

    private final RoleRequestRepository roleRequestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final com.example.horseracingtournamentsystem.notification.service.NotificationService notificationService;


    @Transactional(readOnly = true)
    public List<AdminRoleRequestResponse> list(RoleRequestStatus status) {
        List<RoleRequest> requests = status == null
                ? roleRequestRepository.findAllByOrderByCreatedAtDesc()
                : roleRequestRepository.findByStatusOrderByCreatedAtDesc(status);

        return requests.stream()
                .map(AdminRoleRequestResponse::from)
                .toList();
    }

    @Transactional
    public AdminRoleRequestResponse approve(Long requestId, String reviewerEmail, String adminNote) {
        RoleRequest request = getRequest(requestId);
        User reviewer = getReviewer(reviewerEmail);
        if (UserRolePolicy.isPersonalRole(request.getRequestedRole())
                && UserRolePolicy.hasActiveBusinessRole(request.getUser())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Organizer accounts cannot request personal participation roles");
        }

        request.approve(reviewer, normalizeNote(adminNote, "Approved by admin."));
        assignRequestedRoleIfAvailable(request, reviewer);
        
        notificationService.notify(
                request.getUser(),
                "ROLE_APPROVED",
                "Role request approved",
                "Your request to become a " + request.getRequestedRole() + " was approved.",
                "ROLE_REQUEST",
                request.getId()
        );
        
        return AdminRoleRequestResponse.from(roleRequestRepository.save(request));
    }

    @Transactional
    public AdminRoleRequestResponse passCvReview(Long requestId, String reviewerEmail, String cvReviewNote) {
        RoleRequest request = getRequest(requestId);
        if (RoleRequestStatus.PENDING != request.getStatus()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending requests can pass CV screening");
        }

        User reviewer = getReviewer(reviewerEmail);
        request.passCvReview(reviewer, normalizeNote(cvReviewNote, "CV passed screening."));
        return AdminRoleRequestResponse.from(roleRequestRepository.save(request));
    }

    @Transactional
    public AdminRoleRequestResponse reject(Long requestId, String reviewerEmail, String reason) {
        RoleRequest request = getRequest(requestId);
        User reviewer = getReviewer(reviewerEmail);
        request.reject(reviewer, reason.trim());
        
        notificationService.notify(
                request.getUser(),
                "ROLE_REJECTED",
                "Role request rejected",
                "Your request to become a " + request.getRequestedRole() + " was rejected: " + reason.trim(),
                "ROLE_REQUEST",
                request.getId()
        );
        
        return AdminRoleRequestResponse.from(roleRequestRepository.save(request));
    }

    private RoleRequest getRequest(Long requestId) {
        return roleRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role request not found"));
    }

    private User getReviewer(String reviewerEmail) {
        return userRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Reviewer not found"));
    }

    private String normalizeNote(String adminNote, String fallback) {
        if (adminNote == null || adminNote.isBlank()) {
            return fallback;
        }
        return adminNote.trim();
    }

    private void assignRequestedRoleIfAvailable(RoleRequest request, User reviewer) {
        Role role = roleRepository.findByName(request.getRequestedRole()).orElse(null);
        if (role == null) {
            return;
        }

        boolean alreadyAssigned = userRoleRepository
                .findByUserIdAndStatus(request.getUser().getId(), com.example.horseracingtournamentsystem.user.enums.UserRoleStatus.ACTIVE)
                .stream()
                .anyMatch(userRole -> userRole.getRole().getName().equals(request.getRequestedRole()));

        if (!alreadyAssigned) {
            userRoleRepository.save(UserRole.active(request.getUser(), role, reviewer));
        }
    }
}
