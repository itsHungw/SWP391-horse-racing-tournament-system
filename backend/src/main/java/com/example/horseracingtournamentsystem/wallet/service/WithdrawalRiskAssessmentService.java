package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import com.example.horseracingtournamentsystem.wallet.config.WithdrawalRiskProperties;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalRiskAssessmentResponse;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalRiskFindingResponse;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import com.example.horseracingtournamentsystem.wallet.repository.UserBankAccountRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WalletRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WithdrawalRiskAssessmentService {

    private static final String FIRST_WITHDRAWAL = "FIRST_WITHDRAWAL";
    private static final String LEGACY_DESTINATION = "LEGACY_DESTINATION";

    private final WalletRepository walletRepository;
    private final UserBankAccountRepository bankAccountRepository;
    private final WithdrawalRequestRepository withdrawalRepository;
    private final WithdrawalRiskProperties properties;

    @Transactional(readOnly = true)
    public WithdrawalRiskAssessmentResponse assess(WithdrawalRequest withdrawal) {
        LocalDateTime now = LocalDateTime.now();
        Long userId = withdrawal.getUser().getId();
        List<WithdrawalRiskFindingResponse> findings = new ArrayList<>();
        List<String> context = new ArrayList<>();

        addAccountFinding(withdrawal, findings);
        addWalletFinding(userId, findings);
        addDestinationFinding(withdrawal, findings, context);
        addVelocityFinding(userId, now, findings);
        addHistoryFindings(withdrawal, userId, now, findings, context);

        findings.sort(Comparator
                .comparing(WithdrawalRiskFindingResponse::severity).reversed()
                .thenComparing(WithdrawalRiskFindingResponse::code));

        WithdrawalRiskLevel level = findings.stream()
                .map(WithdrawalRiskFindingResponse::severity)
                .max(Comparator.naturalOrder())
                .orElse(WithdrawalRiskLevel.LOW);
        return new WithdrawalRiskAssessmentResponse(level, findings, context);
    }

    private void addAccountFinding(
            WithdrawalRequest withdrawal,
            List<WithdrawalRiskFindingResponse> findings
    ) {
        UserStatus status = withdrawal.getUser().getStatus();
        if (status == UserStatus.ACTIVE) {
            return;
        }
        findings.add(finding(
                "ACCOUNT_RESTRICTED",
                WithdrawalRiskLevel.HIGH,
                "Account access is restricted",
                "The user's current account state requires manual verification before payout.",
                "Current account status: " + status,
                "Open the user profile and review the latest enforcement decision."));
    }

    private void addWalletFinding(Long userId, List<WithdrawalRiskFindingResponse> findings) {
        walletRepository.findById(userId)
                .filter(wallet -> wallet.isLocked())
                .ifPresent(wallet -> findings.add(finding(
                        "WALLET_LOCKED",
                        WithdrawalRiskLevel.HIGH,
                        "Wallet is locked",
                        "Financial access is currently frozen for this user.",
                        "Current wallet status: LOCKED",
                        "Review wallet enforcement history before approving the withdrawal.")));
    }

    private void addDestinationFinding(
            WithdrawalRequest withdrawal,
            List<WithdrawalRiskFindingResponse> findings,
            List<String> context
    ) {
        if (withdrawal.getBankCode() == null || withdrawal.getAccountNumber() == null) {
            context.add(LEGACY_DESTINATION);
            return;
        }
        long ownerCount = bankAccountRepository.countDistinctOwnersByBankIdentity(
                withdrawal.getBankCode(), withdrawal.getAccountNumber());
        if (ownerCount > 1) {
            findings.add(finding(
                    "SHARED_DESTINATION",
                    WithdrawalRiskLevel.HIGH,
                    "Destination is shared by multiple users",
                    "The same bank destination appears on more than one platform account.",
                    "Distinct user accounts using destination: " + ownerCount,
                    "Verify account ownership and inspect the linked user records."));
        }
    }

    private void addVelocityFinding(
            Long userId,
            LocalDateTime now,
            List<WithdrawalRiskFindingResponse> findings
    ) {
        LocalDateTime since = now.minus(properties.velocityWindow());
        long count = withdrawalRepository.countRequestedByUserSince(userId, since);
        if (count >= properties.velocityCount()) {
            findings.add(finding(
                    "WITHDRAWAL_VELOCITY",
                    WithdrawalRiskLevel.HIGH,
                    "Several withdrawals were requested recently",
                    "The request frequency reached the configured review threshold.",
                    count + " requests within " + properties.velocityWindow().toHours() + " hours",
                    "Compare the recent requests and confirm they are not duplicates."));
        }
    }

    private void addHistoryFindings(
            WithdrawalRequest withdrawal,
            Long userId,
            LocalDateTime now,
            List<WithdrawalRiskFindingResponse> findings,
            List<String> context
    ) {
        List<Long> amounts = withdrawalRepository.findTerminalAmountsSince(
                userId, now.minus(properties.historyWindow()));
        if (amounts.isEmpty()) {
            context.add(FIRST_WITHDRAWAL);
        } else if (amounts.size() >= properties.anomalyMinHistory()) {
            long median = median(amounts);
            if (withdrawal.getAmount() > median * properties.anomalyMultiplier()) {
                findings.add(finding(
                        "AMOUNT_ANOMALY",
                        WithdrawalRiskLevel.MEDIUM,
                        "Amount is unusual for this user",
                        "The requested amount is materially above the user's recent withdrawal pattern.",
                        "Requested " + withdrawal.getAmount() + " VND; 90-day median " + median + " VND",
                        "Compare the amount with the user's wallet and withdrawal history."));
            }
        }

        boolean recentIssue = withdrawalRepository.existsRecentRejectedOrCancelled(
                userId, now.minus(properties.recentTerminalWindow()));
        if (recentIssue) {
            findings.add(finding(
                    "RECENT_TERMINAL_ISSUE",
                    WithdrawalRiskLevel.MEDIUM,
                    "A recent withdrawal did not complete",
                    "A withdrawal was rejected or cancelled inside the configured review window.",
                    "Rejected or cancelled request within "
                            + properties.recentTerminalWindow().toDays() + " days",
                    "Review the previous request reason before continuing."));
        }
    }

    private long median(List<Long> values) {
        List<Long> sorted = values.stream().sorted().toList();
        int middle = sorted.size() / 2;
        if (sorted.size() % 2 == 1) {
            return sorted.get(middle);
        }
        long lower = sorted.get(middle - 1);
        long upper = sorted.get(middle);
        return lower + ((upper - lower) / 2);
    }

    private WithdrawalRiskFindingResponse finding(
            String code,
            WithdrawalRiskLevel severity,
            String title,
            String explanation,
            String evidence,
            String suggestedCheck
    ) {
        return new WithdrawalRiskFindingResponse(
                code, severity, title, explanation, evidence, suggestedCheck);
    }
}
