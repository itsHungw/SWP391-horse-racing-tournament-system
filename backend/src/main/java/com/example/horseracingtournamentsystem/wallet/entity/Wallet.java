package com.example.horseracingtournamentsystem.wallet.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

/**
 * Ví tiền thật (VND) của user — sổ cái số dư. Mỗi user đúng 1 ví.
 * Số dư lưu số nguyên đồng ({@code long}); guard không-âm trong {@link #adjust(long)}.
 */
@Entity
@Table(name = "wallets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Wallet {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "balance", nullable = false)
    private long balance;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private WalletStatus status;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static Wallet create(User user) {
        Wallet wallet = new Wallet();
        wallet.user = user;
        wallet.balance = 0L;
        wallet.status = WalletStatus.ACTIVE;
        wallet.updatedAt = LocalDateTime.now();
        return wallet;
    }

    /** Cộng tiền (amount > 0). Dùng cho khởi tạo số dư. */
    public void add(long amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0.");
        }
        adjust(amount);
    }

    /** Cộng/trừ tiền với guard không-âm. */
    public void adjust(long amount) {
        long newBalance = this.balance + amount;
        if (newBalance < 0) {
            throw new IllegalArgumentException(
                    "Insufficient wallet balance (has: " + this.balance + ", attempted: " + amount + ")");
        }
        this.balance = newBalance;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isLocked() {
        return status == WalletStatus.LOCKED;
    }

    public void lock() {
        this.status = WalletStatus.LOCKED;
        this.updatedAt = LocalDateTime.now();
    }

    public void unlock() {
        this.status = WalletStatus.ACTIVE;
        this.updatedAt = LocalDateTime.now();
    }
}
