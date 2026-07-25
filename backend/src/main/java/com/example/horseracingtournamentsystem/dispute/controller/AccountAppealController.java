package com.example.horseracingtournamentsystem.dispute.controller;

import com.example.horseracingtournamentsystem.dispute.dto.AccountAppealResponse;
import com.example.horseracingtournamentsystem.dispute.dto.CreateAccountAppealRequest;
import com.example.horseracingtournamentsystem.dispute.service.AccountAppealService;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/me/account-appeal")
@RequiredArgsConstructor
public class AccountAppealController {

    private final AccountAppealService accountAppealService;
    private final UserRepository userRepository;

    @GetMapping
    public AccountAppealResponse get(Authentication authentication) {
        return accountAppealService.getCurrent(currentUser(authentication));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountAppealResponse create(
            @Valid @RequestBody CreateAccountAppealRequest request, Authentication authentication) {
        return accountAppealService.create(currentUser(authentication), request);
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
