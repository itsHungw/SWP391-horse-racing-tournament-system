package com.example.horseracingtournamentsystem.finance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

import com.example.horseracingtournamentsystem.finance.dto.AdminFinanceResponse;
import com.example.horseracingtournamentsystem.finance.dto.FinanceTotalsProjection;
import com.example.horseracingtournamentsystem.finance.service.AdminFinanceQueryService;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository;
import com.example.horseracingtournamentsystem.wallet.repository.TopUpOrderRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WalletRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.TimeZone;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.Test;

class AdminFinanceQueryServiceTest {

    private final RacePredictionRepository racePredictions = mock(RacePredictionRepository.class);
    private final StreakPredictionRepository streakPredictions = mock(StreakPredictionRepository.class);
    private final TopUpOrderRepository topUps = mock(TopUpOrderRepository.class);
    private final WithdrawalRequestRepository withdrawals = mock(WithdrawalRequestRepository.class);
    private final WalletRepository wallets = mock(WalletRepository.class);

    private final AdminFinanceQueryService service = new AdminFinanceQueryService(
            racePredictions, streakPredictions, topUps, withdrawals, wallets);

    @Test
    void reportsSettledPredictionRevenueSeparatelyFromCashMovementAndWalletLiability() {
        LocalDate from = LocalDate.of(2026, 7, 1);
        LocalDate to = LocalDate.of(2026, 7, 31);
        FinanceTotalsProjection raceCurrent = totals(250, 170, 50);
        FinanceTotalsProjection streakCurrent = totals(250, 250, 50);
        FinanceTotalsProjection empty = totals(0, 0, 0);
        when(racePredictions.aggregateFinanceTotalsBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(raceCurrent, empty);
        when(streakPredictions.aggregateFinanceTotalsBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(streakCurrent, empty);
        when(topUps.sumSuccessfulPaidBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(1_000L);
        when(withdrawals.sumPaidBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(200L);
        when(wallets.sumAllBalances()).thenReturn(5_000L);

        AdminFinanceResponse response = service.summary(from, to);

        assertThat(response.ggr()).isEqualTo(-20L);
        assertThat(response.successfulTopUps()).isEqualTo(1_000L);
        assertThat(response.paidWithdrawals()).isEqualTo(200L);
        assertThat(response.netCashMovement()).isEqualTo(800L);
        assertThat(response.walletLiability()).isEqualTo(5_000L);
    }

    @Test
    void returnsZeroMarginWhenNoPredictionsSettled() {
        AdminFinanceResponse response = service.summary(
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 7));

        assertThat(response.ggrMargin()).isEqualByComparingTo("0.0000");
    }

    @Test
    void convertsVietnamBusinessDatesToTheDatabaseTimezone() {
        TimeZone original = TimeZone.getDefault();
        try {
            TimeZone.setDefault(TimeZone.getTimeZone("UTC"));

            service.summary(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31));

            ArgumentCaptor<LocalDateTime> from = ArgumentCaptor.forClass(LocalDateTime.class);
            ArgumentCaptor<LocalDateTime> to = ArgumentCaptor.forClass(LocalDateTime.class);
            verify(racePredictions, org.mockito.Mockito.times(2))
                    .aggregateFinanceTotalsBetween(from.capture(), to.capture());
            assertThat(from.getAllValues().getFirst()).isEqualTo(LocalDateTime.of(2026, 6, 30, 17, 0));
            assertThat(to.getAllValues().getFirst()).isEqualTo(LocalDateTime.of(2026, 7, 31, 17, 0));
        } finally {
            TimeZone.setDefault(original);
        }
    }

    private FinanceTotalsProjection totals(long wagers, long payouts, long refunds) {
        FinanceTotalsProjection projection = mock(FinanceTotalsProjection.class);
        when(projection.getWagers()).thenReturn(wagers);
        when(projection.getPayouts()).thenReturn(payouts);
        when(projection.getRefunds()).thenReturn(refunds);
        return projection;
    }
}
