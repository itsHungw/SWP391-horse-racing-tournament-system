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
import jakarta.persistence.Version;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Yêu cầu rút tiền. Khi tạo (REQUESTED) tiền đã bị HOLD (trừ khỏi số dư) để chống rút 2 lần;
 * REJECTED hoàn lại, PAID tất toán (không đụng ledger thêm). State machine có guard.
 */
@Entity
@Table(name = "withdrawal_requests")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WithdrawalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "amount", nullable = false)
    private long amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private WithdrawalStatus status;

    @Column(name = "bank_info", nullable = false, length = 500)
    private String bankInfo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id")
    private UserBankAccount bankAccount;

    @Column(name = "bank_code", length = 20)
    private String bankCode;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_bin", length = 12)
    private String bankBin;

    @Column(name = "account_number", length = 40)
    private String accountNumber;

    @Column(name = "account_holder", length = 150)
    private String accountHolder;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "review_note", length = 500)
    private String reviewNote;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public static WithdrawalRequest create(User user, long amount, String bankInfo) {
        WithdrawalRequest request = new WithdrawalRequest();
        request.user = user;
        request.amount = amount;
        request.bankInfo = bankInfo;
        request.status = WithdrawalStatus.REQUESTED;
        request.requestedAt = LocalDateTime.now();
        return request;
    }

    public static WithdrawalRequest create(
            User user,
            long amount,
            UserBankAccount bankAccount,
            String bankInfo
    ) {
        WithdrawalRequest request = create(user, amount, bankInfo);
        request.bankAccount = bankAccount;
        request.bankCode = bankAccount.getBankCode();
        request.bankName = bankAccount.getBankName();
        request.bankBin = bankAccount.getBankBin();
        request.accountNumber = bankAccount.getAccountNumber();
        request.accountHolder = bankAccount.getAccountHolder();
        return request;
    }

    public void approve(User reviewer) {
        ensureStatus(WithdrawalStatus.REQUESTED);
        this.status = WithdrawalStatus.APPROVED;
        this.reviewedBy = reviewer;
        this.reviewedAt = LocalDateTime.now();
    }

    public void reject(User reviewer, String note) {
        if (status != WithdrawalStatus.REQUESTED && status != WithdrawalStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending requests can be rejected");
        }
        this.status = WithdrawalStatus.REJECTED;
        this.reviewedBy = reviewer;
        this.reviewNote = note;
        this.reviewedAt = LocalDateTime.now();
    }

    public void markPaid() {
        ensureStatus(WithdrawalStatus.APPROVED);
        this.status = WithdrawalStatus.PAID;
        this.paidAt = LocalDateTime.now();
    }

    /** User huỷ lệnh của chính mình khi còn chờ duyệt. */
    public void cancelByUser() {
        ensureStatus(WithdrawalStatus.REQUESTED);
        this.status = WithdrawalStatus.CANCELLED;
        this.reviewedAt = LocalDateTime.now();
    }

    private void ensureStatus(WithdrawalStatus expected) {
        if (this.status != expected) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Expected status " + expected + " but was " + this.status);
        }
    }
}
