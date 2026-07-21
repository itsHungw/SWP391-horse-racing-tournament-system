package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.UserBankAccount;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserBankAccountRepository extends JpaRepository<UserBankAccount, Long> {
    List<UserBankAccount> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserId(Long userId);

    Optional<UserBankAccount> findByIdAndUserId(Long id, Long userId);

    @Query("""
            select count(distinct account.user.id)
            from UserBankAccount account
            where upper(account.bankCode) = upper(:bankCode)
              and account.accountNumber = :accountNumber
            """)
    long countDistinctOwnersByBankIdentity(
            @Param("bankCode") String bankCode,
            @Param("accountNumber") String accountNumber);
}
