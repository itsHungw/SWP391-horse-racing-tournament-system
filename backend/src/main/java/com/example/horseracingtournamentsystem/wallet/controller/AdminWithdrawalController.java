package com.example.horseracingtournamentsystem.wallet.controller;

import com.example.horseracingtournamentsystem.wallet.dto.RejectWithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.dto.ApproveWithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.dto.AdminWithdrawalRowResponse;
import com.example.horseracingtournamentsystem.wallet.dto.AdminWithdrawalReviewResponse;
import com.example.horseracingtournamentsystem.wallet.dto.AdminWithdrawalSummaryResponse;
import com.example.horseracingtournamentsystem.wallet.dto.MarkWithdrawalPaidRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalService;
import com.example.horseracingtournamentsystem.wallet.service.AdminWithdrawalQueryService;
import com.example.horseracingtournamentsystem.wallet.service.AdminWithdrawalReviewService;
import jakarta.validation.Valid;
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
    private final AdminWithdrawalReviewService reviewService;

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

    @GetMapping("/{id}")
    public ResponseEntity<AdminWithdrawalReviewResponse> review(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.get(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<AdminWithdrawalReviewResponse> approve(
            @PathVariable Long id,
            @Valid @RequestBody ApproveWithdrawalRequest request,
            Authentication authentication
    ) {
        withdrawalService.approve(
                id, authentication.getName(), request.riskAcknowledged(), request.internalNote());
        return ResponseEntity.ok(reviewService.get(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<AdminWithdrawalReviewResponse> reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectWithdrawalRequest request,
            Authentication authentication
    ) {
        withdrawalService.reject(
                id,
                authentication.getName(),
                request.publicReason(),
                request.internalNote());
        return ResponseEntity.ok(reviewService.get(id));
    }

    @PostMapping("/{id}/mark-paid")
    public ResponseEntity<AdminWithdrawalReviewResponse> markPaid(
            @PathVariable Long id,
            @Valid @RequestBody MarkWithdrawalPaidRequest request,
            Authentication authentication
    ) {
        withdrawalService.markPaid(
                id, authentication.getName(), request.transferReference(), request.internalNote());
        return ResponseEntity.ok(reviewService.get(id));
    }
}
