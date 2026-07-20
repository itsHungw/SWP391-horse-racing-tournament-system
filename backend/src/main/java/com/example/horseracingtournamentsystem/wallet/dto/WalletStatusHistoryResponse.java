package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.wallet.entity.WalletStatus;
import com.example.horseracingtournamentsystem.wallet.entity.WalletStatusHistory;
import java.time.LocalDateTime;

public record WalletStatusHistoryResponse(
        Long id,
        WalletStatus oldStatus,
        WalletStatus newStatus,
        String publicReason,
        String internalNote,
        Long changedById,
        String changedByName,
        LocalDateTime changedAt
) {
    public static WalletStatusHistoryResponse from(WalletStatusHistory history) {
        return new WalletStatusHistoryResponse(
                history.getId(), history.getOldStatus(), history.getNewStatus(),
                history.getPublicReason(), history.getInternalNote(),
                history.getChangedBy().getId(), history.getChangedBy().getFullName(), history.getChangedAt());
    }
}
