package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.wallet.entity.TopUpOrder;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import java.time.LocalDateTime;

/** Chi tiết một bút toán cho chính chủ ví, kèm dữ liệu VNPay nếu đó là bút toán nạp tiền. */
public record WalletTransactionDetailResponse(
        Long id,
        long amount,
        String type,
        String referenceType,
        Long referenceId,
        Long balanceAfter,
        String description,
        LocalDateTime createdAt,
        TopUpDetail topUp
) {

    /** Chỉ có ở bút toán TOPUP khớp được đơn nạp; null với mọi loại còn lại. */
    public record TopUpDetail(
            String txnRef,
            String transactionNo,
            String bankCode,
            String bankTranNo,
            String cardType,
            /** Thời điểm VNPay ghi nhận thanh toán. Null với đơn nạp cũ hơn migration V39. */
            LocalDateTime paidAt
    ) {
    }

    public static WalletTransactionDetailResponse of(WalletTransaction transaction, TopUpOrder order) {
        return new WalletTransactionDetailResponse(
                transaction.getId(),
                transaction.getAmount(),
                transaction.getTransactionType().name(),
                transaction.getReferenceType(),
                transaction.getReferenceId(),
                transaction.getBalanceAfter(),
                UserLedgerDescription.of(transaction),
                transaction.getCreatedAt(),
                order == null ? null : new TopUpDetail(
                        order.getVnpayTxnRef(),
                        order.getVnpayTransactionNo(),
                        order.getVnpayBankCode(),
                        order.getVnpayBankTranNo(),
                        order.getVnpayCardType(),
                        order.getVnpayPayDate()
                )
        );
    }
}
