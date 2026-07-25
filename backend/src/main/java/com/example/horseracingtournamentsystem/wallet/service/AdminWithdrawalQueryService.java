package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.wallet.dto.AdminWithdrawalRowResponse;
import com.example.horseracingtournamentsystem.wallet.dto.AdminWithdrawalSummaryResponse;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalRiskAssessmentResponse;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalExportFilter;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import jakarta.persistence.criteria.JoinType;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminWithdrawalQueryService {

    private static final int MIN_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;

    private final WithdrawalRequestRepository repository;
    private final WithdrawalRiskAssessmentService riskService;

    @Transactional(readOnly = true)
    public Page<AdminWithdrawalRowResponse> search(
            String rawQuery,
            WithdrawalStatus status,
            WithdrawalRiskLevel risk,
            LocalDate from,
            LocalDate to,
            String sort,
            int page,
            int size
    ) {
        String query = rawQuery == null ? "" : rawQuery.trim().toLowerCase();
        Specification<WithdrawalRequest> specification = specification(query, status, from, to);
        int boundedPage = Math.max(0, page);
        int boundedSize = Math.max(MIN_PAGE_SIZE, Math.min(MAX_PAGE_SIZE, size));
        Sort databaseSort = databaseSort(sort);
        boolean riskSort = isRiskSort(sort);

        if (risk == null && !riskSort) {
            Pageable pageable = PageRequest.of(boundedPage, boundedSize, databaseSort);
            return repository.findAll(specification, pageable)
                    .map(withdrawal -> AdminWithdrawalRowResponse.from(
                            withdrawal, riskService.assess(withdrawal)));
        }

        List<AdminWithdrawalRowResponse> matching = repository.findAll(specification, databaseSort).stream()
                .map(withdrawal -> AdminWithdrawalRowResponse.from(
                        withdrawal, riskService.assess(withdrawal)))
                .filter(row -> risk == null || row.risk().level() == risk)
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        if (riskSort) {
            matching.sort(riskComparator());
        }

        int start = Math.min(boundedPage * boundedSize, matching.size());
        int end = Math.min(start + boundedSize, matching.size());
        return new PageImpl<>(matching.subList(start, end),
                PageRequest.of(boundedPage, boundedSize, databaseSort), matching.size());
    }

    @Transactional(readOnly = true)
    public AdminWithdrawalSummaryResponse summary() {
        long needsReview = repository.countByStatus(WithdrawalStatus.REQUESTED);
        long readyToPay = repository.countByStatus(WithdrawalStatus.APPROVED);
        long pendingValue = repository.sumPendingAmount();
        List<WithdrawalRequest> active = repository.findByStatusInOrderByRequestedAtDesc(
                List.of(WithdrawalStatus.REQUESTED, WithdrawalStatus.APPROVED));
        long highRisk = active.stream()
                .map(riskService::assess)
                .map(WithdrawalRiskAssessmentResponse::level)
                .filter(level -> level == WithdrawalRiskLevel.HIGH)
                .count();
        return new AdminWithdrawalSummaryResponse(needsReview, readyToPay, pendingValue, highRisk);
    }

    @Transactional(readOnly = true)
    public List<AdminWithdrawalRowResponse> findAllForExport(
            WithdrawalExportFilter filter,
            int maxRows,
            int maxScanRows
    ) {
        String query = filter.query() == null ? "" : filter.query().trim().toLowerCase();
        Specification<WithdrawalRequest> specification =
                specification(query, filter.status(), filter.from(), filter.to());
        Sort sort = databaseSort(filter.sort()).and(Sort.by(Sort.Direction.DESC, "id"));
        int scanLimit = filter.risk() == null ? maxRows + 1 : maxScanRows;
        List<AdminWithdrawalRowResponse> rows = new ArrayList<>();
        int pageNumber = 0;
        int scanned = 0;

        while (true) {
            Page<WithdrawalRequest> page = repository.findAll(
                    specification, PageRequest.of(pageNumber++, 500, sort));
            for (WithdrawalRequest withdrawal : page.getContent()) {
                if (++scanned > scanLimit) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Withdrawal export filter is too broad; narrow the filters");
                }
                AdminWithdrawalRowResponse row = AdminWithdrawalRowResponse.from(
                        withdrawal, riskService.assess(withdrawal));
                if (filter.risk() == null || row.risk().level() == filter.risk()) {
                    rows.add(row);
                    if (rows.size() > maxRows) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Withdrawal export exceeds the configured row limit");
                    }
                }
            }
            if (!page.hasNext()) {
                break;
            }
        }
        if (isRiskSort(filter.sort())) {
            rows.sort(riskComparator());
        }
        return List.copyOf(rows);
    }

    private Specification<WithdrawalRequest> specification(
            String query,
            WithdrawalStatus status,
            LocalDate from,
            LocalDate to
    ) {
        return (root, criteriaQuery, builder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            var user = root.join("user", JoinType.INNER);
            if (!query.isBlank()) {
                String contains = "%" + query + "%";
                List<jakarta.persistence.criteria.Predicate> search = new ArrayList<>();
                search.add(builder.like(builder.lower(user.get("fullName")), contains));
                search.add(builder.like(builder.lower(user.get("email")), contains));
                search.add(builder.like(builder.lower(root.get("accountNumber")), contains));
                try {
                    search.add(builder.equal(root.get("id"), Long.parseLong(query.replace("#", ""))));
                } catch (NumberFormatException ignored) {
                    // Text search remains valid when the query is not an ID.
                }
                predicates.add(builder.or(search.toArray(jakarta.persistence.criteria.Predicate[]::new)));
            }
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (from != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("requestedAt"), from.atStartOfDay()));
            }
            if (to != null) {
                predicates.add(builder.lessThan(root.get("requestedAt"), to.plusDays(1).atStartOfDay()));
            }
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private Sort databaseSort(String value) {
        return switch (normalizeSort(value)) {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "requestedAt");
            case "amount_desc", "amount,desc" -> Sort.by(Sort.Direction.DESC, "amount");
            case "risk_desc" -> Sort.by(Sort.Direction.DESC, "requestedAt");
            case "newest" -> Sort.by(Sort.Direction.DESC, "requestedAt");
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported withdrawal sort");
        };
    }

    private boolean isRiskSort(String value) {
        return "risk_desc".equals(normalizeSort(value));
    }

    private int riskRank(WithdrawalRiskLevel level) {
        return switch (level) {
            case LOW -> 1;
            case MEDIUM -> 2;
            case HIGH -> 3;
        };
    }

    private Comparator<AdminWithdrawalRowResponse> riskComparator() {
        return Comparator
                .comparingInt((AdminWithdrawalRowResponse row) -> riskRank(row.risk().level()))
                .reversed()
                .thenComparing(
                        AdminWithdrawalRowResponse::requestedAt,
                        Comparator.reverseOrder());
    }

    private String normalizeSort(String value) {
        return value == null || value.isBlank() ? "newest" : value.trim().toLowerCase();
    }
}
