package com.example.horseracingtournamentsystem.points.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "point_transactions")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PointTransaction {

    public static final String TX_PREDICTION_ENTRY = "PREDICTION_ENTRY";
    public static final String TX_PREDICTION_REWARD = "PREDICTION_REWARD";
    public static final String TX_BLOG_REWARD = "BLOG_REWARD";
    public static final String TX_RACE_CANCEL_REFUND = "RACE_CANCEL_REFUND";
    public static final String TX_ADMIN_ADJUSTMENT = "ADMIN_ADJUSTMENT";

    public static final String REF_RACE_PREDICTION = "RACE_PREDICTION";
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
    private Integer amount;

    @Column(name = "transaction_type", nullable = false, length = 50)
    private String transactionType;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static PointTransaction create(User user, int amount, String transactionType, String referenceType, Long referenceId, String description) {
        PointTransaction tx = new PointTransaction();
        tx.setUser(user);
        tx.setAmount(amount);
        tx.setTransactionType(transactionType);
        tx.setReferenceType(referenceType);
        tx.setReferenceId(referenceId);
        tx.setDescription(description);
        tx.setCreatedAt(LocalDateTime.now());
        return tx;
    }
}
