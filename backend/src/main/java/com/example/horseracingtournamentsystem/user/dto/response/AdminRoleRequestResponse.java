package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.RoleRequest;
import java.time.LocalDateTime;

public record AdminRoleRequestResponse(
        Long id,
        Long userId,
        String fullName,
        String email,
        String requestedRole,
        String status,
        String reason,
        String evidenceUrl,
        String adminNote,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt,
        AdminRoleRequestReviewerResponse reviewedBy,
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
                request.getReason(),
                request.getEvidenceUrl(),
                request.getAdminNote(),
                request.getCreatedAt(),
                request.getReviewedAt(),
                AdminRoleRequestReviewerResponse.from(request.getReviewedBy()),
                AdminRoleRequestUserResponse.from(request.getUser())
        );
    }
}
