package com.example.horseracingtournamentsystem.wallet.controller;

import com.example.horseracingtournamentsystem.wallet.dto.RejectWithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalResponse;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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

    @GetMapping
    public ResponseEntity<List<WithdrawalResponse>> list(
            @RequestParam(value = "status", required = false) WithdrawalStatus status
    ) {
        return ResponseEntity.ok(
                withdrawalService.listForAdmin(status).stream().map(WithdrawalResponse::from).toList());
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
