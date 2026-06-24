package com.example.horseracingtournamentsystem.wallet.controller;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.wallet.dto.CreateWithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalResponse;
import com.example.horseracingtournamentsystem.wallet.service.WithdrawalService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/wallet/withdrawals")
@RequiredArgsConstructor
public class WithdrawalController {

    private final WithdrawalService withdrawalService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<WithdrawalResponse> create(
            @RequestBody CreateWithdrawalRequest request,
            Authentication authentication
    ) {
        User user = currentUser(authentication);
        return ResponseEntity.ok(
                WithdrawalResponse.from(withdrawalService.createRequest(user, request.amount(), request.bankInfo())));
    }

    @GetMapping
    public ResponseEntity<List<WithdrawalResponse>> mine(Authentication authentication) {
        User user = currentUser(authentication);
        return ResponseEntity.ok(
                withdrawalService.listMine(user.getId()).stream().map(WithdrawalResponse::from).toList());
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<WithdrawalResponse> cancel(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(WithdrawalResponse.from(withdrawalService.cancel(id, authentication.getName())));
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
