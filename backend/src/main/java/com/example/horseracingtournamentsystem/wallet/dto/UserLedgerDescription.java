package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;

/**
 * Mô tả bút toán ở góc nhìn chủ ví.
 *
 * <p>Bút toán {@code ADMIN_ADJUSTMENT} mang lý do kiểm toán do admin nhập; lý do đó chỉ được
 * lộ ở các endpoint admin. Mọi DTO trả về cho chính chủ ví phải đi qua đây — đó là lý do hàm
 * này tồn tại thay vì lặp lại điều kiện ở từng DTO, vì một chỗ quên là rò lý do nội bộ.
 */
final class UserLedgerDescription {

    private UserLedgerDescription() {
    }

    static String of(WalletTransaction transaction) {
        return transaction.getTransactionType() == WalletTransactionType.ADMIN_ADJUSTMENT
                ? "Admin transferred money"
                : transaction.getDescription();
    }
}
