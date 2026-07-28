package com.example.horseracingtournamentsystem.user.controller;

import com.example.horseracingtournamentsystem.user.dto.response.AccountRestrictionResponse;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserStatusHistory;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserStatusHistoryRepository;
import com.example.horseracingtournamentsystem.wallet.entity.WalletStatus;
import com.example.horseracingtournamentsystem.wallet.repository.WalletRepository;
import com.example.horseracingtournamentsystem.wallet.entity.WalletStatusHistory;
import com.example.horseracingtournamentsystem.wallet.repository.WalletStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/me/account-restriction")
@RequiredArgsConstructor
public class AccountRestrictionController {

    private final UserRepository userRepository;
    private final UserStatusHistoryRepository historyRepository;
    private final WalletRepository walletRepository;
    private final WalletStatusHistoryRepository walletHistoryRepository;

    @GetMapping
    public AccountRestrictionResponse get(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        UserStatusHistory latest = historyRepository.findByUserIdOrderByChangedAtDescIdDesc(user.getId()).stream()
                .findFirst().orElse(null);
        WalletStatus walletStatus = walletRepository.findById(user.getId())
                .map(wallet -> wallet.getStatus()).orElse(WalletStatus.ACTIVE);
        WalletStatusHistory walletDecision = walletHistoryRepository
                .findByUserIdOrderByChangedAtDescIdDesc(user.getId()).stream()
                .findFirst().orElse(null);
        return new AccountRestrictionResponse(
                user.getStatus(), latest == null ? null : latest.getPublicReason(),
                latest == null ? null : latest.getChangedAt(), walletStatus,
                walletDecision == null ? null : walletDecision.getPublicReason(),
                walletDecision == null ? null : walletDecision.getChangedAt());
    }
}
