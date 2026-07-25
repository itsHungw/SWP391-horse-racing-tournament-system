package com.example.horseracingtournamentsystem.finance.controller;

import com.example.horseracingtournamentsystem.finance.dto.AdminFinanceReconciliationSummary;
import com.example.horseracingtournamentsystem.finance.dto.AdminFinanceResponse;
import com.example.horseracingtournamentsystem.finance.dto.AdminFinanceTransactionResponse;
import com.example.horseracingtournamentsystem.finance.dto.AdminTopUpReconciliationResponse;
import com.example.horseracingtournamentsystem.finance.dto.FinanceReconciliationStatus;
import com.example.horseracingtournamentsystem.finance.service.AdminFinanceLedgerService;
import com.example.horseracingtournamentsystem.finance.service.AdminFinanceQueryService;
import com.example.horseracingtournamentsystem.wallet.entity.TopUpStatus;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import java.time.LocalDate;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/finance")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminFinanceController {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final AdminFinanceQueryService finance;
    private final AdminFinanceLedgerService ledger;

    @GetMapping("/summary")
    public AdminFinanceResponse summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        Range range = range(from, to);
        return finance.summary(range.from(), range.to());
    }

    @GetMapping("/reconciliation-summary")
    public AdminFinanceReconciliationSummary reconciliationSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        Range range = range(from, to);
        return ledger.reconciliationSummary(range.from(), range.to());
    }

    @GetMapping("/transactions")
    public Page<AdminFinanceTransactionResponse> transactions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) WalletTransactionType type,
            @RequestParam(required = false) String referenceType,
            @RequestParam(required = false) Long referenceId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long minAmount,
            @RequestParam(required = false) Long maxAmount,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ledger.searchTransactions(from, to, query, type, referenceType, referenceId,
                userId, minAmount, maxAmount, page, size);
    }

    @GetMapping("/transactions/{id}")
    public AdminFinanceTransactionResponse transaction(@PathVariable Long id) {
        return ledger.transaction(id);
    }

    @GetMapping("/transactions/export")
    public ResponseEntity<byte[]> exportTransactions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) WalletTransactionType type,
            @RequestParam(required = false) String referenceType,
            @RequestParam(required = false) Long referenceId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long minAmount,
            @RequestParam(required = false) Long maxAmount
    ) {
        byte[] csv = ledger.exportTransactions(from, to, query, type, referenceType, referenceId,
                userId, minAmount, maxAmount);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"finance-transactions.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/topups")
    public Page<AdminTopUpReconciliationResponse> topUps(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) TopUpStatus status,
            @RequestParam(required = false) FinanceReconciliationStatus reconciliationStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ledger.searchTopUps(from, to, query, status, reconciliationStatus, page, size);
    }

    @GetMapping("/topups/orphan-credits")
    public Page<AdminFinanceTransactionResponse> orphanTopUpCredits(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ledger.orphanTopUpCredits(from, to, page, size);
    }

    private Range range(LocalDate from, LocalDate to) {
        LocalDate resolvedTo = to == null ? LocalDate.now(VIETNAM_ZONE) : to;
        LocalDate resolvedFrom = from == null ? resolvedTo.minusDays(29) : from;
        return new Range(resolvedFrom, resolvedTo);
    }

    private record Range(LocalDate from, LocalDate to) {
    }
}
