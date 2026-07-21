package com.example.horseracingtournamentsystem.wallet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.wallet.entity.UserBankAccount;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionHistory;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionType;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.repository.UserBankAccountRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalActionHistoryRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AdminWithdrawalOperationsIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired UserRepository userRepository;
    @Autowired UserBankAccountRepository bankAccountRepository;
    @Autowired WithdrawalRequestRepository withdrawalRepository;
    @Autowired WithdrawalActionHistoryRepository actionHistoryRepository;
    @Autowired WalletService walletService;

    private User admin;
    private User target;
    private UserBankAccount bankAccount;
    private UserBankAccount otherUsersBank;
    private String targetToken;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);
        admin = activeUser("Withdrawal Admin", "withdrawal-admin@example.com");
        target = activeUser("Withdrawal Target", "withdrawal-target@example.com");
        bankAccount = bankAccountRepository.save(UserBankAccount.create(
                target, "TEST", "Test Bank", "0123456789", "WITHDRAWAL TARGET", "Primary"));
        User otherUser = activeUser("Other User", "other-user@example.com");
        otherUsersBank = bankAccountRepository.save(UserBankAccount.create(
                otherUser, "OTHER", "Other Bank", "9988776655", "OTHER USER", "Primary"));
        targetToken = jwtService.generateToken(target.getEmail(), Set.of("SPECTATOR"));
        walletService.adjust(
                target,
                1_000_000L,
                WalletTransactionType.TOPUP,
                WalletTransaction.REF_TOPUP_ORDER,
                90_001L,
                "Withdrawal operations test funding");
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

    @Test
    void userCreatesWithdrawalFromOwnedSavedAccount() throws Exception {
        mockMvc.perform(post("/api/v1/wallet/withdrawals")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":250000,\"bankAccountId\":" + bankAccount.getId() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bankCode").value("TEST"))
                .andExpect(jsonPath("$.bankInfo").value(
                        "WITHDRAWAL TARGET \u00b7 0123456789 \u00b7 Test Bank (TEST)"))
                .andExpect(jsonPath("$.maskedAccountNumber").value("•••• 6789"));

        WithdrawalRequest created = withdrawalRepository
                .findByUserIdOrderByRequestedAtDesc(target.getId()).getFirst();
        List<WithdrawalActionHistory> history = actionHistoryRepository
                .findByWithdrawalIdOrderByCreatedAtAscIdAsc(created.getId());
        assertEquals(List.of(WithdrawalActionType.CREATED),
                history.stream().map(WithdrawalActionHistory::getAction).toList());
    }

    @Test
    void userCannotWithdrawToAnotherUsersSavedAccount() throws Exception {
        mockMvc.perform(post("/api/v1/wallet/withdrawals")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":250000,\"bankAccountId\":" + otherUsersBank.getId() + "}"))
                .andExpect(status().isForbidden());
    }

    private User activeUser(String name, String email) {
        User user = userRepository.save(User.pending(name, email, "hash"));
        user.verifyEmail();
        return userRepository.save(user);
    }
}
