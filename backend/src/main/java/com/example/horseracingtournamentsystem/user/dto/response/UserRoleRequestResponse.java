package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.RoleRequest;
import java.time.LocalDateTime;
import com.example.horseracingtournamentsystem.user.enums.RoleRequestStatus;

public record UserRoleRequestResponse(
        Long id,
        Long userId,
        String userEmail,
        String requestedRole,
        RoleRequestStatus status,
        String cvReviewStatus,
        String reason,
        String rejectReason,
        String resumeUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static UserRoleRequestResponse from(RoleRequest request) {
        return new UserRoleRequestResponse(
                request.getId(),
                request.getUser().getId(),
                request.getUser().getEmail(),
                request.getRequestedRole(),
                request.getStatus(),
                request.getCvReviewStatus(),
                request.getReason(),
                com.example.horseracingtournamentsystem.user.enums.RoleRequestStatus.REJECTED.equals(request.getStatus()) ? request.getAdminNote() : null,
                request.getResumeUrl(),
                request.getCreatedAt(),
                request.getUpdatedAt()
        );
    }
}
