package com.example.horseracingtournamentsystem.wallet.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/** Tài khoản ngân hàng đã lưu của user — chọn lại khi rút mà không phải gõ lại. */
@Entity
@Table(name = "bank_accounts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserBankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "bank_code", nullable = false, length = 20)
    private String bankCode;

    @Column(name = "bank_name", nullable = false, length = 100)
    private String bankName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_directory_id")
    private BankDirectory bankDirectory;

    @Column(name = "bank_bin", length = 12)
    private String bankBin;

    @Column(name = "account_number", nullable = false, length = 40)
    private String accountNumber;

    @Column(name = "account_holder", nullable = false, length = 150)
    private String accountHolder;

    @Column(name = "label", length = 80)
    private String label;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static UserBankAccount create(
            User user, String bankCode, String bankName, String accountNumber, String accountHolder, String label) {
        UserBankAccount account = new UserBankAccount();
        account.user = user;
        account.bankCode = bankCode;
        account.bankName = bankName;
        account.accountNumber = accountNumber;
        account.accountHolder = accountHolder;
        account.label = label;
        account.createdAt = LocalDateTime.now();
        return account;
    }

    public static UserBankAccount create(
            User user,
            BankDirectory bank,
            String accountNumber,
            String accountHolder,
            String label
    ) {
        UserBankAccount account = create(
                user, bank.getCode(), bank.getDisplayName(), accountNumber, accountHolder, label);
        account.bankDirectory = bank;
        account.bankBin = bank.getBin();
        return account;
    }

    public boolean ownedBy(String email) {
        return user != null && user.getEmail().equalsIgnoreCase(email);
    }
}
