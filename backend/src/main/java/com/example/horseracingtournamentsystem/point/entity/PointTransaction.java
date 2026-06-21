package com.example.horseracingtournamentsystem.point.entity;

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

@Entity
@Table(name = "point_transactions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PointTransaction {

    public static final String REF_RACE_PREDICTION = "RACE_PREDICTION";
    public static final String REF_STREAK_PREDICTION = "STREAK_PREDICTION";
    public static final String REF_RACE_RESULT = "RACE_RESULT";
    public static final String REF_BLOG = "BLOG";
    public static final String REF_ADMIN = "ADMIN";
    public static final String REF_RACE = "RACE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "amount", nullable = false)
    private int amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 50)
    private PointTransactionType transactionType;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static PointTransaction create(
            User user,
            int amount,
            PointTransactionType transactionType,
            String referenceType,
            Long referenceId,
            String description
    ) {
        PointTransaction transaction = new PointTransaction();
        transaction.user = user;
        transaction.amount = amount;
        transaction.transactionType = transactionType;
        transaction.referenceType = referenceType;
        transaction.referenceId = referenceId;
        transaction.description = description;
        transaction.createdAt = LocalDateTime.now();
        return transaction;
    }
}
