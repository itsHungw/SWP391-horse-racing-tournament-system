package com.example.horseracingtournamentsystem.wallet.controller;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.wallet.dto.BankAccountResponse;
import com.example.horseracingtournamentsystem.wallet.dto.CreateBankAccountRequest;
import com.example.horseracingtournamentsystem.wallet.service.BankAccountService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/wallet/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService bankAccountService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<BankAccountResponse>> list(Authentication authentication) {
        User user = currentUser(authentication);
        return ResponseEntity.ok(
                bankAccountService.listMine(user.getId()).stream().map(BankAccountResponse::from).toList());
    }

    @PostMapping
    public ResponseEntity<BankAccountResponse> add(
            @RequestBody CreateBankAccountRequest request,
            Authentication authentication
    ) {
        User user = currentUser(authentication);
        return ResponseEntity.ok(BankAccountResponse.from(bankAccountService.add(user, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable Long id, Authentication authentication) {
        bankAccountService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
