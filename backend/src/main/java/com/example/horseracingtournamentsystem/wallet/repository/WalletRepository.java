package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.Wallet;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WalletRepository extends JpaRepository<Wallet, Long> {

    @Query("select coalesce(sum(w.balance), 0) from Wallet w")
    long sumAllBalances();

    /**
     * Khóa row ví (SELECT ... FOR UPDATE) để chống lost-update khi 2 thao tác tiền
     * tranh cùng một ví. Dùng trong {@code WalletService.adjust}.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from Wallet w where w.userId = :userId")
    Optional<Wallet> lockByUserId(@Param("userId") Long userId);
}
