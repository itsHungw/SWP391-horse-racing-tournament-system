package com.example.horseracingtournamentsystem.point.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_point_accounts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserPointAccount {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "point_balance", nullable = false)
    private int pointBalance;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static UserPointAccount create(User user) {
        UserPointAccount account = new UserPointAccount();
        account.user = user;
        account.pointBalance = 0;
        account.updatedAt = LocalDateTime.now();
        return account;
    }

    public void addPoints(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Point amount must be greater than 0.");
        }
        adjustPoints(amount);
    }

    public void adjustPoints(int amount) {
        int newBalance = this.pointBalance + amount;
        if (newBalance < 0) {
            throw new IllegalArgumentException("Insufficient virtual points balance (has: " + this.pointBalance + ", attempted: " + amount + ")");
        }
        this.pointBalance = newBalance;
        this.updatedAt = LocalDateTime.now();
    }
}
