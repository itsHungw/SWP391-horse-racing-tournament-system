package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.UserRoleHistory;
import java.time.LocalDateTime;

public record UserRoleHistoryResponse(
    Long id,
    String roleName,
    String oldStatus,
    String newStatus,
    LocalDateTime changedAt,
    String reason,
    ChangedByInfo changedBy
) {
    public record ChangedByInfo(
        Long id,
        String fullName,
        String email
    ) {}

    public static UserRoleHistoryResponse from(UserRoleHistory history) {
        ChangedByInfo adminInfo = null;
        if (history.getChangedBy() != null) {
            adminInfo = new ChangedByInfo(
                history.getChangedBy().getId(),
                history.getChangedBy().getFullName(),
                history.getChangedBy().getEmail()
            );
        }

        String role = history.getUserRole() != null && history.getUserRole().getRole() != null 
            ? history.getUserRole().getRole().getName() 
            : "UNKNOWN";

        return new UserRoleHistoryResponse(
            history.getId(),
            role,
            history.getOldStatus() == null ? null : history.getOldStatus().name(),
            history.getNewStatus() == null ? null : history.getNewStatus().name(),
            history.getChangedAt(),
            history.getReason(),
            adminInfo
        );
    }
}
