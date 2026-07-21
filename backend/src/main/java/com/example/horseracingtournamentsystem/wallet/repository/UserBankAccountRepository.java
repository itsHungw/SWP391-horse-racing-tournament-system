package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.UserBankAccount;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBankAccountRepository extends JpaRepository<UserBankAccount, Long> {
    List<UserBankAccount> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserId(Long userId);

    Optional<UserBankAccount> findByIdAndUserId(Long id, Long userId);
}
