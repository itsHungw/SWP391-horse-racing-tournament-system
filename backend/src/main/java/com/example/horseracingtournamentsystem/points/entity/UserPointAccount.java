package com.example.horseracingtournamentsystem.points.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_point_accounts")
@Getter
@Setter
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
    private Integer pointBalance = 0;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static UserPointAccount create(User user, int initialBalance) {
        UserPointAccount account = new UserPointAccount();
        account.setUser(user);
        account.setPointBalance(initialBalance);
        account.setUpdatedAt(LocalDateTime.now());
        return account;
    }
}
