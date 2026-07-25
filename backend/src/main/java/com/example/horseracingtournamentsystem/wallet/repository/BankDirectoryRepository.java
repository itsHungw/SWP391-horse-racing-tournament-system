package com.example.horseracingtournamentsystem.wallet.repository;

import com.example.horseracingtournamentsystem.wallet.entity.BankDirectory;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BankDirectoryRepository extends JpaRepository<BankDirectory, Long> {

    Optional<BankDirectory> findByCodeIgnoreCaseAndActiveTrue(String code);

    List<BankDirectory> findByActiveTrueOrderByDisplayNameAsc();
}
