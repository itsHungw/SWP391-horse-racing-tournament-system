package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.RoleRequest;
import java.time.LocalDateTime;
import com.example.horseracingtournamentsystem.user.enums.RoleRequestStatus;

public record AdminRoleRequestResponse(
        Long id,
        Long userId,
        String fullName,
        String email,
        String requestedRole,
        RoleRequestStatus status,
        String cvReviewStatus,
        String reason,
        String resumeUrl,
        String adminNote,
        String cvReviewNote,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt,
        LocalDateTime cvReviewedAt,
        AdminRoleRequestReviewerResponse reviewedBy,
        AdminRoleRequestReviewerResponse cvReviewedBy,
        AdminRoleRequestUserResponse user
) {
    public static AdminRoleRequestResponse from(RoleRequest request) {
        return new AdminRoleRequestResponse(
                request.getId(),
                request.getUser().getId(),
                request.getUser().getFullName(),
                request.getUser().getEmail(),
                request.getRequestedRole(),
                request.getStatus(),
                request.getCvReviewStatus(),
                request.getReason(),
                request.getResumeUrl(),
                request.getAdminNote(),
                request.getCvReviewNote(),
                request.getCreatedAt(),
                request.getReviewedAt(),
                request.getCvReviewedAt(),
                AdminRoleRequestReviewerResponse.from(request.getReviewedBy()),
                AdminRoleRequestReviewerResponse.from(request.getCvReviewedBy()),
                AdminRoleRequestUserResponse.from(request.getUser())
        );
    }
}
