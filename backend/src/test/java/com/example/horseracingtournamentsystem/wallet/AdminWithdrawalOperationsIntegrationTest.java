package com.example.horseracingtournamentsystem.wallet;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.wallet.entity.UserBankAccount;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionHistory;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionType;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.repository.UserBankAccountRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalActionHistoryRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
class AdminWithdrawalOperationsIntegrationTest {

    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired UserRepository userRepository;
    @Autowired UserBankAccountRepository bankAccountRepository;
    @Autowired WithdrawalRequestRepository withdrawalRepository;
    @Autowired WithdrawalActionHistoryRepository actionHistoryRepository;

    private User admin;
    private User target;
    private UserBankAccount bankAccount;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);
        admin = activeUser("Withdrawal Admin", "withdrawal-admin@example.com");
        target = activeUser("Withdrawal Target", "withdrawal-target@example.com");
        bankAccount = bankAccountRepository.save(UserBankAccount.create(
                target, "TEST", "Test Bank", "0123456789", "WITHDRAWAL TARGET", "Primary"));
    }

    @Test
    void withdrawalPersistsImmutableDestinationAndOrderedActions() {
        WithdrawalRequest withdrawal = withdrawalRepository.save(WithdrawalRequest.create(
                target, 250_000L, bankAccount,
                "WITHDRAWAL TARGET · 0123456789 · Test Bank (TEST)"));
        actionHistoryRepository.save(WithdrawalActionHistory.record(
                withdrawal,
                WithdrawalActionType.APPROVED,
                WithdrawalStatus.REQUESTED,
                WithdrawalStatus.APPROVED,
                admin,
                null,
                "Reviewed account",
                null,
                WithdrawalRiskLevel.LOW,
                "[]"));

        WithdrawalRequest stored = withdrawalRepository.findById(withdrawal.getId()).orElseThrow();
        List<WithdrawalActionHistory> history = actionHistoryRepository
                .findByWithdrawalIdOrderByCreatedAtAscIdAsc(stored.getId());

        assertEquals("TEST", stored.getBankCode());
        assertEquals("0123456789", stored.getAccountNumber());
        assertEquals("WITHDRAWAL TARGET", stored.getAccountHolder());
        assertEquals(WithdrawalActionType.APPROVED, history.getFirst().getAction());
    }

    private User activeUser(String name, String email) {
        User user = userRepository.save(User.pending(name, email, "hash"));
        user.verifyEmail();
        return userRepository.save(user);
    }
}
