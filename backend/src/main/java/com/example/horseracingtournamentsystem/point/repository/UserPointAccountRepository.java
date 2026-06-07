package com.example.horseracingtournamentsystem.point.repository;

import com.example.horseracingtournamentsystem.point.entity.UserPointAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPointAccountRepository extends JpaRepository<UserPointAccount, Long> {
}
