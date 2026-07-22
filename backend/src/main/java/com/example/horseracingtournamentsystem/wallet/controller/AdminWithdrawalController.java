package com.example.horseracingtournamentsystem.wallet.controller;

import com.example.horseracingtournamentsystem.wallet.dto.RejectWithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.dto.AdminWithdrawalRowResponse;
import com.example.horseracingtournamentsystem.wallet.dto.AdminWithdrawalSummaryResponse;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalResponse;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalService;
import com.example.horseracingtournamentsystem.wallet.service.AdminWithdrawalQueryService;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/withdrawals")
@RequiredArgsConstructor
public class AdminWithdrawalController {

    private final WithdrawalService withdrawalService;
    private final AdminWithdrawalQueryService queryService;

    @GetMapping
    public ResponseEntity<Page<AdminWithdrawalRowResponse>> list(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "status", required = false) WithdrawalStatus status,
            @RequestParam(value = "risk", required = false) WithdrawalRiskLevel risk,
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "sort", defaultValue = "newest") String sort,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(queryService.search(query, status, risk, from, to, sort, page, size));
    }

    @GetMapping("/summary")
    public ResponseEntity<AdminWithdrawalSummaryResponse> summary() {
        return ResponseEntity.ok(queryService.summary());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<WithdrawalResponse> approve(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(WithdrawalResponse.from(withdrawalService.approve(id, authentication.getName())));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<WithdrawalResponse> reject(
            @PathVariable Long id,
            @RequestBody RejectWithdrawalRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                WithdrawalResponse.from(withdrawalService.reject(id, authentication.getName(), request.note())));
    }

    @PostMapping("/{id}/mark-paid")
    public ResponseEntity<WithdrawalResponse> markPaid(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(WithdrawalResponse.from(withdrawalService.markPaid(id, authentication.getName())));
    }
}
