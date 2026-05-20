package com.example.horseracingtournamentsystem.auth.repository;

import com.example.horseracingtournamentsystem.auth.entity.EmailVerificationToken;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenHashAndUsedAtIsNull(String tokenHash);

    List<EmailVerificationToken> findByUserIdAndUsedAtIsNull(Long userId);
}
