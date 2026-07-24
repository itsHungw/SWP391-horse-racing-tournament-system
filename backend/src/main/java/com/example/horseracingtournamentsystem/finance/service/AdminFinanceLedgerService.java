package com.example.horseracingtournamentsystem.finance.service;

import com.example.horseracingtournamentsystem.finance.dto.AdminFinanceTransactionResponse;
import com.example.horseracingtournamentsystem.finance.dto.AdminFinanceReconciliationSummary;
import com.example.horseracingtournamentsystem.finance.dto.AdminTopUpReconciliationResponse;
import com.example.horseracingtournamentsystem.finance.dto.FinanceReconciliationStatus;
import com.example.horseracingtournamentsystem.wallet.entity.TopUpOrder;
import com.example.horseracingtournamentsystem.wallet.entity.TopUpStatus;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.repository.TopUpOrderRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WalletTransactionRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminFinanceLedgerService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter CSV_TIMESTAMP = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final WalletTransactionRepository transactions;
    private final TopUpOrderRepository topUps;
    private final RacePredictionRepository racePredictions;
    private final StreakPredictionRepository streakPredictions;
    private final WithdrawalRequestRepository withdrawals;

    public AdminFinanceReconciliationSummary reconciliationSummary(LocalDate from, LocalDate to) {
        validateRange(from, to);
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        LocalDateTime staleBefore = LocalDateTime.now(VIETNAM_ZONE).minusMinutes(30);
        return new AdminFinanceReconciliationSummary(
                topUps.countMissingWalletCredits(start, end),
                topUps.countAmountMismatches(start, end),
                topUps.countUnexpectedWalletCredits(start, end),
                transactions.countOrphanTopUpCredits(start, end),
                topUps.countStalePending(start, end, staleBefore)
        );
    }

    public Page<AdminFinanceTransactionResponse> searchTransactions(
            LocalDate from,
            LocalDate to,
            String query,
            WalletTransactionType type,
            String referenceType,
            Long referenceId,
            int page,
            int size
    ) {
        return searchTransactions(from, to, query, type, referenceType, referenceId, null, null, null, page, size);
    }

    public Page<AdminFinanceTransactionResponse> searchTransactions(
            LocalDate from,
            LocalDate to,
            String query,
            WalletTransactionType type,
            String referenceType,
            Long referenceId,
            Long userId,
            Long minAmount,
            Long maxAmount,
            int page,
            int size
    ) {
        validateRange(from, to);
        validateAmountRange(minAmount, maxAmount);
        PageRequest pageable = PageRequest.of(safePage(page), safeSize(size), Sort.by(Sort.Direction.DESC, "createdAt"));
        return transactions.findAll(transactionSpec(from, to, query, type, referenceType, referenceId,
                        userId, minAmount, maxAmount, matchingTopUpIds(query)), pageable)
                .map(AdminFinanceTransactionResponse::from);
    }

    public AdminFinanceTransactionResponse transaction(Long id) {
        return transactions.findById(id)
                .map(this::transactionWithSource)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wallet transaction not found"));
    }

    public byte[] exportTransactions(
            LocalDate from,
            LocalDate to,
            String query,
            WalletTransactionType type,
            String referenceType,
            Long referenceId
    ) {
        return exportTransactions(from, to, query, type, referenceType, referenceId, null, null, null);
    }

    public byte[] exportTransactions(
            LocalDate from,
            LocalDate to,
            String query,
            WalletTransactionType type,
            String referenceType,
            Long referenceId,
            Long userId,
            Long minAmount,
            Long maxAmount
    ) {
        validateRange(from, to);
        validateAmountRange(minAmount, maxAmount);
        Specification<WalletTransaction> specification = transactionSpec(
                from, to, query, type, referenceType, referenceId,
                userId, minAmount, maxAmount, matchingTopUpIds(query));
        long rowCount = transactions.count(specification);
        if (rowCount > 10_000) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Filtered export contains more than 10,000 rows; narrow the filters");
        }
        PageRequest exportPage = PageRequest.of(0, 10_000, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<AdminFinanceTransactionResponse> rows = transactions
                .findAll(specification, exportPage)
                .map(AdminFinanceTransactionResponse::from)
                .getContent();
        StringBuilder csv = new StringBuilder(
                "Transaction ID,Created At,User Email,User Name,Type,Amount,Balance Before,Balance After,Reference Type,Reference ID,Description\n");
        for (AdminFinanceTransactionResponse row : rows) {
            csv.append(row.id()).append(',')
                    .append(row.createdAt().format(CSV_TIMESTAMP)).append(',')
                    .append(csv(row.userEmail())).append(',')
                    .append(csv(row.userName())).append(',')
                    .append(row.transactionType()).append(',')
                    .append(row.amount()).append(',')
                    .append(nullable(row.balanceBefore())).append(',')
                    .append(nullable(row.balanceAfter())).append(',')
                    .append(csv(row.referenceType())).append(',')
                    .append(nullable(row.referenceId())).append(',')
                    .append(csv(row.description())).append('\n');
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    public Page<AdminTopUpReconciliationResponse> searchTopUps(
            LocalDate from,
            LocalDate to,
            String query,
            TopUpStatus status,
            int page,
            int size
    ) {
        return searchTopUps(from, to, query, status, null, page, size);
    }

    public Page<AdminTopUpReconciliationResponse> searchTopUps(
            LocalDate from,
            LocalDate to,
            String query,
            TopUpStatus status,
            FinanceReconciliationStatus reconciliationStatus,
            int page,
            int size
    ) {
        validateRange(from, to);
        PageRequest pageable = PageRequest.of(safePage(page), safeSize(size), Sort.by(Sort.Direction.DESC, "createdAt"));
        if (reconciliationStatus == FinanceReconciliationStatus.ORPHAN_WALLET_CREDIT) {
            return Page.empty(pageable);
        }
        Page<TopUpOrder> orders = topUps.findAll(
                topUpSpec(from, to, query, status, reconciliationStatus), pageable);
        List<Long> orderIds = orders.getContent().stream().map(TopUpOrder::getId).toList();
        Map<Long, WalletTransaction> credits = orderIds.isEmpty() ? Map.of() : transactions
                .findAllByReferenceTypeAndReferenceIdInAndTransactionType(
                        WalletTransaction.REF_TOPUP_ORDER, orderIds, WalletTransactionType.TOPUP)
                .stream()
                .collect(Collectors.toMap(WalletTransaction::getReferenceId, Function.identity(), (first, ignored) -> first));
        return orders.map(order -> reconcile(order, credits.get(order.getId())));
    }

    public Page<AdminFinanceTransactionResponse> orphanTopUpCredits(
            LocalDate from, LocalDate to, int page, int size) {
        validateRange(from, to);
        PageRequest pageable = PageRequest.of(safePage(page), safeSize(size), Sort.by(Sort.Direction.DESC, "createdAt"));
        return transactions.findOrphanTopUpCredits(from.atStartOfDay(), to.plusDays(1).atStartOfDay(), pageable)
                .map(transaction -> AdminFinanceTransactionResponse.from(transaction)
                        .withSource("MISSING_TOPUP_ORDER", "Missing TopUpOrder -> TOPUP -> wallet balance"));
    }

    private AdminTopUpReconciliationResponse reconcile(TopUpOrder order, WalletTransaction credit) {
        String reconciliationStatus;
        if (order.getStatus() == TopUpStatus.SUCCESS && credit == null) {
            reconciliationStatus = "MISSING_WALLET_CREDIT";
        } else if (credit != null && order.getStatus() != TopUpStatus.SUCCESS) {
            reconciliationStatus = "UNEXPECTED_WALLET_CREDIT";
        } else if (credit != null && credit.getAmount() != order.getAmount()) {
            reconciliationStatus = "AMOUNT_MISMATCH";
        } else if (order.getStatus() == TopUpStatus.SUCCESS) {
            reconciliationStatus = "MATCHED";
        } else if ((order.getStatus() == TopUpStatus.PENDING || order.getStatus() == TopUpStatus.INITIATED)
                && order.getCreatedAt().isBefore(LocalDateTime.now().minusMinutes(30))) {
            reconciliationStatus = "STALE_PENDING";
        } else {
            reconciliationStatus = order.getStatus().name();
        }

        return new AdminTopUpReconciliationResponse(
                order.getId(),
                order.getUser().getId(),
                order.getUser().getEmail(),
                order.getUser().getFullName(),
                order.getAmount(),
                order.getStatus(),
                order.getVnpayTxnRef(),
                order.getVnpayTransactionNo(),
                order.getVnpayResponseCode(),
                order.getCreatedAt(),
                order.getPaidAt(),
                credit == null ? null : credit.getId(),
                credit == null ? null : credit.getAmount(),
                reconciliationStatus
        );
    }

    private Specification<WalletTransaction> transactionSpec(
            LocalDate from,
            LocalDate to,
            String query,
            WalletTransactionType type,
            String referenceType,
            Long referenceId,
            Long userId,
            Long minAmount,
            Long maxAmount,
            List<Long> matchingTopUpIds
    ) {
        return (root, criteria, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            predicates.add(builder.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay()));
            if (query != null && !query.isBlank()) {
                String value = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                List<Predicate> queryPredicates = new ArrayList<>();
                queryPredicates.add(builder.like(builder.lower(root.get("user").get("email")), value));
                queryPredicates.add(builder.like(builder.lower(root.get("user").get("fullName")), value));
                queryPredicates.add(builder.like(builder.lower(root.get("description")), value));
                queryPredicates.add(builder.like(builder.lower(root.get("referenceType")), value));
                if (!matchingTopUpIds.isEmpty()) {
                    queryPredicates.add(builder.and(
                            builder.equal(root.get("referenceType"), WalletTransaction.REF_TOPUP_ORDER),
                            root.get("referenceId").in(matchingTopUpIds)));
                }
                try {
                    long numeric = Long.parseLong(query.trim());
                    queryPredicates.add(builder.equal(root.get("id"), numeric));
                    queryPredicates.add(builder.equal(root.get("user").get("id"), numeric));
                    queryPredicates.add(builder.equal(root.get("referenceId"), numeric));
                } catch (NumberFormatException ignored) {
                    // Text search only.
                }
                predicates.add(builder.or(queryPredicates.toArray(Predicate[]::new)));
            }
            if (type != null) {
                predicates.add(builder.equal(root.get("transactionType"), type));
            }
            if (referenceType != null && !referenceType.isBlank()) {
                predicates.add(builder.equal(root.get("referenceType"), referenceType.trim()));
            }
            if (referenceId != null) {
                predicates.add(builder.equal(root.get("referenceId"), referenceId));
            }
            if (userId != null) {
                predicates.add(builder.equal(root.get("user").get("id"), userId));
            }
            if (minAmount != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("amount"), minAmount));
            }
            if (maxAmount != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("amount"), maxAmount));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<TopUpOrder> topUpSpec(
            LocalDate from,
            LocalDate to,
            String query,
            TopUpStatus status,
            FinanceReconciliationStatus reconciliationStatus
    ) {
        return (root, criteria, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
            predicates.add(builder.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay()));
            if (query != null && !query.isBlank()) {
                String value = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("user").get("email")), value),
                        builder.like(builder.lower(root.get("vnpayTxnRef")), value),
                        builder.like(builder.lower(root.get("vnpayTransactionNo")), value)));
            }
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (reconciliationStatus != null) {
                Subquery<Long> creditQuery = criteria.subquery(Long.class);
                Root<WalletTransaction> credit = creditQuery.from(WalletTransaction.class);
                creditQuery.select(credit.get("id"));
                List<Predicate> creditPredicates = new ArrayList<>();
                creditPredicates.add(builder.equal(credit.get("referenceType"), WalletTransaction.REF_TOPUP_ORDER));
                creditPredicates.add(builder.equal(credit.get("referenceId"), root.get("id")));
                creditPredicates.add(builder.equal(credit.get("transactionType"), WalletTransactionType.TOPUP));

                switch (reconciliationStatus) {
                    case MISSING_WALLET_CREDIT -> {
                        creditQuery.where(creditPredicates.toArray(Predicate[]::new));
                        predicates.add(builder.equal(root.get("status"), TopUpStatus.SUCCESS));
                        predicates.add(builder.not(builder.exists(creditQuery)));
                    }
                    case AMOUNT_MISMATCH -> {
                        creditPredicates.add(builder.notEqual(credit.get("amount"), root.get("amount")));
                        creditQuery.where(creditPredicates.toArray(Predicate[]::new));
                        predicates.add(builder.equal(root.get("status"), TopUpStatus.SUCCESS));
                        predicates.add(builder.exists(creditQuery));
                    }
                    case UNEXPECTED_WALLET_CREDIT -> {
                        creditQuery.where(creditPredicates.toArray(Predicate[]::new));
                        predicates.add(builder.notEqual(root.get("status"), TopUpStatus.SUCCESS));
                        predicates.add(builder.exists(creditQuery));
                    }
                    case STALE_PENDING -> {
                        predicates.add(root.get("status").in(TopUpStatus.INITIATED, TopUpStatus.PENDING));
                        predicates.add(builder.lessThan(
                                root.get("createdAt"), LocalDateTime.now(VIETNAM_ZONE).minusMinutes(30)));
                    }
                    case ORPHAN_WALLET_CREDIT -> predicates.add(builder.disjunction());
                }
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void validateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to) || from.plusDays(366).isBefore(to)) {
            throw new IllegalArgumentException("Finance date range is invalid or exceeds 366 days");
        }
    }

    private void validateAmountRange(Long minAmount, Long maxAmount) {
        if (minAmount != null && maxAmount != null && minAmount > maxAmount) {
            throw new IllegalArgumentException("Minimum amount cannot exceed maximum amount");
        }
    }

    private List<Long> matchingTopUpIds(String query) {
        return query == null || query.isBlank()
                ? List.of()
                : topUps.findIdsByReconciliationQuery(query.trim());
    }

    private AdminFinanceTransactionResponse transactionWithSource(WalletTransaction transaction) {
        String referenceType = transaction.getReferenceType();
        Long referenceId = transaction.getReferenceId();
        if (referenceType == null || referenceId == null) {
            return AdminFinanceTransactionResponse.from(transaction)
                    .withSource("NO_SOURCE_REFERENCE", "Wallet adjustment -> wallet balance");
        }
        String status = switch (referenceType) {
            case WalletTransaction.REF_TOPUP_ORDER -> topUps.findById(referenceId)
                    .map(order -> order.getStatus().name()).orElse("MISSING_SOURCE");
            case WalletTransaction.REF_RACE_PREDICTION -> racePredictions.findById(referenceId)
                    .map(prediction -> prediction.getStatus().name()).orElse("MISSING_SOURCE");
            case WalletTransaction.REF_STREAK_PREDICTION -> streakPredictions.findById(referenceId)
                    .map(prediction -> prediction.getStatus().name()).orElse("MISSING_SOURCE");
            case WalletTransaction.REF_WITHDRAWAL -> withdrawals.findById(referenceId)
                    .map(withdrawal -> withdrawal.getStatus().name()).orElse("MISSING_SOURCE");
            default -> "UNKNOWN_SOURCE";
        };
        String trace = switch (referenceType) {
            case WalletTransaction.REF_TOPUP_ORDER -> "TopUpOrder -> TOPUP -> wallet balance";
            case WalletTransaction.REF_RACE_PREDICTION, WalletTransaction.REF_STREAK_PREDICTION ->
                    "Prediction -> " + transaction.getTransactionType() + " -> wallet balance";
            case WalletTransaction.REF_WITHDRAWAL ->
                    "WithdrawalRequest -> " + transaction.getTransactionType() + " -> wallet balance";
            default -> referenceType + " -> " + transaction.getTransactionType() + " -> wallet balance";
        };
        return AdminFinanceTransactionResponse.from(transaction).withSource(status, trace);
    }

    private int safePage(int page) {
        return Math.max(page, 0);
    }

    private int safeSize(int size) {
        return Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    }

    private String nullable(Object value) {
        return value == null ? "" : value.toString();
    }

    private String csv(String value) {
        if (value == null) {
            return "";
        }
        if (value.indexOf(',') < 0 && value.indexOf('\"') < 0
                && value.indexOf('\n') < 0 && value.indexOf('\r') < 0) {
            return value;
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
