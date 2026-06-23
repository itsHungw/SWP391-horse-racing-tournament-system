package com.example.horseracingtournamentsystem.wallet.controller;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.wallet.dto.WalletResponse;
import com.example.horseracingtournamentsystem.wallet.dto.WalletTransactionResponse;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<WalletResponse> getMyWallet(Authentication authentication) {
        User user = currentUser(authentication);
        return ResponseEntity.ok(WalletResponse.from(walletService.getOrCreateAccount(user)));
    }

    @GetMapping("/me/transactions")
    public ResponseEntity<List<WalletTransactionResponse>> getMyTransactions(Authentication authentication) {
        User user = currentUser(authentication);
        return ResponseEntity.ok(
                walletService.getTransactions(user.getId()).stream()
                        .map(WalletTransactionResponse::from)
                        .toList()
        );
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
