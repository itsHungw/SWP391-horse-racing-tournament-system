package com.example.horseracingtournamentsystem.wallet.controller;

import com.example.horseracingtournamentsystem.user.dto.request.AccountStatusTransitionRequest;
import com.example.horseracingtournamentsystem.wallet.dto.WalletControlResponse;
import com.example.horseracingtournamentsystem.wallet.dto.WalletStatusHistoryResponse;
import com.example.horseracingtournamentsystem.wallet.service.WalletEnforcementService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users/{userId}")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminWalletEnforcementController {

    private final WalletEnforcementService service;

    @GetMapping("/wallet-control")
    public ResponseEntity<WalletControlResponse> getControl(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getControl(userId));
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
