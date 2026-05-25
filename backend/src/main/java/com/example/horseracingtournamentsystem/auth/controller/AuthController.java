package com.example.horseracingtournamentsystem.auth.controller;

import com.example.horseracingtournamentsystem.auth.dto.request.LoginRequest;
import com.example.horseracingtournamentsystem.auth.dto.request.RegisterRequest;
import com.example.horseracingtournamentsystem.auth.dto.request.ResendEmailVerificationRequest;
import com.example.horseracingtournamentsystem.auth.dto.request.VerifyEmailRequest;
import com.example.horseracingtournamentsystem.auth.dto.response.LoginResponse;
import com.example.horseracingtournamentsystem.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
    }

    @PostMapping("/resend-verification-email")
    public void resendVerificationEmail(@Valid @RequestBody ResendEmailVerificationRequest request) {
        authService.resendVerificationEmail(request.email());
    }

    @PostMapping("/verify-email")
    public void verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request.token());
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
