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

@Service
@RequiredArgsConstructor
public class AdminRoleRequestService {

    private final RoleRequestRepository roleRequestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    @Transactional(readOnly = true)
    public List<AdminRoleRequestResponse> list(String status) {
        List<RoleRequest> requests = status == null || status.isBlank()
                ? roleRequestRepository.findAllByOrderByCreatedAtDesc()
                : roleRequestRepository.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase());

        return requests.stream()
                .map(AdminRoleRequestResponse::from)
                .toList();
    }

    @Transactional
    public AdminRoleRequestResponse approve(Long requestId, String reviewerEmail, String adminNote) {
        RoleRequest request = getRequest(requestId);
        User reviewer = getReviewer(reviewerEmail);
        request.approve(reviewer, normalizeNote(adminNote, "Approved by admin."));
        assignRequestedRoleIfAvailable(request, reviewer);
        return AdminRoleRequestResponse.from(roleRequestRepository.save(request));
    }

    @Transactional
    public AdminRoleRequestResponse reject(Long requestId, String reviewerEmail, String reason) {
        RoleRequest request = getRequest(requestId);
        User reviewer = getReviewer(reviewerEmail);
        request.reject(reviewer, reason.trim());
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
                .findByUserIdAndStatus(request.getUser().getId(), UserRole.STATUS_ACTIVE)
                .stream()
                .anyMatch(userRole -> userRole.getRole().getName().equals(request.getRequestedRole()));

        if (!alreadyAssigned) {
            userRoleRepository.save(UserRole.active(request.getUser(), role, reviewer));
        }
    }
}
