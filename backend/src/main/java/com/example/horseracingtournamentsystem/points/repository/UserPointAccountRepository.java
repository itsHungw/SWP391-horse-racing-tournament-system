package com.example.horseracingtournamentsystem.points.repository;

import com.example.horseracingtournamentsystem.points.entity.UserPointAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserPointAccountRepository extends JpaRepository<UserPointAccount, Long> {
}
