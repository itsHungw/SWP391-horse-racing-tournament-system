package com.example.horseracingtournamentsystem.finance.service;

import com.example.horseracingtournamentsystem.finance.dto.AdminFinanceResponse;
import com.example.horseracingtournamentsystem.finance.dto.FinanceTotalsProjection;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository;
import com.example.horseracingtournamentsystem.wallet.repository.TopUpOrderRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WalletRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminFinanceQueryService {

    private final RacePredictionRepository racePredictions;
    private final StreakPredictionRepository streakPredictions;
    private final TopUpOrderRepository topUps;
    private final WithdrawalRequestRepository withdrawals;
    private final WalletRepository wallets;

    public AdminFinanceResponse summary(LocalDate from, LocalDate to) {
        validateRange(from, to);
        Period currentPeriod = Period.of(from, to);
        long days = ChronoUnit.DAYS.between(from, to) + 1;
        Period previousPeriod = Period.of(from.minusDays(days), from.minusDays(1));

        PredictionTotals current = predictionTotals(currentPeriod);
        PredictionTotals previous = predictionTotals(previousPeriod);
        long successfulTopUps = topUps.sumSuccessfulPaidBetween(currentPeriod.start(), currentPeriod.endExclusive());
        long paidWithdrawals = withdrawals.sumPaidBetween(currentPeriod.start(), currentPeriod.endExclusive());
        long walletLiability = wallets.sumAllBalances();

        return new AdminFinanceResponse(
                from,
                to,
                current.wagers(),
                current.payouts(),
                current.refunds(),
                current.ggr(),
                ratio(current.ggr(), current.wagers()),
                successfulTopUps,
                paidWithdrawals,
                Math.subtractExact(successfulTopUps, paidWithdrawals),
                walletLiability,
                previous.wagers(),
                previous.payouts(),
                previous.ggr(),
                change(current.ggr(), previous.ggr())
        );
    }

    private PredictionTotals predictionTotals(Period period) {
        FinanceTotalsProjection races = racePredictions.aggregateFinanceTotalsBetween(
                period.start(), period.endExclusive());
        FinanceTotalsProjection streaks = streakPredictions.aggregateFinanceTotalsBetween(
                period.start(), period.endExclusive());
        long wagers = Math.addExact(value(races, FinanceTotalsProjection::getWagers),
                value(streaks, FinanceTotalsProjection::getWagers));
        long payouts = Math.addExact(value(races, FinanceTotalsProjection::getPayouts),
                value(streaks, FinanceTotalsProjection::getPayouts));
        long refunds = Math.addExact(value(races, FinanceTotalsProjection::getRefunds),
                value(streaks, FinanceTotalsProjection::getRefunds));
        return new PredictionTotals(
                wagers, payouts, refunds,
                Math.subtractExact(Math.subtractExact(wagers, payouts), refunds));
    }

    private long value(
            FinanceTotalsProjection projection,
            java.util.function.ToLongFunction<FinanceTotalsProjection> getter
    ) {
        return projection == null ? 0 : getter.applyAsLong(projection);
    }

    private void validateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) {
            throw new IllegalArgumentException("Finance date range is invalid");
        }
        if (ChronoUnit.DAYS.between(from, to) > 365) {
            throw new IllegalArgumentException("Finance date range cannot exceed 366 days");
        }
    }

    private BigDecimal ratio(long numerator, long denominator) {
        if (denominator == 0) {
            return BigDecimal.ZERO.setScale(4);
        }
        return BigDecimal.valueOf(numerator)
                .divide(BigDecimal.valueOf(denominator), 4, RoundingMode.HALF_UP);
    }

    private BigDecimal change(long current, long previous) {
        if (previous == 0) {
            return BigDecimal.ZERO.setScale(4);
        }
        return BigDecimal.valueOf(current - previous)
                .divide(BigDecimal.valueOf(Math.abs(previous)), 4, RoundingMode.HALF_UP);
    }

    private record PredictionTotals(long wagers, long payouts, long refunds, long ggr) {
    }

    private record Period(LocalDateTime start, LocalDateTime endExclusive) {
        static Period of(LocalDate from, LocalDate to) {
            return new Period(from.atStartOfDay(), to.plusDays(1).atStartOfDay());
        }
    }
}
