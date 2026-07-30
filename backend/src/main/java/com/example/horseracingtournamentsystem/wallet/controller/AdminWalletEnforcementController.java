package com.example.horseracingtournamentsystem.wallet.controller;

import com.example.horseracingtournamentsystem.user.dto.request.AccountStatusTransitionRequest;
import com.example.horseracingtournamentsystem.wallet.dto.AdminWalletCreditRequest;
import com.example.horseracingtournamentsystem.wallet.dto.AdminWalletCreditResponse;
import com.example.horseracingtournamentsystem.wallet.dto.AdminWalletTransactionResponse;
import com.example.horseracingtournamentsystem.wallet.dto.WalletControlResponse;
import com.example.horseracingtournamentsystem.wallet.dto.WalletStatusHistoryResponse;
import com.example.horseracingtournamentsystem.wallet.service.WalletEnforcementService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users/{userId}")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Validated
public class AdminWalletEnforcementController {

    private final WalletEnforcementService service;

    @GetMapping("/wallet-control")
    public ResponseEntity<WalletControlResponse> getControl(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getControl(userId));
    }

    @PostMapping("/wallet/credit")
    public ResponseEntity<AdminWalletCreditResponse> credit(
            @PathVariable Long userId,
            @Valid @RequestBody AdminWalletCreditRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(service.credit(userId, request, authentication.getName()));
    }

    @GetMapping("/wallet-transactions")
    public ResponseEntity<Page<AdminWalletTransactionResponse>> transactions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(service.transactions(userId, PageRequest.of(page, size)));
    }

    @PostMapping("/wallet/lock")
    public ResponseEntity<WalletControlResponse> lock(
            @PathVariable Long userId, @Valid @RequestBody AccountStatusTransitionRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(service.lock(userId, request, authentication.getName()));
    }

    @PostMapping("/wallet/unlock")
    public ResponseEntity<WalletControlResponse> unlock(
            @PathVariable Long userId, @Valid @RequestBody AccountStatusTransitionRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(service.unlock(userId, request, authentication.getName()));
    }

    @GetMapping("/wallet-status-history")
    public ResponseEntity<List<WalletStatusHistoryResponse>> history(@PathVariable Long userId) {
        return ResponseEntity.ok(service.history(userId));
    }
}
