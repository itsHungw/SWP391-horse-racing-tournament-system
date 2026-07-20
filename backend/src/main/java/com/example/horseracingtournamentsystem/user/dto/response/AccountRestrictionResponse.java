package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import com.example.horseracingtournamentsystem.wallet.entity.WalletStatus;
import java.time.LocalDateTime;

public record AccountRestrictionResponse(
        UserStatus accountStatus,
        String publicReason,
        LocalDateTime effectiveAt,
        WalletStatus walletStatus
) {}
