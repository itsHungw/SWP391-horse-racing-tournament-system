package com.example.horseracingtournamentsystem.finance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.finance.dto.AdminFinanceTransactionResponse;
import com.example.horseracingtournamentsystem.finance.dto.AdminTopUpReconciliationResponse;
import com.example.horseracingtournamentsystem.finance.dto.FinanceReconciliationStatus;
import com.example.horseracingtournamentsystem.finance.service.AdminFinanceLedgerService;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.wallet.entity.TopUpOrder;
import com.example.horseracingtournamentsystem.wallet.entity.TopUpStatus;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.repository.TopUpOrderRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WalletTransactionRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

class AdminFinanceLedgerServiceTest {

    private final WalletTransactionRepository transactions = mock(WalletTransactionRepository.class);
    private final TopUpOrderRepository topUps = mock(TopUpOrderRepository.class);
    private final RacePredictionRepository racePredictions = mock(RacePredictionRepository.class);
    private final StreakPredictionRepository streakPredictions = mock(StreakPredictionRepository.class);
    private final WithdrawalRequestRepository withdrawals = mock(WithdrawalRequestRepository.class);
    private final AdminFinanceLedgerService service = new AdminFinanceLedgerService(
            transactions, topUps, racePredictions, streakPredictions, withdrawals);

    @Test
    void reportsOnlyDatabaseAggregatedReconciliationExceptions() {
        when(topUps.countMissingWalletCredits(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(2L);
        when(topUps.countAmountMismatches(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(3L);
        when(topUps.countUnexpectedWalletCredits(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(1L);
        when(transactions.countOrphanTopUpCredits(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(4L);
        when(topUps.countStalePending(
                any(LocalDateTime.class), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(5L);

        var summary = service.reconciliationSummary(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31));

        assertThat(summary.missingWalletCredits()).isEqualTo(2L);
        assertThat(summary.amountMismatches()).isEqualTo(3L);
        assertThat(summary.unexpectedWalletCredits()).isEqualTo(1L);
        assertThat(summary.orphanWalletCredits()).isEqualTo(4L);
        assertThat(summary.stalePendingOrders()).isEqualTo(5L);
    }

    @Test
    @SuppressWarnings("unchecked")
    void exposesSignedAmountAndDerivesBalanceBeforeFromImmutableLedgerEntry() {
        WalletTransaction transaction = transaction(91L, -120_000L, 380_000L);
        when(transactions.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(transaction)));

        Page<AdminFinanceTransactionResponse> page = service.searchTransactions(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31),
                "spectator@example.com", WalletTransactionType.BET_PLACED,
                "RACE_PREDICTION", 44L, 0, 20);

        AdminFinanceTransactionResponse row = page.getContent().getFirst();
        assertThat(row.amount()).isEqualTo(-120_000L);
        assertThat(row.balanceBefore()).isEqualTo(500_000L);
        assertThat(row.balanceAfter()).isEqualTo(380_000L);
        assertThat(row.userEmail()).isEqualTo("spectator@example.com");
    }

    @Test
    @SuppressWarnings("unchecked")
    void flagsSuccessfulTopUpWhenWalletCreditIsMissing() {
        TopUpOrder order = topUp(52L, 500_000L, TopUpStatus.SUCCESS);
        when(topUps.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(order)));
        when(transactions.findAllByReferenceTypeAndReferenceIdInAndTransactionType(
                any(), any(), any())).thenReturn(List.of());

        Page<AdminTopUpReconciliationResponse> page = service.searchTopUps(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31), null, null, 0, 20);

        assertThat(page.getContent().getFirst().reconciliationStatus())
                .isEqualTo("MISSING_WALLET_CREDIT");
    }

    @Test
    @SuppressWarnings("unchecked")
    void appliesAnOrderBackedReconciliationIssueBeforePagination() {
        TopUpOrder order = topUp(52L, 500_000L, TopUpStatus.SUCCESS);
        when(topUps.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(order)));
        when(transactions.findAllByReferenceTypeAndReferenceIdInAndTransactionType(
                any(), any(), any())).thenReturn(List.of());

        Page<AdminTopUpReconciliationResponse> page = service.searchTopUps(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31),
                null, null, FinanceReconciliationStatus.MISSING_WALLET_CREDIT, 0, 20);

        assertThat(page.getContent()).singleElement()
                .extracting(AdminTopUpReconciliationResponse::reconciliationStatus)
                .isEqualTo("MISSING_WALLET_CREDIT");
    }

    @Test
    void doesNotReturnOrdersForTheOrphanCreditIssue() {
        Page<AdminTopUpReconciliationResponse> page = service.searchTopUps(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31),
                null, null, FinanceReconciliationStatus.ORPHAN_WALLET_CREDIT, 0, 20);

        assertThat(page).isEmpty();
        verifyNoInteractions(topUps);
    }

    @Test
    @SuppressWarnings("unchecked")
    void flagsAmountMismatchBetweenTopUpOrderAndWalletCredit() {
        TopUpOrder order = topUp(52L, 500_000L, TopUpStatus.SUCCESS);
        WalletTransaction credit = transaction(93L, 490_000L, 990_000L);
        when(credit.getReferenceId()).thenReturn(52L);
        when(credit.getTransactionType()).thenReturn(WalletTransactionType.TOPUP);
        when(topUps.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(order)));
        when(transactions.findAllByReferenceTypeAndReferenceIdInAndTransactionType(
                any(), any(), any())).thenReturn(List.of(credit));

        Page<AdminTopUpReconciliationResponse> page = service.searchTopUps(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31), null, null, 0, 20);

        assertThat(page.getContent().getFirst().reconciliationStatus())
                .isEqualTo("AMOUNT_MISMATCH");
    }

    @Test
    @SuppressWarnings("unchecked")
    void exportsTheFilteredLedgerAsCsv() {
        WalletTransaction transaction = transaction(91L, -120_000L, 380_000L);
        when(transactions.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(transaction)));

        byte[] csv = service.exportTransactions(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31),
                "spectator@example.com", WalletTransactionType.BET_PLACED,
                "RACE_PREDICTION", 44L);

        assertThat(new String(csv, java.nio.charset.StandardCharsets.UTF_8))
                .contains("Transaction ID,Created At,User Email")
                .contains("91,2026-07-15T10:30:00+07:00,spectator@example.com")
                .contains("-120000,500000,380000");
    }

    @Test
    @SuppressWarnings("unchecked")
    void rejectsAnOversizedExportInsteadOfSilentlyTruncatingIt() {
        List<WalletTransaction> oversized = java.util.Collections.nCopies(
                10_001, transaction(91L, -1L, 1L));
        when(transactions.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(oversized));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.exportTransactions(
                        LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31),
                        null, null, null, null))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("10,000");
        verify(transactions, org.mockito.Mockito.never()).count(any(Specification.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void neutralizesSpreadsheetFormulasInCsvTextFields() {
        WalletTransaction transaction = transaction(91L, -120_000L, 380_000L);
        when(transaction.getDescription()).thenReturn("=HYPERLINK(\"https://example.test\")");
        when(transactions.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(transaction)));

        String csv = new String(service.exportTransactions(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31),
                null, null, null, null), java.nio.charset.StandardCharsets.UTF_8);

        assertThat(csv).contains("\"'=HYPERLINK(\"\"https://example.test\"\")\"");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "\t=HYPERLINK(\"https://example.test\")",
            "\r=HYPERLINK(\"https://example.test\")",
            "\n=HYPERLINK(\"https://example.test\")",
            "  =HYPERLINK(\"https://example.test\")",
            " \t@SUM(1+1)"
    })
    @SuppressWarnings("unchecked")
    void neutralizesSpreadsheetFormulasHiddenBehindWhitespace(String dangerousValue) {
        WalletTransaction transaction = transaction(91L, -120_000L, 380_000L);
        when(transaction.getDescription()).thenReturn(dangerousValue);
        when(transactions.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(transaction)));

        String csv = new String(service.exportTransactions(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31),
                null, null, null, null), java.nio.charset.StandardCharsets.UTF_8);

        assertThat(csv).contains("'" + dangerousValue.replace("\"", "\"\""));
    }

    private WalletTransaction transaction(long id, long amount, long balanceAfter) {
        User user = mock(User.class);
        when(user.getId()).thenReturn(7L);
        when(user.getEmail()).thenReturn("spectator@example.com");
        when(user.getFullName()).thenReturn("Spectator One");
        WalletTransaction transaction = mock(WalletTransaction.class);
        when(transaction.getId()).thenReturn(id);
        when(transaction.getUser()).thenReturn(user);
        when(transaction.getAmount()).thenReturn(amount);
        when(transaction.getBalanceAfter()).thenReturn(balanceAfter);
        when(transaction.getTransactionType()).thenReturn(WalletTransactionType.BET_PLACED);
        when(transaction.getReferenceType()).thenReturn("RACE_PREDICTION");
        when(transaction.getReferenceId()).thenReturn(44L);
        when(transaction.getDescription()).thenReturn("Prediction stake");
        when(transaction.getCreatedAt()).thenReturn(LocalDateTime.of(2026, 7, 15, 10, 30));
        return transaction;
    }

    private TopUpOrder topUp(long id, long amount, TopUpStatus status) {
        User user = mock(User.class);
        when(user.getId()).thenReturn(7L);
        when(user.getEmail()).thenReturn("spectator@example.com");
        when(user.getFullName()).thenReturn("Spectator One");
        TopUpOrder order = mock(TopUpOrder.class);
        when(order.getId()).thenReturn(id);
        when(order.getUser()).thenReturn(user);
        when(order.getAmount()).thenReturn(amount);
        when(order.getStatus()).thenReturn(status);
        when(order.getVnpayTxnRef()).thenReturn("VNP-52");
        when(order.getVnpayTransactionNo()).thenReturn("BANK-52");
        when(order.getCreatedAt()).thenReturn(LocalDateTime.of(2026, 7, 15, 10, 0));
        when(order.getPaidAt()).thenReturn(LocalDateTime.of(2026, 7, 15, 10, 5));
        return order;
    }
}
