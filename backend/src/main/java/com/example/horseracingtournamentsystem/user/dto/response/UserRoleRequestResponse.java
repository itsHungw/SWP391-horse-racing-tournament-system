package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.RoleRequest;
import java.time.LocalDateTime;

public record UserRoleRequestResponse(
        Long id,
        Long userId,
        String userEmail,
        String requestedRole,
        String status,
        String reason,
        String rejectReason,
        String evidenceUrl,
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
                request.getReason(),
                RoleRequest.STATUS_REJECTED.equals(request.getStatus()) ? request.getAdminNote() : null,
                request.getEvidenceUrl(),
                request.getCreatedAt(),
                request.getUpdatedAt()
        );
    }
}
