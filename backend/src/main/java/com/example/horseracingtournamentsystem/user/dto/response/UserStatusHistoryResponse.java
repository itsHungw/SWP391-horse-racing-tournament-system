package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.UserStatusHistory;
import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import java.time.LocalDateTime;

public record UserStatusHistoryResponse(
        Long id,
        UserStatus oldStatus,
        UserStatus newStatus,
        String publicReason,
        String internalNote,
        Long changedById,
        String changedByName,
        LocalDateTime changedAt,
        boolean walletLocked
) {
    public static UserStatusHistoryResponse from(UserStatusHistory history) {
        return new UserStatusHistoryResponse(
                history.getId(), history.getOldStatus(), history.getNewStatus(),
                history.getPublicReason(), history.getInternalNote(),
                history.getChangedBy().getId(), history.getChangedBy().getFullName(),
                history.getChangedAt(), history.isWalletLocked());
    }
}
