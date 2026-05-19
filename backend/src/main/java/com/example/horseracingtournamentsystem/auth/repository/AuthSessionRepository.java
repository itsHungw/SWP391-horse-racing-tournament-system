package com.example.horseracingtournamentsystem.auth.repository;

import com.example.horseracingtournamentsystem.auth.entity.AuthSession;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {

    Optional<AuthSession> findByRefreshTokenHashAndRevokedAtIsNull(String refreshTokenHash);

    List<AuthSession> findByUserIdAndRevokedAtIsNull(Long userId);
}
