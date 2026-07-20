package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.TopUpOrder;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopUpOrderRepository extends JpaRepository<TopUpOrder, Long> {
    Optional<TopUpOrder> findByVnpayTxnRef(String vnpayTxnRef);
    Optional<TopUpOrder> findByVnpayTxnRefAndUserId(String vnpayTxnRef, Long userId);
}
