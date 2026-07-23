package com.example.horseracingtournamentsystem.wallet.controller;

import com.example.horseracingtournamentsystem.wallet.dto.RejectWithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.dto.ApproveWithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.dto.AdminWithdrawalRowResponse;
import com.example.horseracingtournamentsystem.wallet.dto.AdminWithdrawalReviewResponse;
import com.example.horseracingtournamentsystem.wallet.dto.AdminWithdrawalSummaryResponse;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalExportFilter;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalExportPreviewResponse;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalService;
import com.example.horseracingtournamentsystem.wallet.service.AdminWithdrawalQueryService;
import com.example.horseracingtournamentsystem.wallet.service.AdminWithdrawalReviewService;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalExportService;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalPaymentService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/v1/admin/withdrawals")
@RequiredArgsConstructor
public class AdminWithdrawalController {

    private final WithdrawalService withdrawalService;
    private final AdminWithdrawalQueryService queryService;
    private final AdminWithdrawalReviewService reviewService;
    private final WithdrawalExportService exportService;
    private final WithdrawalPaymentService paymentService;
    private final UserRepository userRepository;

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

    @GetMapping("/export/preview")
    public ResponseEntity<WithdrawalExportPreviewResponse> exportPreview(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "status", required = false) WithdrawalStatus status,
            @RequestParam(value = "risk", required = false) WithdrawalRiskLevel risk,
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "sort", defaultValue = "newest") String sort
    ) {
        return ResponseEntity.ok(exportService.preview(
                new WithdrawalExportFilter(query, status, risk, from, to, sort)));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "status", required = false) WithdrawalStatus status,
            @RequestParam(value = "risk", required = false) WithdrawalRiskLevel risk,
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "sort", defaultValue = "newest") String sort,
            Authentication authentication
    ) {
        WithdrawalExportFilter filter = new WithdrawalExportFilter(query, status, risk, from, to, sort);
        byte[] workbook = exportService.export(filter, currentAdmin(authentication));
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HHmmss"));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"withdrawals-" + timestamp + ".xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(workbook);
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
                request.internalNote(),
                Boolean.TRUE.equals(request.noTransferConfirmed()));
        return ResponseEntity.ok(reviewService.get(id));
    }

    @PostMapping(value = "/{id}/mark-paid", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminWithdrawalReviewResponse> markPaid(
            @PathVariable Long id,
            @RequestParam String transferReference,
            @RequestParam(defaultValue = "") String internalNote,
            @RequestParam(defaultValue = "false") boolean mismatchAcknowledged,
            @RequestParam String idempotencyKey,
            @RequestPart("receipt") MultipartFile receipt,
            Authentication authentication
    ) {
        return ResponseEntity.ok(paymentService.confirm(
                id,
                authentication.getName(),
                transferReference,
                internalNote,
                mismatchAcknowledged,
                idempotencyKey,
                receipt));
    }

    private User currentAdmin(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Administrator not found"));
    }
}
