package com.example.horseracingtournamentsystem.blog.repository;

import com.example.horseracingtournamentsystem.blog.entity.UserDailyPointLimit;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserDailyPointLimitRepository extends JpaRepository<UserDailyPointLimit, Long> {
    Optional<UserDailyPointLimit> findByUserIdAndPointDate(Long userId, LocalDate pointDate);
}
