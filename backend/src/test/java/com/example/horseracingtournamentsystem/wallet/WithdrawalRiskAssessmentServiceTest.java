package com.example.horseracingtournamentsystem.wallet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.wallet.config.WithdrawalRiskProperties;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalRiskAssessmentResponse;
import com.example.horseracingtournamentsystem.wallet.entity.UserBankAccount;
import com.example.horseracingtournamentsystem.wallet.entity.Wallet;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import com.example.horseracingtournamentsystem.wallet.repository.UserBankAccountRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WalletRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalRiskAssessmentService;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WithdrawalRiskAssessmentServiceTest {

    @Mock WalletRepository walletRepository;
    @Mock UserBankAccountRepository bankAccountRepository;
    @Mock WithdrawalRequestRepository withdrawalRepository;

    private WithdrawalRiskAssessmentService service;
    private User target;
    private UserBankAccount bankAccount;

    @BeforeEach
    void setUp() {
        WithdrawalRiskProperties properties = new WithdrawalRiskProperties(
                3,
                Duration.ofHours(24),
                2.0,
                3,
                Duration.ofDays(7),
                Duration.ofDays(90));
        service = new WithdrawalRiskAssessmentService(
                walletRepository, bankAccountRepository, withdrawalRepository, properties);

        target = User.pending("Risk Target", "risk-target@example.com", "hash");
        target.verifyEmail();
        bankAccount = UserBankAccount.create(
                target, "TEST", "Test Bank", "0123456789", "RISK TARGET", "Primary");

    }

    @Test
    void lockedWalletProducesHighRiskWithEvidence() {
        Wallet lockedWallet = Wallet.create(target);
        lockedWallet.lock();
        when(walletRepository.findById(target.getId())).thenReturn(java.util.Optional.of(lockedWallet));

        WithdrawalRiskAssessmentResponse result = service.assess(withdrawalAt(250_000L));

        assertEquals(WithdrawalRiskLevel.HIGH, result.level());
        assertTrue(result.findings().stream().anyMatch(finding -> finding.code().equals("WALLET_LOCKED")));
    }

    @Test
    void restrictedAccountProducesHighRisk() {
        target.suspend();

        WithdrawalRiskAssessmentResponse result = service.assess(withdrawalAt(250_000L));

        assertEquals(WithdrawalRiskLevel.HIGH, result.level());
        assertTrue(result.findings().stream().anyMatch(finding -> finding.code().equals("ACCOUNT_RESTRICTED")));
    }

    @Test
    void sharedDestinationProducesHighRisk() {
        when(bankAccountRepository.countDistinctOwnersByBankIdentity("TEST", "0123456789"))
                .thenReturn(2L);

        WithdrawalRiskAssessmentResponse result = service.assess(withdrawalAt(250_000L));

        assertEquals(WithdrawalRiskLevel.HIGH, result.level());
        assertTrue(result.findings().stream().anyMatch(finding -> finding.code().equals("SHARED_DESTINATION")));
    }

    @Test
    void exactlyThreeRequestsInVelocityWindowProducesHighRisk() {
        when(withdrawalRepository.countRequestedByUserSince(any(), any(LocalDateTime.class)))
                .thenReturn(3L);

        WithdrawalRiskAssessmentResponse result = service.assess(withdrawalAt(250_000L));

        assertEquals(WithdrawalRiskLevel.HIGH, result.level());
        assertTrue(result.findings().stream().anyMatch(finding -> finding.code().equals("WITHDRAWAL_VELOCITY")));
    }

    @Test
    void amountAnomalyRequiresAtLeastThreeTerminalWithdrawals() {
        when(withdrawalRepository.findTerminalAmountsSince(any(), any(LocalDateTime.class)))
                .thenReturn(List.of(100_000L, 120_000L));
        assertEquals(WithdrawalRiskLevel.LOW, service.assess(withdrawalAt(300_000L)).level());

        when(withdrawalRepository.findTerminalAmountsSince(any(), any(LocalDateTime.class)))
                .thenReturn(List.of(100_000L, 120_000L, 140_000L));
        WithdrawalRiskAssessmentResponse result = service.assess(withdrawalAt(300_000L));
        assertEquals(WithdrawalRiskLevel.MEDIUM, result.level());
        assertTrue(result.findings().stream().anyMatch(finding -> finding.code().equals("AMOUNT_ANOMALY")));
    }

    @Test
    void recentRejectedOrCancelledWithdrawalProducesMediumRisk() {
        when(withdrawalRepository.existsRecentRejectedOrCancelled(any(), any(LocalDateTime.class)))
                .thenReturn(true);

        WithdrawalRiskAssessmentResponse result = service.assess(withdrawalAt(250_000L));

        assertEquals(WithdrawalRiskLevel.MEDIUM, result.level());
        assertTrue(result.findings().stream().anyMatch(finding -> finding.code().equals("RECENT_TERMINAL_ISSUE")));
    }

    @Test
    void firstWithdrawalAndLegacyDestinationAreNeutralContext() {
        WithdrawalRequest legacy = WithdrawalRequest.create(target, 250_000L, "Legacy bank text");

        WithdrawalRiskAssessmentResponse result = service.assess(legacy);

        assertEquals(WithdrawalRiskLevel.LOW, result.level());
        assertTrue(result.contextMarkers().contains("FIRST_WITHDRAWAL"));
        assertTrue(result.contextMarkers().contains("LEGACY_DESTINATION"));
    }

    @Test
    void maximumTriggeredSeverityWinsAndFindingsAreOrdered() {
        Wallet lockedWallet = Wallet.create(target);
        lockedWallet.lock();
        when(walletRepository.findById(target.getId())).thenReturn(java.util.Optional.of(lockedWallet));
        when(withdrawalRepository.existsRecentRejectedOrCancelled(any(), any(LocalDateTime.class)))
                .thenReturn(true);

        WithdrawalRiskAssessmentResponse result = service.assess(withdrawalAt(250_000L));

        assertEquals(WithdrawalRiskLevel.HIGH, result.level());
        assertEquals(WithdrawalRiskLevel.HIGH, result.findings().getFirst().severity());
    }

    private WithdrawalRequest withdrawalAt(long amount) {
        return WithdrawalRequest.create(target, amount, bankAccount,
                "RISK TARGET · 0123456789 · Test Bank (TEST)");
    }
}
