package com.example.horseracingtournamentsystem.auth.service;

import com.example.horseracingtournamentsystem.auth.dto.request.LoginRequest;
import com.example.horseracingtournamentsystem.auth.dto.request.RegisterRequest;
import com.example.horseracingtournamentsystem.auth.dto.response.LoginResponse;
import com.example.horseracingtournamentsystem.auth.email.EmailSender;
import com.example.horseracingtournamentsystem.auth.entity.EmailVerificationToken;
import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    
    private final PasswordEncoder passwordEncoder;
    private final OneTimeTokenService oneTimeTokenService;
    private final EmailSender emailSender;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("INVALID_CREDENTIALS"));

        if (User.STATUS_PENDING_EMAIL_VERIFY.equals(user.getStatus())) {
            throw new IllegalArgumentException("EMAIL_NOT_VERIFIED");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("INVALID_CREDENTIALS");
        }

        String accessToken = jwtService.generateToken(user.getEmail(), user.getActiveRoleNames());
        return new LoginResponse(accessToken, user.getFullName(), user.getEmail());
    }
  
    @Transactional
    public void register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        User existingUser = userRepository.findByEmail(email).orElse(null);
        if (existingUser != null) {
            if (User.STATUS_PENDING_EMAIL_VERIFY.equals(existingUser.getStatus())) {
                sendVerificationEmail(existingUser);
                return;
            }
            throw new IllegalArgumentException("EMAIL_ALREADY_EXISTS");
        }

        User user = userRepository.save(User.pending(
                request.fullName().trim(),
                email,
                passwordEncoder.encode(request.password()),
                normalizeOptionalPhone(request.phone())
        ));
        Role spectator = roleRepository.findByName("SPECTATOR")
                .orElseThrow(() -> new IllegalStateException("SPECTATOR_ROLE_NOT_CONFIGURED"));
        userRoleRepository.save(UserRole.active(user, spectator, null));
        sendVerificationEmail(user);
    }

    private void sendVerificationEmail(User user) {
        String rawToken = oneTimeTokenService.createEmailVerificationToken(user);
        emailSender.sendEmailVerification(user.getEmail(), rawToken);
    }

    @Transactional
    public void resendVerificationEmail(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        userRepository.findByEmail(email)
                .filter(user -> User.STATUS_PENDING_EMAIL_VERIFY.equals(user.getStatus()))
                .ifPresent(user -> {
                    String rawToken = oneTimeTokenService.createEmailVerificationToken(user);
                    emailSender.sendEmailVerification(user.getEmail(), rawToken);
                });
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        EmailVerificationToken token = oneTimeTokenService.consumeEmailVerificationToken(rawToken);
        token.getUser().verifyEmail();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeOptionalPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        return phone.trim();
    }
}
