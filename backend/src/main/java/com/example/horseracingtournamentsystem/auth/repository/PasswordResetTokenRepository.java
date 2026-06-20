package com.example.horseracingtournamentsystem.auth.repository;

import com.example.horseracingtournamentsystem.auth.entity.PasswordResetToken;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    List<PasswordResetToken> findByUserIdAndUsedAtIsNull(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select token from PasswordResetToken token
            where token.user.id = :userId
              and token.tokenHash = :tokenHash
              and token.usedAt is null
            """)
    Optional<PasswordResetToken> findActiveMatchingForUpdate(Long userId, String tokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select token from PasswordResetToken token
            where token.user.id = :userId
              and token.usedAt is null
            order by token.createdAt desc
            """)
    List<PasswordResetToken> findActiveForUpdate(Long userId, Pageable pageable);
}
