package com.example.horseracingtournamentsystem.wallet.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Bút toán ví — sổ cái append-only. Idempotency được DB ép buộc qua UNIQUE index
 * {@code (reference_type, reference_id, transaction_type)} (xem migration V12).
 * {@code balanceAfter} ghi lại số dư ngay sau bút toán để audit.
 */
@Entity
@Table(name = "wallet_transactions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalletTransaction {

    public static final String REF_RACE_PREDICTION = "RACE_PREDICTION";
    public static final String REF_STREAK_PREDICTION = "STREAK_PREDICTION";
    public static final String REF_TOPUP_ORDER = "TOPUP_ORDER";
    public static final String REF_WITHDRAWAL = "WITHDRAWAL";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "amount", nullable = false)
    private long amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 50)
    private WalletTransactionType transactionType;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "balance_after")
    private Long balanceAfter;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static WalletTransaction create(
            User user,
            long amount,
            WalletTransactionType transactionType,
            String referenceType,
            Long referenceId,
            String description,
            Long balanceAfter
    ) {
        WalletTransaction transaction = new WalletTransaction();
        transaction.user = user;
        transaction.amount = amount;
        transaction.transactionType = transactionType;
        transaction.referenceType = referenceType;
        transaction.referenceId = referenceId;
        transaction.description = description;
        transaction.balanceAfter = balanceAfter;
        transaction.createdAt = LocalDateTime.now();
        return transaction;
    }
}
